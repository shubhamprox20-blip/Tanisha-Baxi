import type { Request, Response } from "express";
import { execute, query } from "../db/pool.js";
import { ApiError } from "../utils/ApiError.js";

export async function createAppointment(req: Request, res: Response): Promise<void> {
  const { client_name, consultation_type, appointment_date } = req.body as {
    client_name: string; consultation_type: string; appointment_date: string;
  };
  await execute(
    "INSERT INTO appointments (client_name, consultation_type, appointment_date) VALUES (?, ?, ?)",
    [client_name, consultation_type, appointment_date],
  );
  res.json({ status: "success", message: `Appointment booked for ${client_name}.` });
}

export async function subscribeNewsletter(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };
  await execute("INSERT IGNORE INTO newsletter_subscribers (email) VALUES (?)", [email]);
  res.json({ status: "success", message: "Thank you for subscribing to Tanesha Baxi news." });
}

/**
 * Look up an order by its public display id (e.g. "#TXN-1005") and email.
 * Public ids are the DB id + 1000, matching the storefront's formatting.
 */
export async function trackOrder(req: Request, res: Response): Promise<void> {
  const { order_id, email } = req.body as { order_id: string; email: string };

  const digits = order_id.replace(/\D/g, "");
  if (!digits) throw ApiError.badRequest("Invalid Order ID format.");
  let dbId = Number(digits);
  if (dbId >= 1000) dbId -= 1000;

  const rows = await query(
    `SELECT o.id, o.amount, o.currency, o.status, o.created_at AS ordered_at,
            GROUP_CONCAT(oi.product_name SEPARATOR ', ') AS product_name
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.id = ? AND LOWER(o.client_email) = LOWER(?)
      GROUP BY o.id`,
    [dbId, email],
  );

  if (rows.length === 0) {
    throw ApiError.notFound("No order found matching the provided ID and email.");
  }
  res.json({ status: "success", data: rows[0] });
}

/** Multer has already saved the file; return its public URL. */
export function uploadFile(req: Request, res: Response): void {
  if (!req.file) throw ApiError.badRequest("No file uploaded");
  res.json({ status: "success", url: `/uploads/${req.file.filename}` });
}
