import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { AUTH_COOKIE, verifyAuthToken } from "../utils/jwt.js";

/**
 * Best-effort: if a valid session cookie is present, attach `req.user`.
 * Never throws — used on routes that behave differently for guests vs members.
 */
export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[AUTH_COOKIE];
  if (token) {
    try {
      req.user = verifyAuthToken(token);
    } catch {
      // Invalid/expired token → treat as anonymous.
    }
  }
  next();
}

/** Requires a logged-in user; 401 otherwise. Assumes attachUser ran first. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw ApiError.unauthorized("Please sign in to continue.");
  }
  next();
}

/** Requires an authenticated admin; 401 if anonymous, 403 if a non-admin. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw ApiError.unauthorized("Please sign in to continue.");
  }
  if (req.user.role !== "admin") {
    throw ApiError.forbidden("Administrator access required.");
  }
  next();
}
