import path from "node:path";

const serverDir = import.meta.dirname;

export const ROOT_DIR = path.resolve(serverDir, "..");
export const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(serverDir, "data");
export const DIST_DIR = path.join(ROOT_DIR, "dist");

export const IS_PROD = process.env.NODE_ENV === "production" || process.argv.includes("--production");
// In development the API uses API_PORT (default 3001); tools often set PORT for the web app, so it is
// ignored there. In production the API serves the site too, and hosts (Render, Railway...) provide PORT.
export const PORT = Number(process.env.API_PORT ?? (IS_PROD ? process.env.PORT : undefined) ?? 3001);
// Bound to loopback by default so the API is not exposed to the local network.
export const HOST = process.env.HOST ?? "127.0.0.1";

// Only set COOKIE_SECURE=true when the site is served over HTTPS.
export const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";

export const ALLOWED_ORIGINS = new Set(
  (
    process.env.CLIENT_ORIGIN ??
    `http://localhost:5173,http://127.0.0.1:5173,http://localhost:${PORT},http://127.0.0.1:${PORT}`
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

// Anyone may create an account (they still have to set up an authenticator app).
// Set SIGNUP_OPEN=false to allow only accounts created with `npm run user -- create`.
export const SIGNUP_OPEN = process.env.SIGNUP_OPEN !== "false";

// The investigator site and the admin console are separate "realms" with their own cookie and
// session records, so signing in to one never signs you in to (or out of) the other.
export type Realm = "user" | "admin";
export const SESSION_COOKIES: Record<Realm, string> = { user: "nt_session", admin: "nt_admin_session" };
export const PENDING_SESSION_MS = 10 * 60 * 1000; // time allowed to finish the 2FA step
export const FULL_SESSION_MS: Record<Realm, number> = {
  user: 8 * 60 * 60 * 1000, // one working shift
  admin: 2 * 60 * 60 * 1000, // the admin console can change everyone's access, so it times out sooner
};

export const MIN_ACCESS_LEVEL = 1;
export const MAX_ACCESS_LEVEL = 8;
export const DEFAULT_ACCESS_LEVEL = MIN_ACCESS_LEVEL;

// Identity documents attached to an access request.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 3;

export const MAX_LOGIN_FAILURES = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;
export const MAX_2FA_ATTEMPTS = 5;

export const TOTP_ISSUER = "NexusTrace";
export const BACKUP_CODE_COUNT = 10;
