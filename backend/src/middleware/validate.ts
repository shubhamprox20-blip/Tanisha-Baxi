import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny, infer as ZodInfer } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * Validates `req.body` against a Zod schema. On success the parsed (and
 * coerced) value replaces `req.body`. On failure throws a 400 with the first
 * readable message.
 */
export function validateBody<S extends ZodTypeAny>(schema: S) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.issues[0];
      const path = first.path.join(".");
      throw ApiError.badRequest(path ? `${path}: ${first.message}` : first.message);
    }
    req.body = result.data as ZodInfer<S>;
    next();
  };
}
