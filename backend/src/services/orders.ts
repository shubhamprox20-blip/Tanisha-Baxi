import type { PoolConnection } from "mysql2/promise";
import { pool, withTransaction } from "../db/pool.js";
import { ApiError } from "../utils/ApiError.js";

export interface LineItem {
  product_id: number;
  product_name: string;
  unit_price: number; // rupees
  quantity: number;
}

/**
 * Resolve the line items for a checkout from server-side data only. If
 * `productId` is given it's a single "Buy now"; otherwise the user's cart.
 * Prices and names always come from the products table — never the client.
 */
export async function resolveLineItems(userId: number, productId?: number): Promise<LineItem[]> {
  if (productId) {
    const [rows] = await pool.query<any[]>(
      "SELECT id, name, price, stock FROM products WHERE id = ?",
      [productId],
    );
    if (rows.length === 0) throw ApiError.notFound("Product not found");
    const p = rows[0];
    if (p.stock <= 0) throw ApiError.badRequest(`${p.name} is out of stock.`);
    return [{ product_id: p.id, product_name: p.name, unit_price: p.price, quantity: 1 }];
  }

  const [rows] = await pool.query<any[]>(
    `SELECT p.id, p.name, p.price, p.stock, c.quantity
       FROM cart c JOIN products p ON p.id = c.product_id
      WHERE c.user_id = ?`,
    [userId],
  );
  if (rows.length === 0) throw ApiError.badRequest("Your cart is empty.");
  for (const r of rows) {
    if (r.stock < r.quantity) throw ApiError.badRequest(`${r.name} has insufficient stock.`);
  }
  return rows.map((r) => ({
    product_id: r.id,
    product_name: r.name,
    unit_price: r.price,
    quantity: r.quantity,
  }));
}

export function totalPaise(items: LineItem[]): number {
  return items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0) * 100;
}

/**
 * Idempotently mark an order paid: only the first transition from a non-paid
 * state decrements stock and clears the buyer's cart. Safe to call from both
 * the checkout callback and the webhook.
 */
export async function markOrderPaid(
  razorpayOrderId: string,
  paymentId: string,
  signature: string | null,
): Promise<void> {
  await withTransaction(async (conn: PoolConnection) => {
    const [rows] = await conn.query<any[]>(
      "SELECT id, user_id, status FROM orders WHERE razorpay_order_id = ? FOR UPDATE",
      [razorpayOrderId],
    );
    if (rows.length === 0) throw ApiError.notFound("Order not found for payment.");
    const order = rows[0];

    if (order.status === "paid") return; // already processed → no-op

    await conn.query(
      "UPDATE orders SET status = 'paid', razorpay_payment_id = ?, razorpay_signature = ? WHERE id = ?",
      [paymentId, signature, order.id],
    );

    const [items] = await conn.query<any[]>(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [order.id],
    );
    for (const it of items) {
      if (it.product_id == null) continue;
      await conn.query(
        "UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?",
        [it.quantity, it.product_id],
      );
    }

    if (order.user_id != null) {
      await conn.query("DELETE FROM cart WHERE user_id = ?", [order.user_id]);
    }
  });
}
