import type { Request, Response } from "express";
import { execute, query } from "../db/pool.js";

export async function getFavorites(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const products = await query(
    `SELECT p.id, p.name, p.meta, p.description, p.price, p.filters, p.img, p.stock
       FROM favorites f
       JOIN products p ON p.id = f.product_id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC`,
    [userId],
  );
  res.json({ status: "success", data: products });
}

export async function toggleFavorite(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const { product_id } = req.body as { product_id: number };

  // Delete-first, then insert only if nothing was there: one statement decides
  // the direction, so two rapid taps can't both read "absent" and double-insert.
  const removed = await execute(
    "DELETE FROM favorites WHERE user_id = $1 AND product_id = $2",
    [userId, product_id],
  );

  let action: "added" | "removed";
  if (removed.rowCount > 0) {
    action = "removed";
  } else {
    // ON CONFLICT DO NOTHING guards against a race creating a duplicate.
    await execute(
      `INSERT INTO favorites (user_id, product_id) VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [userId, product_id],
    );
    action = "added";
  }
  res.json({ status: "success", action });
}
