import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { DATA_DIR } from "./config.ts";

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, "nexustrace.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    username            TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash       TEXT    NOT NULL,
    name                TEXT    NOT NULL,
    badge               TEXT    NOT NULL DEFAULT '',
    department          TEXT    NOT NULL DEFAULT '',
    email               TEXT    NOT NULL DEFAULT '',
    totp_secret_enc     TEXT,
    totp_pending_enc    TEXT,
    totp_enabled        INTEGER NOT NULL DEFAULT 0,
    last_totp_step      INTEGER NOT NULL DEFAULT 0,
    failed_logins       INTEGER NOT NULL DEFAULT 0,
    locked_until        INTEGER NOT NULL DEFAULT 0,
    created_at          INTEGER NOT NULL,
    password_changed_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS backup_codes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT    NOT NULL,
    used_at   INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_backup_codes_user ON backup_codes(user_id);

  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT    PRIMARY KEY,
    token_hash  TEXT    NOT NULL UNIQUE,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stage       TEXT    NOT NULL,
    attempts    INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL,
    last_seen   INTEGER NOT NULL,
    expires_at  INTEGER NOT NULL,
    user_agent  TEXT    NOT NULL DEFAULT '',
    ip          TEXT    NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS access_requests (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_level      INTEGER NOT NULL,
    requested_level INTEGER NOT NULL CHECK (requested_level BETWEEN 1 AND 8),
    reason          TEXT    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),
    granted_level   INTEGER,
    decision_note   TEXT    NOT NULL DEFAULT '',
    decided_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    decided_by_name TEXT    NOT NULL DEFAULT '',
    created_at      INTEGER NOT NULL,
    decided_at      INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_access_requests_user ON access_requests(user_id);
  CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
  -- at most one open request per person, enforced by the database so two quick clicks can't create two
  CREATE UNIQUE INDEX IF NOT EXISTS idx_access_requests_one_pending ON access_requests(user_id) WHERE status = 'pending';

  -- identity documents; "data" is AES-256-GCM encrypted
  CREATE TABLE IF NOT EXISTS request_files (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id    INTEGER NOT NULL REFERENCES access_requests(id) ON DELETE CASCADE,
    original_name TEXT    NOT NULL,
    mime          TEXT    NOT NULL,
    size          INTEGER NOT NULL,
    sha256        TEXT    NOT NULL,
    data          BLOB    NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_request_files_request ON request_files(request_id);

  -- every change made in the admin console. Names are copied in so the trail survives account deletion.
  CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    at          INTEGER NOT NULL,
    actor_id    INTEGER,
    actor_name  TEXT    NOT NULL,
    action      TEXT    NOT NULL,
    target_id   INTEGER,
    target_name TEXT    NOT NULL,
    detail      TEXT    NOT NULL DEFAULT '{}'
  );
  CREATE INDEX IF NOT EXISTS idx_audit_log_at ON audit_log(at DESC);
`);

/** Adds a column to a table created by an earlier version of the app. */
function addColumn(table: string, column: string, definition: string): void {
  const columns = db.pragma(`table_info(${table})`) as { name: string }[];
  if (!columns.some((c) => c.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

addColumn("users", "role", "TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))");
addColumn("users", "access_level", "INTEGER NOT NULL DEFAULT 1 CHECK (access_level BETWEEN 1 AND 8)");
addColumn("sessions", "realm", "TEXT NOT NULL DEFAULT 'user'");
