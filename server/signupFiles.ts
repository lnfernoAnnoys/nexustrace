// Badge/ID proof optionally attached at sign-up, so an administrator has something to check before
// letting a new account in. Mirrors the shape of access.ts's request_files, but keyed to the user
// directly since it exists before any access request does.
import { db } from "./db.ts";
import { decryptBytes, encryptBytes, sha256 } from "./crypto.ts";
import type { DocumentMime } from "./uploads.ts";

export interface NewSignupFile {
  name: string;
  mime: DocumentMime;
  data: Buffer;
}

export interface SignupFileView {
  id: number;
  name: string;
  type: DocumentMime;
  size: number;
}

export function saveSignupFiles(userId: number, files: NewSignupFile[]): void {
  if (files.length === 0) return;
  const insert = db.prepare(
    "INSERT INTO signup_files (user_id, original_name, mime, size, sha256, data) VALUES (?, ?, ?, ?, ?, ?)",
  );
  db.transaction(() => {
    for (const f of files) insert.run(userId, f.name, f.mime, f.data.length, sha256(f.data), encryptBytes(f.data));
  })();
}

export function listSignupFiles(userId: number): SignupFileView[] {
  return db
    .prepare("SELECT id, original_name, mime, size FROM signup_files WHERE user_id = ? ORDER BY id")
    .all(userId)
    .map((r) => {
      const row = r as { id: number; original_name: string; mime: DocumentMime; size: number };
      return { id: row.id, name: row.original_name, type: row.mime, size: row.size };
    });
}

/** `userId` is checked so a file id can't be used to reach another account's document. */
export function readSignupFile(userId: number, fileId: number): { name: string; mime: DocumentMime; data: Buffer } | undefined {
  const row = db
    .prepare("SELECT original_name, mime, data FROM signup_files WHERE id = ? AND user_id = ?")
    .get(fileId, userId) as { original_name: string; mime: DocumentMime; data: Buffer } | undefined;
  return row ? { name: row.original_name, mime: row.mime, data: decryptBytes(row.data) } : undefined;
}
