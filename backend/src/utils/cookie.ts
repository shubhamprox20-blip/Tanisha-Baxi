import type { Response } from "express";
import { env } from "../config/env.js";
import { AUTH_COOKIE } from "./jwt.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Set the httpOnly session cookie holding the JWT. */
export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSecure ? "none" : "lax",
    maxAge: SEVEN_DAYS_MS,
    path: "/",
  });
}

/** Clear the session cookie on logout. */
export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSecure ? "none" : "lax",
    path: "/",
  });
}
