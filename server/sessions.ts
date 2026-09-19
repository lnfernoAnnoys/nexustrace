import crypto from "node:crypto";
import { db } from "./db.ts";
import { FULL_SESSION_MS, PENDING_SESSION_MS, type Realm } from "./config.ts";
import { randomToken, sha256 } from "./crypto.ts";

export type Stage = "pending_verify" | "pending_enroll" | "full";

export interface SessionRow {
  id: string;
  token_hash: string;
  user_id: number;
  stage: Stage;
  realm: Realm;
  attempts: number;
  created_at: number;
  last_seen: number;
  expires_at: number;
  user_agent: string;
  ip: string;
}

export interface ClientMeta {
  userAgent: string;
  ip: string;
}

const TOUCH_INTERVAL_MS = 60_000;

/** Creates a session and returns the raw token (only its hash is stored). */
export function createSession(
  userId: number,
  stage: Stage,
  meta: ClientMeta,
  realm: Realm,
): { token: string; maxAgeMs: number } {
  const token = randomToken();
  const now = Date.now();
  const maxAgeMs = stage === "full" ? FULL_SESSION_MS[realm] : PENDING_SESSION_MS;
  db.prepare(
    `INSERT INTO sessions (id, token_hash, user_id, stage, realm, created_at, last_seen, expires_at, user_agent, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(crypto.randomUUID(), sha256(token), userId, stage, realm, now, now, now + maxAgeMs, meta.userAgent, meta.ip);
  return { token, maxAgeMs };
}

/** A token only works in the realm it was issued for. */
export function findSessionByToken(token: string, realm: Realm): SessionRow | undefined {
  const session = db.prepare("SELECT * FROM sessions WHERE token_hash = ?").get(sha256(token)) as
    | SessionRow
    | undefined;
  if (!session || session.realm !== realm) return undefined;
  if (session.expires_at <= Date.now()) {
    deleteSession(session.id);
    return undefined;
  }
  return session;
}

export function touchSession(session: SessionRow): void {
  const now = Date.now();
  if (now - session.last_seen < TOUCH_INTERVAL_MS) return;
  db.prepare("UPDATE sessions SET last_seen = ? WHERE id = ?").run(now, session.id);
}

/** Swaps a pending session for a brand new full one, so the pre-2FA token can never be reused. */
export function promoteSession(oldSessionId: string, userId: number, meta: ClientMeta, realm: Realm) {
  return db.transaction(() => {
    deleteSession(oldSessionId);
    return createSession(userId, "full", meta, realm);
  })();
}

export function bumpAttempts(sessionId: string): number {
  db.prepare("UPDATE sessions SET attempts = attempts + 1 WHERE id = ?").run(sessionId);
  return (db.prepare("SELECT attempts FROM sessions WHERE id = ?").get(sessionId) as { attempts: number }).attempts;
}

export function deleteSession(id: string): void {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
}

export function deleteSessionForUser(id: string, userId: number, realm: Realm): boolean {
  return db.prepare("DELETE FROM sessions WHERE id = ? AND user_id = ? AND realm = ?").run(id, userId, realm).changes === 1;
}

export function deleteOtherSessions(userId: number, keepSessionId: string): void {
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND id != ?").run(userId, keepSessionId);
}

export function listFullSessions(userId: number, realm: Realm): SessionRow[] {
  return db
    .prepare(
      "SELECT * FROM sessions WHERE user_id = ? AND realm = ? AND stage = 'full' AND expires_at > ? ORDER BY last_seen DESC",
    )
    .all(userId, realm, Date.now()) as SessionRow[];
}

export function purgeExpiredSessions(): void {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
}
