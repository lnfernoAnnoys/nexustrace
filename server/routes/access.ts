import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { MAX_ACCESS_LEVEL, MAX_UPLOAD_BYTES, MAX_UPLOAD_FILES } from "../config.ts";
import { accessRequestLimiter, getAuth, requireStage } from "../middleware.ts";
import { cancelRequest, createRequest, listRequestsForUser, type NewFile } from "../access.ts";
import { cleanFileName, sniffMime } from "../uploads.ts";

/** Routes for the signed-in investigator: see their access level and ask for a higher one. */
export const accessRouter = Router();
accessRouter.use(requireStage("full"));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: MAX_UPLOAD_FILES, fields: 4, fieldSize: 16 * 1024 },
  // browsers send file names as UTF-8; the default (latin1) would garble names like "café.pdf"
  defParamCharset: "utf8",
});

const requestSchema = z.object({
  requestedLevel: z.coerce
    .number("Choose the level you are asking for")
    .int()
    .min(1, "Choose the level you are asking for")
    .max(MAX_ACCESS_LEVEL, `The highest level is ${MAX_ACCESS_LEVEL}`),
  reason: z
    .string()
    .trim()
    .min(20, "Please explain why you need this access (at least 20 characters)")
    .max(2000, "The reason is too long (2000 characters at most)"),
});

accessRouter.get("/", (_req, res) => {
  const { user } = getAuth(res);
  res.json({ level: user.access_level, maxLevel: MAX_ACCESS_LEVEL, requests: listRequestsForUser(user.id) });
});

accessRouter.post("/requests", accessRequestLimiter, upload.array("files", MAX_UPLOAD_FILES), (req, res) => {
  const { user } = getAuth(res);
  const { requestedLevel, reason } = requestSchema.parse(req.body);

  if (requestedLevel <= user.access_level) {
    res.status(400).json({ error: `Choose a level higher than your current level (${user.access_level}).` });
    return;
  }

  const uploaded = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (uploaded.length === 0) {
    res.status(400).json({ error: "Attach a scan or photo of your identity card." });
    return;
  }
  const files: NewFile[] = [];
  for (const f of uploaded) {
    const mime = sniffMime(f.buffer);
    if (!mime) {
      res.status(400).json({ error: `"${cleanFileName(f.originalname)}" is not a PDF, PNG or JPEG file.` });
      return;
    }
    files.push({ name: cleanFileName(f.originalname), mime, data: f.buffer });
  }

  try {
    createRequest(user.id, user.access_level, requestedLevel, reason, files);
  } catch (err) {
    if ((err as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(409).json({ error: "You already have a request waiting for review. Withdraw it first to send a new one." });
      return;
    }
    throw err;
  }
  res.status(201).json({ level: user.access_level, maxLevel: MAX_ACCESS_LEVEL, requests: listRequestsForUser(user.id) });
});

accessRouter.delete("/requests/:id", (req, res) => {
  const { user } = getAuth(res);
  const id = z.coerce.number().int().positive().safeParse(req.params.id);
  if (!id.success || !cancelRequest(id.data, user.id)) {
    res.status(404).json({ error: "No waiting request found" });
    return;
  }
  res.json({ level: user.access_level, maxLevel: MAX_ACCESS_LEVEL, requests: listRequestsForUser(user.id) });
});
