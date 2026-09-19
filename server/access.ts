import { db } from "./db.ts";
import { decryptBytes, encryptBytes, sha256 } from "./crypto.ts";
import type { DocumentMime } from "./uploads.ts";

export type RequestStatus = "pending" | "approved" | "denied" | "cancelled";

interface RequestRow {
  id: number;
  user_id: number;
  from_level: number;
  requested_level: number;
  reason: string;
  status: RequestStatus;
  granted_level: number | null;
  decision_note: string;
  decided_by: number | null;
  decided_by_name: string;
  created_at: number;
  decided_at: number | null;
}

interface FileRow {
  id: number;
  request_id: number;
  original_name: string;
  mime: DocumentMime;
  size: number;
}

interface RequesterRow {
  username: string;
  name: string;
  badge: string;
  department: string;
  email: string;
  current_level: number;
}

export interface RequestFileView {
  id: number;
  name: string;
  type: DocumentMime;
  size: number;
}

/** What the person who filed the request sees. */
export interface AccessRequestView {
  id: number;
  status: RequestStatus;
  fromLevel: number;
  requestedLevel: number;
  grantedLevel: number | null;
  reason: string;
  decisionNote: string;
  decidedBy: string;
  createdAt: number;
  decidedAt: number | null;
  files: RequestFileView[];
}

/** What an administrator sees: the same, plus who asked. */
export interface AdminRequestView extends AccessRequestView {
  user: {
    id: number;
    username: string;
    name: string;
    badge: string;
    department: string;
    email: string;
    currentLevel: number;
  };
}

const FILE_COLUMNS = "id, request_id, original_name, mime, size"; // never the encrypted "data" column

function filesByRequest(requestIds: number[]): Map<number, RequestFileView[]> {
  const map = new Map<number, RequestFileView[]>();
  if (requestIds.length === 0) return map;
  const rows = db
    .prepare(`SELECT ${FILE_COLUMNS} FROM request_files WHERE request_id IN (${requestIds.map(() => "?").join(",")}) ORDER BY id`)
    .all(...requestIds) as FileRow[];
  for (const f of rows) {
    const list = map.get(f.request_id) ?? [];
    list.push({ id: f.id, name: f.original_name, type: f.mime, size: f.size });
    map.set(f.request_id, list);
  }
  return map;
}

function toView(row: RequestRow, files: Map<number, RequestFileView[]>): AccessRequestView {
  return {
    id: row.id,
    status: row.status,
    fromLevel: row.from_level,
    requestedLevel: row.requested_level,
    grantedLevel: row.granted_level,
    reason: row.reason,
    decisionNote: row.decision_note,
    decidedBy: row.decided_by_name,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
    files: files.get(row.id) ?? [],
  };
}

// --- the person filing requests -----------------------------------------------

export interface NewFile {
  name: string;
  mime: DocumentMime;
  data: Buffer;
}

/** Throws SQLITE_CONSTRAINT_UNIQUE if this user already has a pending request. */
export function createRequest(
  userId: number,
  fromLevel: number,
  requestedLevel: number,
  reason: string,
  files: NewFile[],
): number {
  return db.transaction(() => {
    const id = Number(
      db
        .prepare(
          "INSERT INTO access_requests (user_id, from_level, requested_level, reason, created_at) VALUES (?, ?, ?, ?, ?)",
        )
        .run(userId, fromLevel, requestedLevel, reason, Date.now()).lastInsertRowid,
    );
    const insert = db.prepare(
      "INSERT INTO request_files (request_id, original_name, mime, size, sha256, data) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const f of files) insert.run(id, f.name, f.mime, f.data.length, sha256(f.data), encryptBytes(f.data));
    return id;
  })();
}

export function listRequestsForUser(userId: number): AccessRequestView[] {
  const rows = db
    .prepare("SELECT * FROM access_requests WHERE user_id = ? ORDER BY id DESC")
    .all(userId) as RequestRow[];
  const files = filesByRequest(rows.map((r) => r.id));
  return rows.map((r) => toView(r, files));
}

export function getRequestForUser(id: number, userId: number): AccessRequestView | undefined {
  const row = db.prepare("SELECT * FROM access_requests WHERE id = ? AND user_id = ?").get(id, userId) as
    | RequestRow
    | undefined;
  return row ? toView(row, filesByRequest([row.id])) : undefined;
}

/** Withdraws a request that hasn't been decided yet. */
export function cancelRequest(id: number, userId: number): boolean {
  return (
    db
      .prepare("UPDATE access_requests SET status = 'cancelled', decided_at = ? WHERE id = ? AND user_id = ? AND status = 'pending'")
      .run(Date.now(), id, userId).changes === 1
  );
}

// --- the administrator's side ----------------------------------------------------

const ADMIN_SELECT = `
  SELECT r.*, u.username, u.name, u.badge, u.department, u.email, u.access_level AS current_level
  FROM access_requests r JOIN users u ON u.id = r.user_id`;

function toAdminViews(rows: (RequestRow & RequesterRow)[]): AdminRequestView[] {
  const files = filesByRequest(rows.map((r) => r.id));
  return rows.map((r) => ({
    ...toView(r, files),
    user: {
      id: r.user_id,
      username: r.username,
      name: r.name,
      badge: r.badge,
      department: r.department,
      email: r.email,
      currentLevel: r.current_level,
    },
  }));
}

export function listRequests(status?: RequestStatus): AdminRequestView[] {
  const rows = (
    status
      ? db.prepare(`${ADMIN_SELECT} WHERE r.status = ? ORDER BY r.id DESC`).all(status)
      : db.prepare(`${ADMIN_SELECT} ORDER BY r.id DESC`).all()
  ) as (RequestRow & RequesterRow)[];
  const views = toAdminViews(rows);
  // waiting requests first, longest-waiting on top; everything else newest first
  return views.sort((a, b) => {
    if ((a.status === "pending") !== (b.status === "pending")) return a.status === "pending" ? -1 : 1;
    return a.status === "pending" ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
  });
}

export function getRequest(id: number): AdminRequestView | undefined {
  const row = db.prepare(`${ADMIN_SELECT} WHERE r.id = ?`).get(id) as (RequestRow & RequesterRow) | undefined;
  return row ? toAdminViews([row])[0] : undefined;
}

export function listRequestsByUser(userId: number): AdminRequestView[] {
  const rows = db.prepare(`${ADMIN_SELECT} WHERE r.user_id = ? ORDER BY r.id DESC`).all(userId) as (RequestRow &
    RequesterRow)[];
  return toAdminViews(rows);
}

export function countPendingRequests(): number {
  return (db.prepare("SELECT COUNT(*) AS n FROM access_requests WHERE status = 'pending'").get() as { n: number }).n;
}

export function pendingRequestByUser(): Map<number, { id: number; requestedLevel: number }> {
  const rows = db
    .prepare("SELECT id, user_id, requested_level FROM access_requests WHERE status = 'pending'")
    .all() as { id: number; user_id: number; requested_level: number }[];
  return new Map(rows.map((r) => [r.user_id, { id: r.id, requestedLevel: r.requested_level }]));
}

/**
 * Records the decision and, when approving, raises the user's level in the same transaction.
 * Returns false if the request was already decided or withdrawn.
 */
export function decideRequest(input: {
  id: number;
  userId: number;
  approve: boolean;
  grantedLevel: number | null;
  note: string;
  adminId: number;
  adminName: string;
}): boolean {
  return db.transaction(() => {
    const changed = db
      .prepare(
        `UPDATE access_requests
         SET status = ?, granted_level = ?, decision_note = ?, decided_by = ?, decided_by_name = ?, decided_at = ?
         WHERE id = ? AND status = 'pending'`,
      )
      .run(
        input.approve ? "approved" : "denied",
        input.grantedLevel,
        input.note,
        input.adminId,
        input.adminName,
        Date.now(),
        input.id,
      ).changes;
    if (changed !== 1) return false;
    if (input.approve && input.grantedLevel !== null) {
      db.prepare("UPDATE users SET access_level = ? WHERE id = ?").run(input.grantedLevel, input.userId);
    }
    return true;
  })();
}

/** Decrypts one attached document. `requestId` is checked so a file id can't be used to reach another request. */
export function readFile(requestId: number, fileId: number): { name: string; mime: DocumentMime; data: Buffer } | undefined {
  const row = db
    .prepare("SELECT original_name, mime, data FROM request_files WHERE id = ? AND request_id = ?")
    .get(fileId, requestId) as { original_name: string; mime: DocumentMime; data: Buffer } | undefined;
  return row ? { name: row.original_name, mime: row.mime, data: decryptBytes(row.data) } : undefined;
}
