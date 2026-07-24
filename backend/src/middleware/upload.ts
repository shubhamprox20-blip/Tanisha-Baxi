import multer from "multer";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.upload.maxBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      cb(ApiError.badRequest("Only image files (jpg, png, webp, gif, avif) are allowed."));
      return;
    }
    cb(null, true);
  },
});
