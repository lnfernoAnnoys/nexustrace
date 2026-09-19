import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DATA_DIR } from "./config.ts";

let cachedKey: Buffer | null = null;

/** 32-byte key used to encrypt TOTP secrets and to pepper backup-code hashes. */
function appKey(): Buffer {
  if (cachedKey) return cachedKey;

  const fromEnv = process.env.APP_SECRET_KEY;
  if (fromEnv) {
    const key = Buffer.from(fromEnv, "hex");
    if (key.length !== 32) throw new Error("APP_SECRET_KEY must be 64 hex characters (32 bytes)");
    cachedKey = key;
    return key;
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, "app.key");
  if (fs.existsSync(file)) {
    cachedKey = Buffer.from(fs.readFileSync(file, "utf8").trim(), "hex");
  } else {
    cachedKey = crypto.randomBytes(32);
    fs.writeFileSync(file, cachedKey.toString("hex"), { mode: 0o600 });
  }
  return cachedKey;
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", appKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, data].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(payload: string): string {
  const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", appKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/** Encrypts binary data (uploaded identity documents). Layout: iv (12) | auth tag (16) | ciphertext. */
export function encryptBytes(plain: Buffer): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", appKey(), iv);
  const data = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]);
}

export function decryptBytes(payload: Buffer): Buffer {
  const decipher = crypto.createDecipheriv("aes-256-gcm", appKey(), payload.subarray(0, 12));
  decipher.setAuthTag(payload.subarray(12, 28));
  return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]);
}

export function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hmac(value: string): string {
  return crypto.createHmac("sha256", appKey()).update(value).digest("hex");
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}
