import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const uploadDir = path.resolve(process.cwd(), env.upload.dir);
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    // Sanitize to a timestamped, extension-preserving, path-safe name.
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    const base = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-z0-9_-]/gi, "_")
      .slice(0, 60);
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: env.upload.maxBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      cb(ApiError.badRequest("Only image files (jpg, png, webp, gif, avif) are allowed."));
      return;
    }
    cb(null, true);
  },
});
