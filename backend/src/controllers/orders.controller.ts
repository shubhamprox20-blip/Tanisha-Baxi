import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { query, withTransaction } from "../db/pool.js";
import { ApiError } from "../utils/ApiError.js";
import { getRazorpay, verifyCheckoutSignature, verifyWebhookSignature } from "../services/razorpay.js";
import {
  assertWithinPaymentLimit,
  markOrderPaid,
  resolveLineItems,
  totalPaise,
} from "../services/orders.js";

/** Create a Razorpay order and a matching `pending` order row (+ line items). */
export async function createOrder(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const email = req.user!.email;
  const { product_id } = req.body as { product_id?: number };

  const items = await resolveLineItems(userId, product_id);
  const amount = totalPaise(items);
  assertWithinPaymentLimit(amount);

  const receipt = `TB-${userId}-${Date.now()}`;
  let rzpOrder: { id: string };
  try {
    rzpOrder = await getRazorpay().orders.create({ amount, currency: "INR", receipt });
  } catch (err) {
    const desc = (err as { error?: { description?: string } })?.error?.description;
    console.error("[razorpay] order.create failed:", err);
    throw new ApiError(502, desc ? `Payment gateway error: ${desc}` : "Could not reach the payment gateway. Please try again.");
  }

  await withTransaction(async (client) => {
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO orders (user_id, client_email, amount, currency, status, razorpay_order_id)
       VALUES ($1, $2, $3, 'INR', 'pending', $4)
       RETURNING id`,
      [userId, email, amount, rzpOrder.id],
    );
    const orderId = rows[0].id;
    for (const it of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, it.product_id, it.product_name, it.unit_price, it.quantity],
      );
    }
  });

  res.status(201).json({
    status: "success",
    key_id: env.razorpay.keyId,
    order_id: rzpOrder.id,
    amount,
    currency: "INR",
    name: items.length === 1 ? items[0].product_name : `${items.length} items`,
  });
}

/** Verify the checkout callback signature and mark the order paid. */
export async function verifyPayment(req: Request, res: Response): Promise<void> {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as {
    razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string;
  };

  if (!verifyCheckoutSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    // Record the failed attempt so it isn't left dangling as pending forever.
    throw ApiError.badRequest("Payment signature verification failed.");
  }

  await markOrderPaid(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  res.json({ status: "success", message: "Payment verified." });
}

/**
 * Razorpay webhook — source of truth. Mounted with a raw body parser so the
 * signature can be verified over the exact bytes received.
 */
export async function razorpayWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.header("x-razorpay-signature") ?? "";
  const rawBody = req.body as Buffer; // express.raw()

  if (!verifyWebhookSignature(rawBody, signature)) {
    throw ApiError.unauthorized("Invalid webhook signature.");
  }

  const event = JSON.parse(rawBody.toString("utf8"));
  const type = event?.event as string | undefined;

  if (type === "payment.captured" || type === "order.paid") {
    const payment = event?.payload?.payment?.entity;
    const orderEntity = event?.payload?.order?.entity;
    const razorpayOrderId = payment?.order_id ?? orderEntity?.id;
    const paymentId = payment?.id ?? null;
    if (razorpayOrderId && paymentId) {
      await markOrderPaid(razorpayOrderId, paymentId, null);
    }
  }

  // Always 200 quickly so Razorpay doesn't retry a handled event.
  res.json({ status: "success" });
}

/** Orders belonging to the logged-in user (for the profile page). */
export async function listMyOrders(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const orders = await query(
    `SELECT o.id, o.amount, o.currency, o.status, o.created_at AS ordered_at,
            STRING_AGG(oi.product_name, ', ') AS product_name
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.id DESC`,
    [userId],
  );
  res.json({ status: "success", data: orders });
}
