import type { Request, Response } from "express";
import { execute, query } from "../db/pool.js";
import { ApiError } from "../utils/ApiError.js";

export async function getCart(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const items = await query(
    `SELECT p.id, p.name, p.price, p.img, p.stock, c.quantity
       FROM cart c
       JOIN products p ON p.id = c.product_id
      WHERE c.user_id = ?
      ORDER BY c.created_at ASC`,
    [userId],
  );
  res.json({ status: "success", data: items });
}

export async function addToCart(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const { product_id, quantity } = req.body as { product_id: number; quantity?: number };
  const qty = quantity ?? 1;

  const product = await query<{ id: number }>("SELECT id FROM products WHERE id = ?", [product_id]);
  if (product.length === 0) throw ApiError.notFound("Product not found");

  // Upsert: increment quantity if the row already exists.
  await execute(
    `INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
    [userId, product_id, qty],
  );
  res.json({ status: "success", message: "Added to cart" });
}

export async function removeFromCart(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const { product_id } = req.body as { product_id: number };
  await execute("DELETE FROM cart WHERE user_id = ? AND product_id = ?", [userId, product_id]);
  res.json({ status: "success", message: "Removed" });
}
