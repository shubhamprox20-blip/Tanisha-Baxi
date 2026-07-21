import type { Request, Response } from "express";
import { execute, query } from "../db/pool.js";

export async function getFavorites(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const products = await query(
    `SELECT p.id, p.name, p.meta, p.description, p.price, p.filters, p.img, p.stock
       FROM favorites f
       JOIN products p ON p.id = f.product_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC`,
    [userId],
  );
  res.json({ status: "success", data: products });
}

export async function toggleFavorite(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const { product_id } = req.body as { product_id: number };

  const existing = await query<{ id: number }>(
    "SELECT id FROM favorites WHERE user_id = ? AND product_id = ?",
    [userId, product_id],
  );

  let action: "added" | "removed";
  if (existing.length > 0) {
    await execute("DELETE FROM favorites WHERE user_id = ? AND product_id = ?", [userId, product_id]);
    action = "removed";
  } else {
    // INSERT IGNORE guards against a race creating a duplicate.
    await execute(
      "INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)",
      [userId, product_id],
    );
    action = "added";
  }
  res.json({ status: "success", action });
}
