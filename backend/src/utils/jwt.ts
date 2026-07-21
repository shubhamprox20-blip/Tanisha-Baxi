import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthTokenPayload {
  sub: number; // user id
  email: string;
  role: "customer" | "admin";
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (typeof decoded === "string") {
    throw new Error("Malformed token");
  }
  return {
    sub: Number(decoded.sub),
    email: String(decoded.email),
    role: decoded.role === "admin" ? "admin" : "customer",
  };
}

export const AUTH_COOKIE = "tb_session";
