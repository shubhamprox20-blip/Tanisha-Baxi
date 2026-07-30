import { env } from "../config/env.js";
import { query, withTransaction } from "../db/pool.js";
import { ApiError } from "../utils/ApiError.js";

export interface LineItem {
  product_id: number;
  product_name: string;
  unit_price: number; // rupees
  quantity: number;
  size: string;
}

interface CartRow {
  id: number;
  name: string;
  price: number;
  stock: number;
  quantity: number;
}

/**
 * Resolve the line items for a checkout from server-side data only. If
 * `productId` is given it's a single "Buy now"; otherwise the user's cart.
 * Prices and names always come from the products table — never the client.
 */
export async function resolveLineItems(userId: number, productId?: number, size:string="XS"): Promise<LineItem[]> {
  if (productId) {
    const rows = await query<CartRow>(
      "SELECT id, name, price, stock FROM products WHERE id = $1",
      [productId],
    );
    if (rows.length === 0) throw ApiError.notFound("Product not found");
    const p = rows[0];
    if (p.stock <= 0) throw ApiError.badRequest(`${p.name} is out of stock.`);
    return [{
    product_id:p.id,
    product_name:p.name,
    unit_price:p.price,
    quantity:1,
    size
}];
  }

  const rows = await query<CartRow>(
    `SELECT p.id, p.name, p.price, p.stock, c.quantity
       FROM cart c JOIN products p ON p.id = c.product_id
      WHERE c.user_id = $1`,
    [userId],
  );
  if (rows.length === 0) throw ApiError.badRequest("Your cart is empty.");
  for (const r of rows) {
    if (r.stock < r.quantity) throw ApiError.badRequest(`${r.name} has insufficient stock.`);
  }
  return rows.map((r)=>({
    product_id:r.id,
    product_name:r.name,
    unit_price:r.price,
    quantity:r.quantity,
    size
}));
}

/** Order total in paise. Prices are stored in whole rupees, so ×100 here. */
export function totalPaise(items: LineItem[]): number {
  return items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0) * 100;
}

const inr = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

/**
 * Reject an over-cap total before calling Razorpay. Without this the gateway
 * returns a bare "Amount exceeds maximum amount allowed", which surfaces as a
 * 502 and tells the buyer nothing about what to do. Couture pricing means a
 * full cart genuinely clears the ₹5,00,000 ceiling.
 */
export function assertWithinPaymentLimit(amountPaise: number): void {
  const cap = env.razorpay.maxOrderPaise;
  if (amountPaise > cap) {
    throw ApiError.badRequest(
      `This order totals ${inr(amountPaise)}, above the ${inr(cap)} limit for a single payment. ` +
        `Please check out in smaller batches, or contact us to arrange the purchase.`,
    );
  }
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
  await withTransaction(async (client) => {
    // FOR UPDATE holds the row until commit, so a callback and a webhook
    // arriving together are serialized rather than both decrementing stock.
    const { rows } = await client.query<{ id: number; user_id: number | null; status: string }>(
      "SELECT id, user_id, status FROM orders WHERE razorpay_order_id = $1 FOR UPDATE",
      [razorpayOrderId],
    );
    if (rows.length === 0) throw ApiError.notFound("Order not found for payment.");
    const order = rows[0];

    if (order.status === "paid") return; // already processed → no-op

    await client.query(
      `UPDATE orders
          SET status = 'paid', razorpay_payment_id = $1, razorpay_signature = $2,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $3`,
      [paymentId, signature, order.id],
    );

    const { rows: items } = await client.query<{ product_id: number | null; quantity: number }>(
      "SELECT product_id, quantity FROM order_items WHERE order_id = $1",
      [order.id],
    );
    for (const it of items) {
      if (it.product_id == null) continue;
      await client.query(
        "UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2",
        [it.quantity, it.product_id],
      );
    }

    if (order.user_id != null) {
      await client.query("DELETE FROM cart WHERE user_id = $1", [order.user_id]);
    }
  });
}
