# Tanesha Baxi — Productionized Full-Stack Rebuild (React + Express)

## Context
The Tanesha Baxi fashion-house e-commerce site currently runs as a set of hand-written
static HTML pages (design already finalized and approved by the client) plus a single
1000-line Flask `app.py` backend on SQLite. The backend is not production-grade:

- Passwords are stored and returned in **plaintext**; `/api/users` leaks every user's
  password with no authentication and the admin page displays them.
- "Admin auth" is a plaintext password in an `X-Admin-Password` header.
- Several mutating endpoints (`PUT /api/products`, `POST /api/upload`) have no auth.
- Razorpay is wired up but **no order is ever persisted**, there is no webhook, no stock,
  and `get_profile` reads a non-existent `orders.user_id` column.
- Secrets (Flask key, Razorpay keys) are hardcoded / committed.

**Goal:** rebuild as a proper productionized full-stack app — **React** frontend +
**Express** backend — with real authentication, role-based admin access control, robust
error handling, and a correct Razorpay + DB payment/order flow. The finalized visual
design must be preserved pixel-for-pixel. New code goes in two new folders inside the
project root: `frontend/` and `backend/`. Deployment target stays GoDaddy cPanel.

---

## Guiding principles
- **Design is frozen.** Port the existing CSS/markup verbatim; do not redesign.
- **Never trust the client.** Prices, roles, and order amounts come from the DB, never the request body.
- **Secrets only in env**, never committed. Rotate the currently-committed Razorpay keys.

---

## Target architecture

```
tanishkabaxi/
├─ frontend/          # React + Vite SPA (pixel-identical port of current HTML/CSS)
├─ backend/           # Express + TypeScript API (replaces app.py)
├─ (existing HTML/py kept until parity is verified, then removed)
```

- **Frontend:** React + Vite. Existing embedded CSS moved to a global stylesheet
  (same CSS variables/classes) so output is identical. Pages become React routes:
  `/` (storefront, from index.html), `/product`, `/profile`, and admin routes
  `/admin`, `/inventory`, `/clients`. Vanilla behaviors (intro, theme toggle, marquee,
  drawers, modals, particles, Three.js product scene, filters) become React hooks/effects,
  preserving exact DOM + class names. Three.js added as an npm dep (drop the CDN importmap).
- **Backend:** Express (TypeScript) with a layered structure — `routes/`, `controllers/`,
  `services/`, `middleware/`, `db/`. Central error-handling middleware; every route wrapped
  so failures return consistent `{status, message}` JSON with correct HTTP codes.
- **DB:** **Neon PostgreSQL** (managed; was cPanel MySQL — see "Revision" below), accessed
  via `pg` with a connection pool and SQL migration files. Proper schema replaces the
  ad-hoc SQLite. Add missing columns/tables: product `stock`, `orders.user_id` +
  `razorpay_order_id` + `razorpay_payment_id` + `amount` + `currency` + `status`,
  and an `order_items` line-item table.
- **Auth:** httpOnly, Secure, SameSite cookie session (JWT or server session). Passwords
  hashed with bcrypt. `role` claim drives an `requireAuth` / `requireAdmin` middleware.
- **Payments:** server creates Razorpay order from **DB price** and writes a `pending`
  order row; client callback signature is verified server-side; a **Razorpay webhook**
  (`payment.captured`) is the source of truth that flips the order to `paid` and decrements
  stock. Amounts never come from the client.

---

## Work plan (phased)

### Phase 0 — Scaffold
- Create `backend/` (Express + TS, ESLint, dotenv, `.env.example`) and `frontend/` (Vite React).
- `.gitignore` for `.env`, `node_modules`, build output, `*.db`.

### Phase 1 — Backend core
- Postgres layer (`pg` pool) + schema/migrations + seed (12 products from `setup_db.js`, an admin user with a hashed password).
- Auth: register/login/logout/me with bcrypt + cookie session; input validation (zod).
- `requireAuth` / `requireAdmin` middleware; central error handler; request logging (morgan/pino); helmet + CORS locked to the site origin with credentials.
- Rate-limit auth + payment endpoints.

### Phase 2 — Backend features (port app.py, fixed)
- Products CRUD (**admin-gated** for POST/PUT/DELETE), server-side validation, file upload
  with type/size limits + auth.
- Cart & favorites: single source of truth = DB (drop localStorage duplication).
- Orders: creation tied to `user_id`; tracking; admin dashboard/clients/users
  (**never returning password hashes**).
- Appointments, newsletter.

### Phase 3 — Payments (Razorpay, correct flow)
- `POST /api/orders` → validate cart/product server-side, create Razorpay order, insert
  `pending` order (+ line items).
- `POST /api/payments/verify` → verify callback signature.
- `POST /api/webhooks/razorpay` → verify webhook signature, mark `paid`, decrement stock (idempotent).

### Phase 4 — Frontend React port
- Port global CSS + assets; rebuild pages as components with identical DOM/classes.
- API client (fetch wrapper w/ credentials, error toasts reusing existing `showToast`).
- Wire auth modal, cart/favorites drawers, product page + Three.js, admin pages.
- Razorpay Checkout script integration on the client.

### Phase 5 — Hardening & deploy *(revised: split hosting — see "Revision" below)*
- Security headers, HTTPS-only cookies, rotate secrets, remove leaked keys.
- **Frontend:** `vite build` → upload static `dist/` to cPanel `public_html` (or a subdomain),
  built with `VITE_API_BASE` pointing at the Render API.
- **Backend:** deploy Express to **Render** from the root `render.yaml` blueprint, with
  secrets set in the Render dashboard. Cross-origin session cookies work via
  `SameSite=None; Secure` + CORS locked to `CLIENT_ORIGIN`.
- **DB:** **Neon** Postgres; migrate/seed driven locally against the Neon URL.
- Smoke-test full flow end-to-end on the live host (including the Razorpay webhook URL).

---

## Critical files
- Replace: `app.py`, `setup_db.js`, `scriptforyou.js`, `admin.html`, `index.html`,
  `product.html`, `inventory.html`, `clients.html`, `profile.html`.
- Reuse as reference (do not lose): all CSS inside the `<style>` blocks, `assets/`,
  product seed data in `setup_db.js`, Razorpay flow in `app.py:824-889`.

## Verification
- Backend: unit/integration tests for auth, admin gating, payment signature + webhook.
- Manual E2E: register → login → browse → cart → checkout (Razorpay test) → webhook marks
  paid → order visible in profile + admin. Confirm non-admin blocked from admin APIs and
  no endpoint returns password data.
- Visual parity: side-by-side the React `/` against current index.html (intro, theme,
  marquee, drawers, 3D product) before deleting old files.

## Decisions (locked)
- **Database:** ~~cPanel MySQL~~ → **Neon (PostgreSQL)** via `pg` + migrations. *(revised — see below)*
- **Scope:** full rebuild in one effort — storefront + product + profile + auth +
  payments **and** admin/inventory/clients dashboards.
- **Hosting:** ~~single-host GoDaddy cPanel~~ → **split**: static frontend on cPanel,
  Express API on **Render**, database on Neon. *(revised — see below)*

## Revision — hosting & database (2026-07)

The runtime unknown flagged below resolved **negatively**: the client's GoDaddy plan does
not usably expose cPanel "Setup Node.js App", and the alternative — hand-installing Node
on the box — is not maintainable. The documented external-host fallback is therefore the
real plan, not a contingency.

That decision cascaded into the database. With the API off cPanel, keeping MySQL on cPanel
would mean exposing it over Remote MySQL and whitelisting IPs. A managed DB the API can
simply reach is both simpler and safer, and **Neon** is Postgres-only — so the backend
moved from `mysql2`/MySQL to `pg`/PostgreSQL.

**What that migration touched:**
- `mysql2` pool → `pg` `Pool`; `?` placeholders → `$1, $2, …` throughout.
- `insertId` → `RETURNING id`; `affectedRows` → `rowCount`.
- `ON DUPLICATE KEY UPDATE … VALUES(x)` → `ON CONFLICT (…) DO UPDATE … EXCLUDED.x`.
- `INSERT IGNORE` → `ON CONFLICT DO NOTHING`.
- `GROUP_CONCAT(x SEPARATOR ', ')` → `STRING_AGG(x, ', ')`.
- MySQL `ENUM` columns → Postgres `CREATE TYPE … AS ENUM`; `AUTO_INCREMENT` → `SERIAL`.
- Error mapping `ER_DUP_ENTRY` → SQLSTATE `23505` / `23503`.
- `int8`/`numeric` type parsers registered, because `pg` returns aggregates as strings.
- Migration `002` fixes the `SERIAL` sequences, which the explicit-id product seed left
  parked at 1 (the next admin-created product would have collided on the primary key).

**Free-tier caveat carried into DEPLOY.md:** Render's free plan has no persistent disk, so
admin-uploaded product images do not survive a redeploy. The seeded catalogue is unaffected
(its `img` values are gradient presets, not files). Resolve by using the presets, adding a
paid disk, or moving uploads to an object store.

*Still open:* if Render's free tier proves too limiting, the API can move hosts with no code
change — only `VITE_API_BASE` is repointed. The database stays on Neon regardless; a return
to cPanel would require it to offer PostgreSQL.

## First thing to confirm at build time *(resolved — see revision above)*
Whether the client's GoDaddy plan exposes cPanel **"Setup Node.js App"** — this is the one
runtime unknown. If present, single-host deploy; if not, use the external-API fallback
above. Everything else in this plan is unaffected by that outcome.