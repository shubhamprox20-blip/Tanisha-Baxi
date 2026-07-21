import type { Request, Response } from "express";
import { query } from "../db/pool.js";
import { ApiError } from "../utils/ApiError.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAuthToken } from "../utils/jwt.js";
import { clearAuthCookie, setAuthCookie } from "../utils/cookie.js";

interface UserRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: "customer" | "admin";
}

/** Shape returned to the client — never includes the password hash. */
function publicUser(u: Pick<UserRow, "id" | "first_name" | "last_name" | "email" | "phone" | "role">) {
  return {
    id: u.id,
    first_name: u.first_name,
    last_name: u.last_name,
    email: u.email,
    phone: u.phone,
    role: u.role,
  };
}

function issueSession(res: Response, user: Pick<UserRow, "id" | "email" | "role">): void {
  const token = signAuthToken({ sub: user.id, email: user.email, role: user.role });
  setAuthCookie(res, token);
}

export async function register(req: Request, res: Response): Promise<void> {
  const b = req.body as {
    first_name: string; last_name: string; email: string; phone: string; password: string;
    house: string; street: string; landmark: string; city: string; state: string;
    pincode: string; country: string;
  };

  const existing = await query<{ id: number }>("SELECT id FROM users WHERE email = $1", [b.email]);
  if (existing.length > 0) {
    throw ApiError.conflict("Email already registered.");
  }

  const passwordHash = await hashPassword(b.password);
  const inserted = await query<{ id: number }>(
    `INSERT INTO users
      (first_name, last_name, email, phone, password_hash, house, street, landmark, city, state, pincode, country, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'customer')
     RETURNING id`,
    [b.first_name, b.last_name, b.email, b.phone, passwordHash, b.house, b.street, b.landmark || null, b.city, b.state, b.pincode, b.country || "India"],
  );

  const user = { id: inserted[0].id, email: b.email, role: "customer" as const };
  issueSession(res, user);

  res.status(201).json({
    status: "success",
    message: "Registered successfully",
    user: publicUser({ ...user, first_name: b.first_name, last_name: b.last_name, phone: b.phone }),
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };

  const rows = await query<UserRow>(
    "SELECT id, first_name, last_name, email, phone, password_hash, role FROM users WHERE email = $1",
    [email],
  );
  const user = rows[0];

  // Always run a comparison to avoid leaking which emails exist via timing.
  const ok = user
    ? await verifyPassword(password, user.password_hash)
    : await verifyPassword(password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinva");

  if (!user || !ok) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  issueSession(res, user);
  res.json({ status: "success", message: "Logged in successfully", user: publicUser(user) });
}

export function logout(_req: Request, res: Response): void {
  clearAuthCookie(res);
  res.json({ status: "success", message: "Logged out" });
}

export function me(req: Request, res: Response): void {
  if (!req.user) {
    res.json({ logged_in: false });
    return;
  }
  res.json({
    logged_in: true,
    user_id: req.user.sub,
    email: req.user.email,
    role: req.user.role,
  });
}
