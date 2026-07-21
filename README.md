# Tanesha Baxi — Fashion House E-commerce

Productionized full-stack rebuild of the Tanesha Baxi storefront.

- **`frontend/`** — React + Vite SPA. A pixel-faithful port of the original design
  (the finalized CSS is preserved verbatim per page and loaded only while that page is
  mounted). Storefront, product detail, profile, and the admin dashboard/inventory/clients.
- **`backend/`** — Express + TypeScript API on **PostgreSQL** (`pg`). Real cookie-session
  auth (bcrypt + JWT), role-based admin access, Zod validation, central error handling,
  helmet/CORS/rate-limiting, and a correct Razorpay order + webhook flow.

The legacy Flask app (`app.py`, the `*.html` files, `scriptforyou.js`, `inventory.db`) is
kept for reference only and should be removed once the new stack is verified in production.

## Local development

Prerequisites: Node 18+, and a PostgreSQL 15+ database — either a free
[Neon](https://neon.tech) project (easiest; same as production) or a local instance.

```bash
# 1. Database — a Neon project, or locally via Docker
docker run -d --name tanesha-pg \
  -e POSTGRES_PASSWORD=apppw -e POSTGRES_USER=tanesha_app \
  -e POSTGRES_DB=tanesha_shop \
  -p 5433:5432 postgres:16

# 2. Backend
cd backend
cp .env.example .env          # fill DATABASE_URL, JWT_SECRET, RAZORPAY_* (test keys ok locally)
npm install
npm run migrate               # create the schema
npm run seed                  # 12 products + an admin (from SEED_ADMIN_* in .env)
npm run dev                   # http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env          # leave VITE_API_BASE empty for the dev proxy
npm install
npm run dev                   # http://localhost:5173  (proxies /api + /uploads to :5000)
```

Open http://localhost:5173. Sign in with the seeded admin to reach `/admin`, `/inventory`,
`/clients`.

## Scripts

**backend:** `dev`, `build`, `start`, `migrate`, `seed`, `migrate:prod`, `seed:prod`,
`typecheck`, `lint`, `test`
**frontend:** `dev`, `build`, `preview`, `typecheck`

The `:prod` variants run the compiled `dist/` build instead of `tsx`, for environments
without devDependencies.

## Deployment

Static frontend on GoDaddy cPanel, Express API on **Render**, database on **Neon**
(Postgres). See [DEPLOY.md](DEPLOY.md) for the full guide, including the Razorpay webhook
config and Render's free-tier caveats.

## Security notes

- Passwords are bcrypt-hashed; **no endpoint ever returns password data**.
- Admin routes require an authenticated user with `role = 'admin'` (not a shared header).
- Order amounts are always computed server-side from the DB — never trusted from the client.
- Rotate the Razorpay keys that were previously committed to the old root `.env`.
