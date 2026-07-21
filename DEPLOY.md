# Deploying Tanesha Baxi (React + Express + Postgres)

This app has two deployable parts:

- **`frontend/`** — a static React (Vite) build. Plain files, hosts anywhere.
- **`backend/`** — an Express + TypeScript API on **PostgreSQL**.

## The topology

GoDaddy cPanel cannot run the Express API — the plan has no working "Setup
Node.js App", and installing Node by hand on the box is not a maintainable
path. So the three pieces are split:

| Piece | Host | Why |
| --- | --- | --- |
| Storefront (static) | GoDaddy cPanel `public_html` | Already paid for; static files are all cPanel needs to do well. |
| API (Express) | **Render** | Real Node runtime, deploys from git. |
| Database | **Neon** (Postgres) | Managed, free tier, reachable from anywhere. |

The API being on a different origin than the storefront is already handled: the
session cookie is issued `SameSite=None; Secure` whenever `COOKIE_SECURE=true`,
and CORS is locked to `CLIENT_ORIGIN` with credentials enabled.

> If Render's free tier proves too limiting, the storefront and API can both
> move without code changes — the frontend only needs `VITE_API_BASE` repointed.
> cPanel remains a static-hosting fallback for the frontend either way.

---

## 0. Database — Neon

1. Create a project at [neon.tech]. Pick the region closest to the customers
   (`ap-south-1` / Mumbai for an India-facing store).
2. Copy the connection string, and make sure you take the **pooled** one — the
   host contains `-pooler`. The pooled endpoint is what a serverless-ish web
   service should use.
3. That string is `DATABASE_URL`. It ends in `?sslmode=require`; keep that.

TLS is verified normally against Neon's certificate. Only if verification ever
fails should you set `DB_SSL_REJECT_UNAUTHORIZED=false` — it is a real
downgrade, so treat it as a last resort, not a default.

### Migrate and seed

Run these **from your machine**, pointed at the Neon URL. Render's free tier has
neither a pre-deploy hook nor shell access, and Neon is publicly reachable, so
driving it locally is both simpler and the only free option:

```bash
cd backend
# put the Neon DATABASE_URL in backend/.env first
npm run migrate      # creates the schema; idempotent, safe to re-run
npm run seed         # 12 products + the admin from SEED_ADMIN_* — run ONCE
```

`migrate` tracks applied files in a `schema_migrations` table, so re-running it
is a no-op. Each new `.sql` file in `src/db/migrations/` is applied in filename
order inside its own transaction.

---

## 1. Backend — Render

The repo ships a `render.yaml` blueprint at the root, so the service arrives
pre-configured.

1. Push the repo to GitHub.
2. Render dashboard → **New → Blueprint** → pick the repo. It reads
   `render.yaml` and proposes a `tanesha-baxi-api` web service.
3. Fill in the secrets it marks as required (these are deliberately not in the
   repo): `DATABASE_URL`, `CLIENT_ORIGIN`, and the three `RAZORPAY_*` values.
   `JWT_SECRET` is generated for you; `NODE_ENV` and `COOKIE_SECURE` are preset.
4. Deploy. Health checks hit `/api/health`; the log should show `[db] connected.`

To set it up by hand instead of via the blueprint, the settings are:

- **Root directory**: `backend`
- **Build command**: `npm ci --include=dev && npm run build`
- **Start command**: `npm run start`
- **Health check path**: `/api/health`

> `--include=dev` is not optional. With `NODE_ENV=production` set, npm skips
> devDependencies — and TypeScript lives there, so the build fails without it.

Render injects `PORT`; the server already reads it. `trust proxy` is on, so
`Secure` cookies and client IPs survive Render's proxy.

### Two free-tier limits worth knowing up front

**Cold starts.** A free service sleeps after ~15 minutes idle and takes ~50s to
wake. The first visitor after a quiet spell waits. Razorpay webhooks retry on
timeout so payments still reconcile, but a payment can appear to lag by a
minute. The $7/mo Starter plan removes this.

**Uploads are ephemeral — this one silently breaks data.** Free services have no
persistent disk, so anything written to `backend/uploads/` is lost on every
redeploy and restart. The 12 seeded products are unaffected (their `img` values
are CSS gradient presets like `cherry`, not files), but any product image an
admin uploads through the inventory page will 404 after the next deploy — the
product row survives, the picture does not. Options:

- Have the admin pick one of the built-in gradient presets rather than uploading.
- Add a Render persistent disk mounted at `backend/uploads` (paid plan).
- Move uploads to an object store (Cloudinary's free tier fits this volume).

---

## 2. Frontend — static build to cPanel

1. Point the build at the API. In `frontend/.env`:
   ```
   VITE_API_BASE=https://tanesha-baxi-api.onrender.com
   ```
   This is baked in at build time, so changing it means rebuilding.
2. Build:
   ```bash
   cd frontend
   npm ci
   npm run build        # outputs frontend/dist
   ```
3. Upload the **contents** of `frontend/dist/` into `public_html` (or the
   storefront subdomain's docroot).
4. Add an `.htaccess` in that docroot so client-side routes (`/product`,
   `/admin`, …) fall back to `index.html` instead of 404ing:
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
5. Confirm the design assets resolve at `https://<site>/assets/...`.

Then set `CLIENT_ORIGIN` on Render to this exact origin (scheme + host, no
trailing slash) and redeploy. A mismatch here is the usual cause of "login
succeeds but I'm logged out on the next page" — the cookie is rejected by CORS.

---

## 3. Razorpay

1. Put the live (or test) `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` in Render's
   environment.
2. Razorpay Dashboard → **Settings → Webhooks** → add:
   - **URL**: `https://<render-service>.onrender.com/api/webhooks/razorpay`
   - **Secret**: set one, and copy the same value into `RAZORPAY_WEBHOOK_SECRET`.
   - **Active events**: `payment.captured` (optionally `order.paid`).
3. The webhook is the **source of truth**: it flips orders to `paid`, decrements
   stock, and clears the buyer's cart — idempotently, guarded by a
   `SELECT … FOR UPDATE` so a webhook and an in-page callback arriving together
   cannot double-decrement. The in-page verify is just a fast confirmation.

> **Rotate the previously-committed keys.** The old root `.env` exposed a
> Razorpay key pair in git history. Generate a fresh pair and use only those.

---

## 4. Go-live checklist

- [ ] `NODE_ENV=production`, `COOKIE_SECURE=true`, strong unique `JWT_SECRET`.
- [ ] `CLIENT_ORIGIN` exactly matches the storefront origin (scheme + host).
- [ ] `VITE_API_BASE` points at the Render URL, and the frontend was rebuilt after setting it.
- [ ] Neon migrated + seeded; admin password changed from the seed default.
- [ ] Razorpay keys + webhook configured; a test payment completes and the order shows `paid`.
- [ ] Decided how product images are handled given the ephemeral-disk limit (§1).
- [ ] Old `app.py` / `*.html` / `inventory.db` / root `.env` deleted once parity is confirmed.

## 5. Local development

```bash
cd backend  && cp .env.example .env   # fill in DATABASE_URL at minimum
npm install && npm run migrate && npm run seed && npm run dev

cd frontend && npm install && npm run dev
```

`COOKIE_SECURE=false` locally so the cookie works over plain http, and Vite
proxies `/api` and `/uploads` to the backend.
