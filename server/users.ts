import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "./db.ts";
import { BACKUP_CODE_COUNT } from "./config.ts";
import { hmac } from "./crypto.ts";

export type AccountStatus = "pending_approval" | "active" | "banned";

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  name: string;
  badge: string;
  department: string;
  position: string;
  email: string;
  role: "user" | "admin";
  access_level: number;
  status: AccountStatus;
  ban_reason: string;
  banned_at: number | null;
  approved_at: number | null;
  approved_by_name: string;
  totp_secret_enc: string | null;
  totp_pending_enc: string | null;
  totp_enabled: number;
  last_totp_step: number;
  failed_logins: number;
  locked_until: number;
  created_at: number;
  password_changed_at: number;
}

export interface PublicUser {
  id: number;
  username: string;
  name: string;
  badge: string;
  department: string;
  position: string;
  email: string;
  role: "user" | "admin";
  accessLevel: number;
  status: AccountStatus;
  twoFactorEnabled: boolean;
  backupCodesRemaining: number;
}

const BCRYPT_COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getUserByUsername(username: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username) as UserRow | undefined;
}

export function getUserById(id: number): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

export function countUsers(): number {
  return (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
}

export function listUsers(): UserRow[] {
  return db.prepare("SELECT * FROM users ORDER BY id").all() as UserRow[];
}

export function listPendingSignups(): UserRow[] {
  return db.prepare("SELECT * FROM users WHERE status = 'pending_approval' ORDER BY id").all() as UserRow[];
}

export function countPendingSignups(): number {
  return (db.prepare("SELECT COUNT(*) AS n FROM users WHERE status = 'pending_approval'").get() as { n: number }).n;
}

export async function createUser(input: {
  username: string;
  password: string;
  name: string;
  badge?: string;
  department?: string;
  position?: string;
  email?: string;
  /** Accounts made from the admin console or the CLI start active; public sign-up starts pending. */
  status?: AccountStatus;
}): Promise<UserRow> {
  const now = Date.now();
  const hash = await hashPassword(input.password);
  const result = db
    .prepare(
      `INSERT INTO users (username, password_hash, name, badge, department, position, email, status, created_at, password_changed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.username,
      hash,
      input.name,
      input.badge ?? "",
      input.department ?? "",
      input.position ?? "",
      input.email ?? "",
      input.status ?? "active",
      now,
      now,
    );
  return getUserById(Number(result.lastInsertRowid))!;
}

/** Lets a pending sign-up in. They can now sign in and will be asked to set up an authenticator. */
export function approveSignup(id: number, approvedByName: string): void {
  db.prepare("UPDATE users SET status = 'active', approved_at = ?, approved_by_name = ? WHERE id = ?").run(
    Date.now(),
    approvedByName,
    id,
  );
}

/**
 * Blocks sign-in without touching anything the person already did. Any session they currently hold
 * (either realm) is ended immediately, so a ban takes effect even if they're mid-session.
 */
export function banUser(id: number, reason: string): void {
  db.transaction(() => {
    db.prepare("UPDATE users SET status = 'banned', ban_reason = ?, banned_at = ? WHERE id = ?").run(reason, Date.now(), id);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  })();
}

export function unbanUser(id: number): void {
  db.prepare("UPDATE users SET status = 'active', ban_reason = '', banned_at = NULL WHERE id = ?").run(id);
}

/** Removes the account and everything tied to it (sessions, backup codes, requests, uploaded files). */
export function deleteUser(id: number): void {
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
}

export function countAdmins(): number {
  return (db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get() as { n: number }).n;
}

export function setAccessLevel(id: number, level: number): void {
  db.prepare("UPDATE users SET access_level = ? WHERE id = ?").run(level, id);
}

export function setRole(id: number, role: "user" | "admin"): void {
  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
  // an admin-console session must not outlive the role that allowed it
  if (role === "user") db.prepare("DELETE FROM sessions WHERE user_id = ? AND realm = 'admin'").run(id);
}

export function updateProfile(
  id: number,
  fields: { name: string; badge: string; department: string; email: string },
): void {
  db.prepare("UPDATE users SET name = ?, badge = ?, department = ?, email = ? WHERE id = ?").run(
    fields.name,
    fields.badge,
    fields.department,
    fields.email,
    id,
  );
}

/** An administrator correcting someone's identity fields (not email — that stays the account holder's own to change). */
export function adminUpdateIdentity(
  id: number,
  fields: { name: string; badge: string; department: string; position: string },
): void {
  db.prepare("UPDATE users SET name = ?, badge = ?, department = ?, position = ? WHERE id = ?").run(
    fields.name,
    fields.badge,
    fields.department,
    fields.position,
    id,
  );
}

export function setPasswordHash(id: number, hash: string): void {
  db.prepare(
    "UPDATE users SET password_hash = ?, password_changed_at = ?, failed_logins = 0, locked_until = 0 WHERE id = ?",
  ).run(hash, Date.now(), id);
}

export function recordFailedLogin(id: number, maxFailures: number, lockoutMs: number): void {
  const row = db.prepare("SELECT failed_logins FROM users WHERE id = ?").get(id) as { failed_logins: number };
  const failures = row.failed_logins + 1;
  if (failures >= maxFailures) {
    db.prepare("UPDATE users SET failed_logins = 0, locked_until = ? WHERE id = ?").run(Date.now() + lockoutMs, id);
  } else {
    db.prepare("UPDATE users SET failed_logins = ? WHERE id = ?").run(failures, id);
  }
}

export function clearFailedLogins(id: number): void {
  db.prepare("UPDATE users SET failed_logins = 0, locked_until = 0 WHERE id = ?").run(id);
}

export function remainingBackupCodes(userId: number): number {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM backup_codes WHERE user_id = ? AND used_at IS NULL")
    .get(userId) as { n: number };
  return row.n;
}

export function toPublicUser(user: UserRow): PublicUser {
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
    twoFactorEnabled: user.totp_enabled === 1,
    backupCodesRemaining: remainingBackupCodes(user.id),
  };
}

// --- backup codes -----------------------------------------------------------

// No 0/O/1/I so codes are easy to read back from paper.
const BACKUP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomBackupCode(): string {
  let code = "";
  for (let i = 0; i < 10; i++) code += BACKUP_ALPHABET[crypto.randomInt(BACKUP_ALPHABET.length)];
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

export function normalizeBackupCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Replaces all of a user's backup codes and returns the new plaintext codes (shown once). */
export function replaceBackupCodes(userId: number): string[] {
  const codes = Array.from({ length: BACKUP_CODE_COUNT }, randomBackupCode);
  const insert = db.prepare("INSERT INTO backup_codes (user_id, code_hash) VALUES (?, ?)");
  db.transaction(() => {
    db.prepare("DELETE FROM backup_codes WHERE user_id = ?").run(userId);
    for (const code of codes) insert.run(userId, hmac(normalizeBackupCode(code)));
  })();
  return codes;
}

/** Marks a matching unused backup code as used. Returns true if one was consumed. */
export function consumeBackupCode(userId: number, input: string): boolean {
  const result = db
    .prepare("UPDATE backup_codes SET used_at = ? WHERE user_id = ? AND code_hash = ? AND used_at IS NULL")
    .run(Date.now(), userId, hmac(normalizeBackupCode(input)));
  return result.changes === 1;
}

// --- two-factor state -------------------------------------------------------

export function savePendingTotp(userId: number, encryptedSecret: string): void {
  db.prepare("UPDATE users SET totp_pending_enc = ? WHERE id = ?").run(encryptedSecret, userId);
}

export function activateTotp(userId: number, encryptedSecret: string, step: number): void {
  db.prepare(
    "UPDATE users SET totp_secret_enc = ?, totp_pending_enc = NULL, totp_enabled = 1, last_totp_step = ? WHERE id = ?",
  ).run(encryptedSecret, step, userId);
}

export function setLastTotpStep(userId: number, step: number): void {
  db.prepare("UPDATE users SET last_totp_step = ? WHERE id = ?").run(step, userId);
}

export function resetTwoFactor(userId: number): void {
  db.transaction(() => {
    db.prepare(
      "UPDATE users SET totp_secret_enc = NULL, totp_pending_enc = NULL, totp_enabled = 0, last_totp_step = 0 WHERE id = ?",
    ).run(userId);
    db.prepare("DELETE FROM backup_codes WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  })();
}
