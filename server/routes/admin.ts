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
import { getUserById, listUsers, setAccessLevel, type UserRow } from "../users.ts";

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
    email: user.email,
    role: user.role,
    accessLevel: user.access_level,
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
    levelCounts,
    waiting: listRequests("pending").slice(0, 5),
    recentActivity: listAudit(6),
  });
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
