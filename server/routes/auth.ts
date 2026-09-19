import { Router, type Request, type Response } from "express";
import QRCode from "qrcode";
import { z } from "zod";
import {
  COOKIE_SECURE,
  LOCKOUT_MS,
  MAX_2FA_ATTEMPTS,
  MAX_LOGIN_FAILURES,
  SESSION_COOKIES,
  SIGNUP_OPEN,
  type Realm,
} from "../config.ts";
import { decrypt, encrypt } from "../crypto.ts";
import { codeLimiter, getAuth, loginLimiter, maybeAuth, requireStage, signupLimiter } from "../middleware.ts";
import {
  bumpAttempts,
  createSession,
  deleteOtherSessions,
  deleteSession,
  deleteSessionForUser,
  listFullSessions,
  promoteSession,
  type ClientMeta,
  type SessionRow,
} from "../sessions.ts";
import { checkTotp, newTotpSecret, totpUrl } from "../totp.ts";
import {
  activateTotp,
  clearFailedLogins,
  consumeBackupCode,
  createUser,
  getUserById,
  getUserByUsername,
  hashPassword,
  recordFailedLogin,
  replaceBackupCodes,
  savePendingTotp,
  setLastTotpStep,
  setPasswordHash,
  toPublicUser,
  updateProfile,
  verifyPassword,
} from "../users.ts";

// Compared against when the username doesn't exist, so response time doesn't reveal valid usernames.
const DUMMY_HASH = await hashPassword("not-a-real-password");

const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(200),
});
const codeSchema = z.object({ code: z.string().trim().min(1).max(32) });
const passwordSchema = z.object({ password: z.string().min(1).max(200) });
// bcrypt only looks at the first 72 bytes, so longer passwords are refused rather than silently truncated.
const newPassword = (label: string) =>
  z
    .string()
    .min(10, `${label} must be at least 10 characters`)
    .refine((p) => Buffer.byteLength(p) <= 72, `${label} is too long`);
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: newPassword("New password"),
});
const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Investigator ID must be at least 3 characters")
    .max(64)
    .regex(/^[A-Za-z0-9._@+-]+$/, "Investigator ID can only use letters, numbers and . _ @ + -"),
  name: z.string().trim().min(1, "Full name is required").max(80),
  password: newPassword("Password"),
});
const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  badge: z.string().trim().max(32),
  department: z.string().trim().max(80),
  email: z.union([z.literal(""), z.email().max(120)]),
});

function clientMeta(req: Request): ClientMeta {
  return { userAgent: String(req.headers["user-agent"] ?? "").slice(0, 300), ip: req.ip ?? "" };
}

function setSessionCookie(res: Response, realm: Realm, token: string, maxAgeMs: number): void {
  res.cookie(SESSION_COOKIES[realm], token, {
    httpOnly: true,
    sameSite: "lax",
    secure: COOKIE_SECURE,
    path: "/",
    maxAge: maxAgeMs,
  });
}

function clearSessionCookie(res: Response, realm: Realm): void {
  res.clearCookie(SESSION_COOKIES[realm], { httpOnly: true, sameSite: "lax", secure: COOKIE_SECURE, path: "/" });
}

/** Counts a wrong code against the pending session; too many kills it and forces a fresh sign-in. */
function rejectCode(res: Response, session: SessionRow, realm: Realm) {
  const attempts = bumpAttempts(session.id);
  if (attempts >= MAX_2FA_ATTEMPTS) {
    deleteSession(session.id);
    clearSessionCookie(res, realm);
    return res.status(401).json({ error: "Too many incorrect codes. Please sign in again.", restart: true });
  }
  return res
    .status(401)
    .json({ error: "That code is not valid, or was already used. Wait for a new code and try again." });
}

function describeUserAgent(ua: string): string {
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad|iOS/.test(ua)
        ? "iOS"
        : /Mac OS X|Macintosh/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  return `${os} · ${browser}`;
}

function displayIp(ip: string): string {
  return ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1" ? "This computer (localhost)" : ip || "Unknown";
}

/**
 * Sign-in routes. The investigator site and the admin console each get their own copy (a "realm"):
 * same password + 2FA flow, but separate cookies and sessions, and the admin realm only lets
 * administrators in and has no sign-up or account-settings routes.
 */
export function createAuthRouter(realm: Realm): Router {
  const router = Router();
  const isAdminRealm = realm === "admin";

  // --- sign in --------------------------------------------------------------

  router.post("/login", loginLimiter, async (req, res) => {
    const { username, password } = loginSchema.parse(req.body);

    // Any earlier session on this browser is dropped before a new sign-in starts.
    const existing = maybeAuth(res);
    if (existing) deleteSession(existing.session.id);

    const user = getUserByUsername(username);
    if (user && user.locked_until > Date.now()) {
      res.status(429).json({ error: "Too many failed attempts. This account is locked for a few minutes." });
      return;
    }

    const passwordOk = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !passwordOk) {
      if (user) recordFailedLogin(user.id, MAX_LOGIN_FAILURES, LOCKOUT_MS);
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    clearFailedLogins(user.id);
    // Said only after the password is right, so it doesn't reveal which accounts exist.
    if (isAdminRealm && user.role !== "admin") {
      res.status(403).json({ error: "This account does not have administrator access." });
      return;
    }
    const stage = user.totp_enabled ? "pending_verify" : "pending_enroll";
    const { token, maxAgeMs } = createSession(user.id, stage, clientMeta(req), realm);
    setSessionCookie(res, realm, token, maxAgeMs);
    res.json({ next: stage === "pending_verify" ? "verify" : "enroll" });
  });

  router.post("/logout", (_req, res) => {
    const auth = maybeAuth(res);
    if (auth) deleteSession(auth.session.id);
    clearSessionCookie(res, realm);
    res.json({ ok: true });
  });

  router.get("/me", requireStage("full"), (_req, res) => {
    res.json({ user: toPublicUser(getAuth(res).user) });
  });

  // --- two-factor: second step of sign-in -----------------------------------

  router.post("/2fa/verify", codeLimiter, requireStage("pending_verify"), (req, res) => {
    const { session, user } = getAuth(res);
    const { code } = codeSchema.parse(req.body);
    const cleaned = code.replace(/\s/g, "");

    let ok = false;
    if (/^\d{6}$/.test(cleaned) && user.totp_secret_enc) {
      const step = checkTotp(decrypt(user.totp_secret_enc), cleaned, user.last_totp_step);
      if (step !== null) {
        setLastTotpStep(user.id, step);
        ok = true;
      }
    } else if (!/^\d+$/.test(cleaned)) {
      ok = consumeBackupCode(user.id, cleaned);
    }

    if (!ok) {
      rejectCode(res, session, realm);
      return;
    }
    const { token, maxAgeMs } = promoteSession(session.id, user.id, clientMeta(req), realm);
    setSessionCookie(res, realm, token, maxAgeMs);
    res.json({ user: toPublicUser(user) });
  });

  // --- two-factor: first-time enrollment ------------------------------------

  router.post("/2fa/setup", requireStage("pending_enroll"), async (_req, res) => {
    const { user } = getAuth(res);
    let secret: string;
    if (user.totp_pending_enc) {
      secret = decrypt(user.totp_pending_enc);
    } else {
      secret = newTotpSecret();
      savePendingTotp(user.id, encrypt(secret));
    }
    const otpauthUrl = totpUrl(user.username, secret);
    const qr = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 240 });
    res.json({ qr, secret, otpauthUrl });
  });

  router.post("/2fa/enable", codeLimiter, requireStage("pending_enroll"), (req, res) => {
    const { session, user } = getAuth(res);
    const { code } = codeSchema.parse(req.body);

    if (!user.totp_pending_enc) {
      res.status(400).json({ error: "Start authenticator setup first." });
      return;
    }
    const step = /^\d{6}$/.test(code.replace(/\s/g, ""))
      ? checkTotp(decrypt(user.totp_pending_enc), code.replace(/\s/g, ""), user.last_totp_step)
      : null;
    if (step === null) {
      rejectCode(res, session, realm);
      return;
    }

    activateTotp(user.id, user.totp_pending_enc, step);
    const backupCodes = replaceBackupCodes(user.id);
    const { token, maxAgeMs } = promoteSession(session.id, user.id, clientMeta(req), realm);
    setSessionCookie(res, realm, token, maxAgeMs);
    res.json({ user: toPublicUser(getUserById(user.id)!), backupCodes });
  });

  if (isAdminRealm) return router;

  // --- investigator site only: sign-up and account settings -----------------

  router.get("/config", (_req, res) => {
    res.json({ signupOpen: SIGNUP_OPEN });
  });

  router.post("/signup", signupLimiter, async (req, res) => {
    if (!SIGNUP_OPEN) {
      res.status(403).json({ error: "Sign-up is closed. Ask an administrator for an account." });
      return;
    }
    const { username, name, password } = signupSchema.parse(req.body);

    const existing = maybeAuth(res);
    if (existing) deleteSession(existing.session.id);

    if (getUserByUsername(username)) {
      res.status(409).json({ error: "That Investigator ID is already taken. Choose another, or sign in." });
      return;
    }

    let user;
    try {
      user = await createUser({ username, password, name, email: username.includes("@") ? username : "" });
    } catch (err) {
      // two people picking the same ID at the same instant
      if ((err as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE") {
        res.status(409).json({ error: "That Investigator ID is already taken. Choose another, or sign in." });
        return;
      }
      throw err;
    }

    const { token, maxAgeMs } = createSession(user.id, "pending_enroll", clientMeta(req), realm);
    setSessionCookie(res, realm, token, maxAgeMs);
    res.json({ next: "enroll" });
  });

  router.post("/2fa/backup-codes/regenerate", requireStage("full"), async (req, res) => {
    const { user } = getAuth(res);
    const { password } = passwordSchema.parse(req.body);
    if (!(await verifyPassword(password, user.password_hash))) {
      res.status(401).json({ error: "Incorrect password" });
      return;
    }
    res.json({ backupCodes: replaceBackupCodes(user.id) });
  });

  router.patch("/profile", requireStage("full"), (req, res) => {
    const { user } = getAuth(res);
    const fields = profileSchema.parse(req.body);
    updateProfile(user.id, fields);
    res.json({ user: toPublicUser({ ...user, ...fields }) });
  });

  router.post("/change-password", requireStage("full"), async (req, res) => {
    const { session, user } = getAuth(res);
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    if (!(await verifyPassword(currentPassword, user.password_hash))) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
    if (currentPassword === newPassword) {
      res.status(400).json({ error: "New password must be different from the current one" });
      return;
    }
    setPasswordHash(user.id, await hashPassword(newPassword));
    deleteOtherSessions(user.id, session.id);
    res.json({ ok: true });
  });

  router.get("/sessions", requireStage("full"), (_req, res) => {
    const { session, user } = getAuth(res);
    res.json({
      sessions: listFullSessions(user.id, realm).map((s) => ({
        id: s.id,
        current: s.id === session.id,
        device: describeUserAgent(s.user_agent),
        ip: displayIp(s.ip),
        createdAt: s.created_at,
        lastSeen: s.last_seen,
      })),
    });
  });

  router.delete("/sessions/:id", requireStage("full"), (req, res) => {
    const { session, user } = getAuth(res);
    const id = String(req.params.id);
    if (id === session.id) {
      res.status(400).json({ error: "Use Sign out to end the current session" });
      return;
    }
    if (!deleteSessionForUser(id, user.id, realm)) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json({ ok: true });
  });

  return router;
}