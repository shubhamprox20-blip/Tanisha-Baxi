import type { Request, Response } from "express";
import { execute, query } from "../db/pool.js";
import { ApiError } from "../utils/ApiError.js";
import { hashPassword } from "../utils/password.js";

const PROFILE_COLUMNS = `id, first_name, last_name, email, phone, house, street, landmark,
  city, state, pincode, country, role, created_at`;

export async function getProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;

  const rows = await query<Record<string, unknown>>(
    `SELECT ${PROFILE_COLUMNS} FROM users WHERE id = ?`,
    [userId],
  );
  const user = rows[0];
  if (!user) throw ApiError.notFound("User not found");

  const [orders] = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM orders WHERE user_id = ? AND status = 'paid'",
    [userId],
  );
  const [wishlist] = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM favorites WHERE user_id = ?",
    [userId],
  );

  res.json({
    status: "success",
    data: { ...user, orders: orders?.n ?? 0, wishlist: wishlist?.n ?? 0 },
  });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const b = req.body as Record<string, string>;

  // Email is changing? ensure it's not taken by someone else.
  const clash = await query<{ id: number }>(
    "SELECT id FROM users WHERE email = ? AND id <> ?",
    [b.email, userId],
  );
  if (clash.length > 0) throw ApiError.conflict("That email is already in use.");

  await execute(
    `UPDATE users SET
       first_name = ?, last_name = ?, email = ?, phone = ?, house = ?, street = ?,
       landmark = ?, city = ?, state = ?, pincode = ?, country = ?
     WHERE id = ?`,
    [b.first_name, b.last_name, b.email, b.phone, b.house, b.street, b.landmark || null,
     b.city, b.state, b.pincode, b.country || "India", userId],
  );

  if (b.new_password) {
    if (b.new_password !== b.confirm_password) {
      throw ApiError.badRequest("Passwords do not match");
    }
    const hash = await hashPassword(b.new_password);
    await execute("UPDATE users SET password_hash = ? WHERE id = ?", [hash, userId]);
  }

  res.json({ status: "success", message: "Profile Updated" });
}
