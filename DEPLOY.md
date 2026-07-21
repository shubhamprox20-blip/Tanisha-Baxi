# Deploying Tanesha Baxi (React + Express) to GoDaddy cPanel

This app has two parts:

- **`frontend/`** — a static React (Vite) build. Ships as plain files.
- **`backend/`** — an Express + TypeScript API backed by **cPanel MySQL**.

The client's hosting is GoDaddy cPanel. The **primary** deployment keeps everything
on that hosting. A **fallback** (if the plan has no Node.js support) runs the API on an
external host. Both are documented below.

---

## 0. One-time: create the MySQL database (cPanel → "MySQL Databases")

1. Create a database, e.g. `cpaneluser_tanesha`.
2. Create a user, e.g. `cpaneluser_app`, with a strong password.
3. Add the user to the database with **ALL PRIVILEGES**.
4. Note the final names — cPanel prefixes them with your account name. These map to the
   backend env vars `DB_NAME`, `DB_USER`, `DB_PASSWORD`. `DB_HOST` is usually `localhost`.

---


## 1. Backend — primary path: cPanel "Setup Node.js App" (Passenger)

> First confirm the plan has the **"Setup Node.js App"** icon in cPanel. If it is missing,
> skip to §3 (external host fallback).

1. **Build locally** and upload, or build on the server:
   ```bash
   cd backend
   npm ci
   npm run build          # compiles TypeScript to backend/dist
   ```
2. Upload the `backend/` folder (including `dist/`, `package.json`, `src/db/migrations`)
   to a folder **outside** `public_html`, e.g. `/home/cpaneluser/tanesha-api`.
   Do **not** upload `.env` or `node_modules`.
3. In cPanel → **Setup Node.js App** → **Create Application**:
   - **Node.js version**: 18+.
   - **Application root**: `tanesha-api`.
   - **Application URL**: a subdomain like `api.taneshabaxi.com` (recommended) or a path.
   - **Application startup file**: `dist/server.js`.
4. In the app's **Environment variables** panel, add every key from `backend/.env.example`
   with real values (`NODE_ENV=production`, `COOKIE_SECURE=true`, the DB\_\* values from §0,
   a strong `JWT_SECRET`, the real Razorpay keys, `CLIENT_ORIGIN` = the storefront URL).
5. Click **Run NPM Install**, then open the app's terminal (or use the "Run JS script"
   feature) to run the migration and seed **once**:
   ```bash
   npm run migrate
   npm run seed        # creates the 12 products + the admin from SEED_ADMIN_* envs
   ```
6. **Restart** the app. It should log `[db] connected.` and start listening.

The uploaded product images live in `backend/uploads/`. Passenger serves them at
`/uploads/...` automatically because Express does. Make sure this folder is writable.

## 2. Frontend — static build to cPanel

1. Set the API base. In `frontend/.env` (build-time):
   - **Same domain, API on a subdomain**: `VITE_API_BASE=https://api.taneshabaxi.com`
   - **API reverse-proxied under the same origin at `/api`**: leave `VITE_API_BASE` empty.
2. Build:
   ```bash
   cd frontend
   npm ci
   npm run build        # outputs frontend/dist
   ```
3. Upload the **contents** of `frontend/dist/` into `public_html` (or the storefront
   subdomain's docroot).
4. Add an `.htaccess` in that docroot so client-side routes (`/product`, `/admin`, …)
   fall back to `index.html`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```
5. The design assets in `frontend/public/assets/` are bundled into `dist/assets`… actually
   they are copied to `dist/` root under `/assets` by Vite — confirm the logo/hero images
   resolve at `https://<site>/assets/...`.

## 3. Backend — fallback: external Node host

If the GoDaddy plan cannot run Node:

1. Deploy `backend/` to a small Node host (Render, Railway, Fly, a VPS, etc.).
2. Point that host's DB env vars at a MySQL it can reach. Two options:
   - Enable **Remote MySQL** in cPanel and whitelist the external host's IP, keeping the DB
     on GoDaddy, **or**
   - Use a managed MySQL on the external provider.
3. Set `CLIENT_ORIGIN` to the storefront URL and `COOKIE_SECURE=true`.
4. Build the frontend with `VITE_API_BASE=https://<external-api-host>` and upload `dist/`
   to `public_html` as in §2. Because the API is now cross-origin, the cookie is sent with
   `SameSite=None; Secure` (already handled when `COOKIE_SECURE=true`) and CORS is locked
   to `CLIENT_ORIGIN`.

---

## 4. Razorpay

1. Put the **live** (or test) `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` in the backend env.
2. In the Razorpay Dashboard → **Settings → Webhooks**, add a webhook:
   - **URL**: `https://<api-host>/api/webhooks/razorpay`
   - **Secret**: set it and copy the same value into `RAZORPAY_WEBHOOK_SECRET`.
   - **Active events**: `payment.captured` (and optionally `order.paid`).
3. The webhook is the **source of truth**: it flips orders to `paid`, decrements stock, and
   clears the buyer's cart, idempotently. The in-page verification call is a fast confirm;
   the webhook guarantees correctness even if the browser closes.

> **Rotate the currently-committed keys.** The old `.env` in the project root contains a
> Razorpay key pair that has been exposed in the repo. Generate a fresh pair in the Razorpay
> dashboard and use only those going forward. Never commit `.env`.

---

## 5. Go-live checklist

- [ ] `NODE_ENV=production`, `COOKIE_SECURE=true`, strong unique `JWT_SECRET`.
- [ ] `CLIENT_ORIGIN` exactly matches the storefront URL (scheme + host).
- [ ] MySQL migrated + seeded; admin password changed from the seed default.
- [ ] Razorpay live keys + webhook configured and test payment completed.
- [ ] `uploads/` folder writable; a test product-image upload succeeds.
- [ ] Old files removed once parity is confirmed (see below).

## 6. Retiring the old app

The legacy `app.py`, `*.html`, `scriptforyou.js`, `setup_db.js`, `inventory.db`, and the
root `.env` are the **old** stack. Keep them until the new site is verified in production,
then delete them so the exposed keys and plaintext-password code are gone for good.
