import type { Request, Response } from "express";
import { query } from "../db/pool.js";

export async function getDashboard(_req: Request, res: Response): Promise<void> {
  const orders = await query(
    `SELECT o.id, o.client_email, o.amount, o.currency, o.status, o.created_at AS ordered_at,
            GROUP_CONCAT(oi.product_name SEPARATOR ', ') AS product_name
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.id DESC`,
  );
  const appointments = await query(
    "SELECT id, client_name, consultation_type, appointment_date FROM appointments ORDER BY id DESC",
  );
  const traffic = await query(
    "SELECT id, date_logged, unique_visitors, page_views FROM traffic ORDER BY id DESC LIMIT 7",
  );

  // Revenue counts only successfully paid orders (amount is in paise).
  const [rev] = await query<{ total: number | null }>(
    "SELECT SUM(amount) AS total FROM orders WHERE status = 'paid'",
  );
  const [ordCount] = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM orders WHERE status = 'paid'",
  );

  res.json({
    status: "success",
    metrics: {
      total_revenue: Math.round((rev?.total ?? 0) / 100), // paise → rupees
      total_orders: ordCount?.n ?? 0,
      today_visitors: (traffic[0] as { unique_visitors?: number })?.unique_visitors ?? 0,
    },
    orders,
    appointments,
    traffic,
  });
}

export async function getClients(_req: Request, res: Response): Promise<void> {
  const clients = await query(
    `SELECT client_email,
            COUNT(id)       AS total_orders,
            ROUND(SUM(amount) / 100) AS ltv,
            MAX(created_at) AS last_active
       FROM orders
      WHERE status = 'paid'
      GROUP BY client_email
      ORDER BY ltv DESC`,
  );
  res.json({ status: "success", data: clients });
}

export async function getUsers(_req: Request, res: Response): Promise<void> {
  // Note: password_hash is deliberately never selected.
  const users = await query(
    `SELECT id, first_name, last_name, email, phone, house, street, landmark,
            city, state, pincode, country, role, created_at
       FROM users
      ORDER BY id DESC`,
  );
  res.json({ status: "success", data: users });
}
