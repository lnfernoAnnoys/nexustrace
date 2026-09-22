import { Router } from "express";
import { z } from "zod";
import { MAX_ACCESS_LEVEL, MIN_ACCESS_LEVEL } from "../config.ts";
import { listAudit, logAudit } from "../audit.ts";
import {
  countPendingRequests,
  decideRequest,
  getRequest,
  listRequests,
  listRequestsByUser,
  pendingRequestByUser,
  readFile,
  type RequestStatus,
} from "../access.ts";
import { getAuth, requireStage } from "../middleware.ts";
import { listSignupFiles, readSignupFile } from "../signupFiles.ts";
import {
  adminUpdateIdentity,
  approveSignup,
  banUser,
  countAdmins,
  countPendingSignups,
  deleteUser,
  getUserById,
  listPendingSignups,
  listUsers,
  setAccessLevel,
  unbanUser,
  type UserRow,
} from "../users.ts";

/** The admin console API. Every route needs a fully signed-in administrator (see requireStage). */
export const adminRouter = Router();
adminRouter.use(requireStage("full"));

const idSchema = z.coerce.number().int().positive();
const levelSchema = z.coerce
  .number("Choose an access level")
  .int("Access level must be a whole number")
  .min(MIN_ACCESS_LEVEL, `The lowest level is ${MIN_ACCESS_LEVEL}`)
  .max(MAX_ACCESS_LEVEL, `The highest level is ${MAX_ACCESS_LEVEL}`);
const noteSchema = z.string().trim().max(500, "The note is too long (500 characters at most)");

function adminUserView(user: UserRow, pending?: { id: number; requestedLevel: number }) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    badge: user.badge,
    department: user.department,
    position: user.position,
    email: user.email,
    role: user.role,
    accessLevel: user.access_level,
    status: user.status,
    banReason: user.ban_reason,
    twoFactorEnabled: user.totp_enabled === 1,
    createdAt: user.created_at,
    pendingRequest: pending ?? null,
  };
}

adminRouter.get("/overview", (_req, res) => {
  const users = listUsers();
  const levelCounts = Array.from({ length: MAX_ACCESS_LEVEL }, () => 0);
  for (const u of users) levelCounts[u.access_level - 1]++;
  res.json({
    totalUsers: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    twoFactorEnabled: users.filter((u) => u.totp_enabled === 1).length,
    pendingRequests: countPendingRequests(),
    pendingSignups: countPendingSignups(),
    levelCounts,
    waiting: listRequests("pending").slice(0, 5),
    recentActivity: listAudit(6),
  });
});

// --- accounts waiting for their sign-up to be approved --------------------------

function pendingSignupView(user: UserRow) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    department: user.department,
    position: user.position,
    email: user.email,
    createdAt: user.created_at,
    files: listSignupFiles(user.id),
  };
}

adminRouter.get("/pending-signups", (_req, res) => {
  res.json({ users: listPendingSignups().map(pendingSignupView) });
});

adminRouter.get("/pending-signups/:id/files/:fileId", (req, res) => {
  const userId = idSchema.parse(req.params.id);
  const file = readSignupFile(userId, idSchema.parse(req.params.fileId));
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  const disposition = req.query.download === "1" ? "attachment" : "inline";
  res.setHeader("Content-Type", file.mime);
  res.setHeader("Content-Disposition", `${disposition}; filename*=UTF-8''${encodeURIComponent(file.name)}`);
  if (file.mime === "application/pdf") res.removeHeader("Content-Security-Policy");
  else res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'");
  res.send(file.data);
});

adminRouter.post("/pending-signups/:id/approve", (req, res) => {
  const { user: admin } = getAuth(res);
  const target = getUserById(idSchema.parse(req.params.id));
  if (!target || target.status !== "pending_approval") {
    res.status(404).json({ error: "No pending sign-up found" });
    return;
  }
  approveSignup(target.id, admin.name);
  logAudit(admin, "signup_approved", target, {});
  res.json({ users: listPendingSignups().map(pendingSignupView) });
});

adminRouter.post("/pending-signups/:id/deny", (req, res) => {
  const { user: admin } = getAuth(res);
  const target = getUserById(idSchema.parse(req.params.id));
  if (!target || target.status !== "pending_approval") {
    res.status(404).json({ error: "No pending sign-up found" });
    return;
  }
  const { note } = z.object({ note: noteSchema.min(3, "Add a short reason so it's on record") }).parse(req.body);
  // they never signed in, so there is nothing to keep — denying a sign-up removes it outright
  logAudit(admin, "signup_denied", target, { note });
  deleteUser(target.id);
  res.json({ users: listPendingSignups().map(pendingSignupView) });
});

// --- suspending, removing and correcting an existing account --------------------

const banSchema = z.object({ reason: noteSchema.min(3, "Add a short reason so it's on record") });
const identitySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  badge: z.string().trim().max(32),
  department: z.string().trim().max(80),
  position: z.string().trim().max(80),
});

/** An admin can't lock themselves out, and the last administrator can't be banned or deleted from here. */
function guardTarget(admin: UserRow, target: UserRow): string | null {
  if (target.id === admin.id) return "You can't do that to your own account.";
  if (target.role === "admin" && countAdmins() <= 1) return "This is the only administrator left; promote someone else first.";
  return null;
}

adminRouter.post("/users/:id/ban", (req, res) => {
  const { user: admin } = getAuth(res);
  const target = getUserById(idSchema.parse(req.params.id));
  if (!target) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  const problem = guardTarget(admin, target);
  if (problem) {
    res.status(400).json({ error: problem });
    return;
  }
  const { reason } = banSchema.parse(req.body);
  banUser(target.id, reason);
  logAudit(admin, "account_banned", target, { reason });
  res.json({ user: adminUserView(getUserById(target.id)!, pendingRequestByUser().get(target.id)) });
});

adminRouter.post("/users/:id/unban", (req, res) => {
  const { user: admin } = getAuth(res);
  const target = getUserById(idSchema.parse(req.params.id));
  if (!target) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  unbanUser(target.id);
  logAudit(admin, "account_unbanned", target, {});
  res.json({ user: adminUserView(getUserById(target.id)!, pendingRequestByUser().get(target.id)) });
});

adminRouter.delete("/users/:id", (req, res) => {
  const { user: admin } = getAuth(res);
  const target = getUserById(idSchema.parse(req.params.id));
  if (!target) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  const problem = guardTarget(admin, target);
  if (problem) {
    res.status(400).json({ error: problem });
    return;
  }
  logAudit(admin, "account_deleted", target, { username: target.username });
  deleteUser(target.id);
  res.json({ ok: true });
});

adminRouter.patch("/users/:id/identity", (req, res) => {
  const { user: admin } = getAuth(res);
  const target = getUserById(idSchema.parse(req.params.id));
  if (!target) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  const fields = identitySchema.parse(req.body);
  adminUpdateIdentity(target.id, fields);
  logAudit(admin, "identity_changed", target, {
    before: { name: target.name, badge: target.badge, department: target.department, position: target.position },
    after: fields,
  });
  const updated = getUserById(target.id)!;
  res.json({ user: adminUserView(updated, pendingRequestByUser().get(target.id)) });
});

// --- accounts -------------------------------------------------------------------

adminRouter.get("/users", (_req, res) => {
  const pending = pendingRequestByUser();
  res.json({ users: listUsers().map((u) => adminUserView(u, pending.get(u.id))) });
});

adminRouter.get("/users/:id", (req, res) => {
  const user = getUserById(idSchema.parse(req.params.id));
  if (!user) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  const pending = pendingRequestByUser().get(user.id);
  res.json({
    user: adminUserView(user, pending),
    requests: listRequestsByUser(user.id),
    activity: listAudit(30, user.id),
  });
});

adminRouter.patch("/users/:id/access", (req, res) => {
  const { user: admin } = getAuth(res);
  const target = getUserById(idSchema.parse(req.params.id));
  if (!target) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  const { level, note } = z.object({ level: levelSchema, note: noteSchema.optional() }).parse(req.body);

  if (level === target.access_level) {
    res.status(400).json({ error: `${target.name} is already at level ${level}.` });
    return;
  }
  setAccessLevel(target.id, level);
  logAudit(admin, "level_changed", target, { from: target.access_level, to: level, note: note ?? "" });

  const updated = getUserById(target.id)!;
  res.json({ user: adminUserView(updated, pendingRequestByUser().get(target.id)) });
});

// --- access requests ------------------------------------------------------------

const statusSchema = z.enum(["pending", "approved", "denied", "cancelled"]);

adminRouter.get("/requests", (req, res) => {
  const raw = typeof req.query.status === "string" ? req.query.status : "";
  const status: RequestStatus | undefined = raw && raw !== "all" ? statusSchema.parse(raw) : undefined;
  res.json({ requests: listRequests(status), pending: countPendingRequests() });
});

adminRouter.get("/requests/:id", (req, res) => {
  const request = getRequest(idSchema.parse(req.params.id));
  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  res.json({ request });
});

adminRouter.get("/requests/:id/files/:fileId", (req, res) => {
  const requestId = idSchema.parse(req.params.id);
  const file = readFile(requestId, idSchema.parse(req.params.fileId));
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  const disposition = req.query.download === "1" ? "attachment" : "inline";
  res.setHeader("Content-Type", file.mime);
  res.setHeader("Content-Disposition", `${disposition}; filename*=UTF-8''${encodeURIComponent(file.name)}`);
  // Only PDF/PNG/JPEG get this far (checked by content at upload), sent with nosniff. Images also get a
  // CSP that lets them do nothing else; it isn't applied to PDFs because it would stop the browser's PDF viewer.
  if (file.mime === "application/pdf") res.removeHeader("Content-Security-Policy");
  else res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'");
  res.send(file.data);
});

const decisionSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("approve"), level: levelSchema, note: noteSchema.optional() }),
  z.object({
    decision: z.literal("deny"),
    note: noteSchema.min(3, "Add a short reason so the person knows why"),
  }),
]);

adminRouter.post("/requests/:id/decision", (req, res) => {
  const { user: admin } = getAuth(res);
  const request = getRequest(idSchema.parse(req.params.id));
  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  if (request.status !== "pending") {
    res.status(409).json({ error: `This request was already ${request.status}.` });
    return;
  }
  const body = decisionSchema.parse(req.body);
  const target = getUserById(request.user.id)!;

  if (body.decision === "approve" && body.level <= target.access_level) {
    res.status(400).json({ error: `Choose a level above ${target.name}'s current level (${target.access_level}).` });
    return;
  }

  const approve = body.decision === "approve";
  const ok = decideRequest({
    id: request.id,
    userId: target.id,
    approve,
    grantedLevel: approve ? body.level : null,
    note: body.note ?? "",
    adminId: admin.id,
    adminName: admin.name,
  });
  if (!ok) {
    res.status(409).json({ error: "This request was just decided or withdrawn." });
    return;
  }

  logAudit(admin, approve ? "request_approved" : "request_denied", target, {
    requestId: request.id,
    from: target.access_level,
    requested: request.requestedLevel,
    ...(approve ? { to: body.level } : {}),
    note: body.note ?? "",
  });
  res.json({ request: getRequest(request.id) });
});

// --- audit log --------------------------------------------------------------------

adminRouter.get("/audit", (req, res) => {
  const limit = z.coerce.number().int().min(1).max(500).catch(200).parse(req.query.limit);
  res.json({ entries: listAudit(limit) });
});
