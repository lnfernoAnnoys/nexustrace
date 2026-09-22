import { db } from "./db.ts";
import type { UserRow } from "./users.ts";

export type AuditAction =
  | "level_changed"
  | "request_approved"
  | "request_denied"
  | "role_changed"
  | "signup_approved"
  | "signup_denied"
  | "account_banned"
  | "account_unbanned"
  | "account_deleted"
  | "identity_changed";

interface AuditRow {
  id: number;
  at: number;
  actor_id: number | null;
  actor_name: string;
  action: AuditAction;
  target_id: number | null;
  target_name: string;
  detail: string;
}

export interface AuditEntry {
  id: number;
  at: number;
  actorName: string;
  action: AuditAction;
  targetId: number | null;
  targetName: string;
  detail: Record<string, unknown>;
}

/** Who did something: an admin from the console, or the command line (`actor` null). */
export function logAudit(
  actor: UserRow | null,
  action: AuditAction,
  target: UserRow,
  detail: Record<string, unknown>,
): void {
  db.prepare(
    "INSERT INTO audit_log (at, actor_id, actor_name, action, target_id, target_name, detail) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(
    Date.now(),
    actor?.id ?? null,
    actor ? actor.name : "Command line",
    action,
    target.id,
    target.name,
    JSON.stringify(detail),
  );
}

function toEntry(row: AuditRow): AuditEntry {
  return {
    id: row.id,
    at: row.at,
    actorName: row.actor_name,
    action: row.action,
    targetId: row.target_id,
    targetName: row.target_name,
    detail: JSON.parse(row.detail) as Record<string, unknown>,
  };
}

export function listAudit(limit: number, targetId?: number): AuditEntry[] {
  const rows =
    targetId === undefined
      ? db.prepare("SELECT * FROM audit_log ORDER BY id DESC LIMIT ?").all(limit)
      : db.prepare("SELECT * FROM audit_log WHERE target_id = ? ORDER BY id DESC LIMIT ?").all(targetId, limit);
  return (rows as AuditRow[]).map(toEntry);
}
