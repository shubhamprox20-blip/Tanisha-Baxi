import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/** 404 handler for unmatched routes. */
export function notFound(req: Request, res: Response): void {
  res.status(404).json({ status: "error", message: `Route not found: ${req.method} ${req.path}` });
}

/**
 * Central error handler. Turns any thrown value into a consistent JSON shape:
 *   { status: "error", message: string }
 * Operational (ApiError) messages are surfaced; unexpected errors are logged
 * and hidden behind a generic message in production.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ status: "error", message: err.message });
    return;
  }

  // Postgres constraint violations (SQLSTATE) → a clean 4xx, no internals leaked.
  const code = (err as { code?: string })?.code;
  if (code === "23505") {
    // unique_violation
    res.status(409).json({ status: "error", message: "That record already exists." });
    return;
  }
  if (code === "23503") {
    // foreign_key_violation — e.g. referencing a product that no longer exists
    res.status(400).json({ status: "error", message: "Referenced record does not exist." });
    return;
  }

  console.error("[error] unhandled:", err);
  res.status(500).json({
    status: "error",
    message: env.isProd ? "Something went wrong. Please try again." : devMessage(err),
  });
}

/** Best-effort readable message for arbitrary thrown values (dev only). */
function devMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  const nested = (err as { error?: { description?: string } })?.error?.description;
  if (nested) return nested;
  const msg = (err as { message?: unknown })?.message;
  if (typeof msg === "string") return msg;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}
