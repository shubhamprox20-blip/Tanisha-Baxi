import { env } from "../config/env.js";
import { pool, execute, query } from "./pool.js";
import { hashPassword } from "../utils/password.js";

/** Signature catalogue, ported verbatim from the original setup_db.js. */
const PRODUCTS = [
  { id: 1, name: "Imperial Drape Gown", meta: "Couture · Cherry Red", desc: "Structured shoulders, elongated silhouette, fluid lower drape for red-carpet presence.", price: 42000, filters: "cherry featured", img: "cherry" },
  { id: 2, name: "Sage Corridor Set", meta: "Tailoring · Sage Green", desc: "Sharply cut blazer-and-trouser dialogue with soft waist drape — boardroom to evening.", price: 28500, filters: "sage featured", img: "sage" },
  { id: 3, name: "Petal Form Dress", meta: "Evening · Dust Pink", desc: "Petal folds in dust pink that open as the body turns — soft sculpture in motion.", price: 24800, filters: "dust featured", img: "dust" },
  { id: 4, name: "Aureate Lehenga", meta: "Bridal · Gold", desc: "Gold-toned silk lehenga with monogram embroidery and an architectural blouse silhouette.", price: 85000, filters: "gold featured", img: "gold2" },
  { id: 5, name: "The Ivory Edit", meta: "Resort · Ivory", desc: "Three-piece ivory resort set — wide-leg trousers, structured top, and a draped jacket.", price: 32000, filters: "dark featured", img: "ivory" },
  { id: 6, name: "Midnight Column", meta: "Evening · Midnight", desc: "A deep navy column gown with gold-thread detail at the neckline — minimal and dramatic.", price: 38500, filters: "dark featured", img: "dark" },
  { id: 7, name: "Crimson Velvet Train", meta: "Evening · Cherry Red", desc: "A heavy velvet sweeping gown with a dramatic floor-trailing cape.", price: 54000, filters: "cherry", img: "cherry" },
  { id: 8, name: "Bloodline Corset Dress", meta: "Archivial · Cherry Red", desc: "Exposed structuring beneath sheer cherry organza with sharp hip panniers.", price: 48200, filters: "cherry", img: "cherry" },
  { id: 9, name: "Olive Silk Wrap", meta: "Resort · Sage Green", desc: "A fluid, bias-cut silk dress in washed olive that falls like water.", price: 22000, filters: "sage", img: "sage" },
  { id: 10, name: "Rosewater Tulle Skirt", meta: "Couture · Dust Pink", desc: "Thirty layers of hand-gathered dust-pink tulle over a structured silk base.", price: 65000, filters: "dust", img: "dust" },
  { id: 11, name: "Onyx Draped Blazer", meta: "Tailoring · Midnight", desc: "An oversized tailored blazer featuring an asymmetrical silk sash detail.", price: 31500, filters: "dark", img: "dark" },
  { id: 12, name: "Gilded Hourglass Gown", meta: "Evening · Gold", desc: "Hand-sequined gold geometric patterns contouring an extreme hourglass form.", price: 92000, filters: "gold", img: "gold2" },
];

const DEFAULT_STOCK = 10;

async function seedProducts(): Promise<void> {
  const existing = await query<{ n: number }>("SELECT COUNT(*) AS n FROM products");
  if (existing[0].n > 0) {
    console.log(`[seed] products table already has ${existing[0].n} rows — skipping product seed.`);
    return;
  }
  for (const p of PRODUCTS) {
    await execute(
      `INSERT INTO products (id, name, meta, description, price, filters, img, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.name, p.meta, p.desc, p.price, p.filters, p.img, DEFAULT_STOCK],
    );
  }
  console.log(`[seed] inserted ${PRODUCTS.length} products.`);
}

async function seedAdmin(): Promise<void> {
  const email = env.seed.adminEmail.toLowerCase();
  const existing = await query<{ id: number }>("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length > 0) {
    console.log(`[seed] admin ${email} already exists — skipping.`);
    return;
  }
  const hash = await hashPassword(env.seed.adminPassword);
  await execute(
    `INSERT INTO users
      (first_name, last_name, email, phone, password_hash, house, street, city, state, pincode, country, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin')`,
    ["Tanesha", "Baxi", email, "0000000000", hash, "Atelier", "Studio", "Mumbai", "Maharashtra", "400001", "India"],
  );
  console.log(`[seed] created admin user ${email}.`);
  if (env.seed.adminPassword === "change-me-strong") {
    console.warn("[seed] WARNING: admin created with the default password. Change SEED_ADMIN_PASSWORD and reset it.");
  }
}

async function run(): Promise<void> {
  await seedProducts();
  await seedAdmin();
  await pool.end();
  console.log("[seed] done.");
}

run().catch(async (err) => {
  console.error("[seed] failed:", err);
  await pool.end().catch(() => undefined);
  process.exit(1);
});
