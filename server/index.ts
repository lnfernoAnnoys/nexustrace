import fs from "node:fs";
import path from "node:path";
import cookieParser from "cookie-parser";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import multer from "multer";
import { ZodError } from "zod";
import { DIST_DIR, HOST, IS_PROD, MAX_UPLOAD_BYTES, MAX_UPLOAD_FILES, PORT } from "./config.ts";
import { loadSession, noStore, originGuard } from "./middleware.ts";
import { accessRouter } from "./routes/access.ts";
import { adminRouter } from "./routes/admin.ts";
import { createAuthRouter } from "./routes/auth.ts";
import { purgeExpiredSessions } from "./sessions.ts";
import { countUsers, createUser } from "./users.ts";

const app = express();
app.disable("x-powered-by");
// Honour X-Forwarded-* only when the request comes from this machine (the Vite dev proxy).
app.set("trust proxy", "loopback");
app.use(helmet());

app.use("/api", noStore, originGuard, express.json({ limit: "50kb" }), cookieParser());
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});
// Two separate sign-ins: the investigator site (/api/auth, /api/access) and the admin console (/api/admin).
app.use("/api/auth", loadSession("user"), createAuthRouter("user"));
app.use("/api/access", loadSession("user"), accessRouter);
app.use("/api/admin/auth", loadSession("admin"), createAuthRouter("admin"));
app.use("/api/admin", loadSession("admin"), adminRouter);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// In production the built website is served from this same server (one port, no proxy needed).
if (IS_PROD && fs.existsSync(path.join(DIST_DIR, "index.html"))) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    // the admin console is its own single-page app under /admin
    const adminApp = req.path === "/admin" || req.path.startsWith("/admin/");
    res.sendFile(path.join(DIST_DIR, adminApp ? "admin" : "", "index.html"));
  });
}

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: err.issues[0]?.message ?? "Invalid request" });
    return;
  }
  if (err instanceof multer.MulterError) {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: `Each file must be ${MAX_UPLOAD_BYTES / 1024 / 1024} MB or smaller.`,
      LIMIT_FILE_COUNT: `You can attach up to ${MAX_UPLOAD_FILES} files.`,
      LIMIT_UNEXPECTED_FILE: `You can attach up to ${MAX_UPLOAD_FILES} files.`,
    };
    res.status(400).json({ error: messages[err.code] ?? "The upload could not be read." });
    return;
  }
  if (err?.type === "entity.parse.failed" || err?.type === "entity.too.large") {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);

async function seedDemoUser(): Promise<void> {
  if (countUsers() > 0) return;
  if (IS_PROD && !process.env.DEMO_PASSWORD) {
    console.warn("[auth] No users exist. Create one with: npm run user -- create <username> <password> --name \"Full Name\"");
    return;
  }
  const password = process.env.DEMO_PASSWORD ?? "NexusTrace#2026";
  await createUser({
    username: "a.sharma",
    password,
    name: "Insp. A. Sharma",
    badge: "IPS-4471",
    department: "MHA Task Force",
    email: "a.sharma@mha.gov.in",
  });
  console.log(`[auth] Created demo user "a.sharma" (password: ${process.env.DEMO_PASSWORD ? "from DEMO_PASSWORD" : password}).`);
  console.log("[auth] You will be asked to set up an authenticator app on first sign-in.");
}

await seedDemoUser();
purgeExpiredSessions();
setInterval(purgeExpiredSessions, 10 * 60 * 1000).unref();

app.listen(PORT, HOST, () => {
  console.log(`[api] NexusTrace API listening on http://${HOST}:${PORT}${IS_PROD ? " (production)" : ""}`);
});
