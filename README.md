# Tanesha Baxi — Fashion House E-commerce

Productionized full-stack rebuild of the Tanesha Baxi storefront.

- **`frontend/`** — React + Vite SPA. A pixel-faithful port of the original design
  (the finalized CSS is preserved verbatim per page and loaded only while that page is
  mounted). Storefront, product detail, profile, and the admin dashboard/inventory/clients.
- **`backend/`** — Express + TypeScript API on **MySQL** (`mysql2`). Real cookie-session
  auth (bcrypt + JWT), role-based admin access, Zod validation, central error handling,
  helmet/CORS/rate-limiting, and a correct Razorpay order + webhook flow.

The legacy Flask app (`app.py`, the `*.html` files, `scriptforyou.js`, `inventory.db`) is
kept for reference only and should be removed once the new stack is verified in production.

## Local development

Prerequisites: Node 18+, and a MySQL 8 instance (local, Docker, or remote cPanel).

```bash
# 1. Database — e.g. via Docker
docker run -d --name tanesha-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpw -e MYSQL_DATABASE=tanesha_shop \
  -e MYSQL_USER=tanesha_app -e MYSQL_PASSWORD=apppw \
  -p 3307:3306 mysql:8.0

# 2. Backend
cd backend
cp .env.example .env          # fill DB_*, JWT_SECRET, RAZORPAY_* (test keys ok locally)
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

**backend:** `dev`, `build`, `start`, `migrate`, `seed`, `typecheck`, `lint`, `test`
**frontend:** `dev`, `build`, `preview`, `typecheck`

## Deployment

See [DEPLOY.md](DEPLOY.md) for the cPanel/GoDaddy deployment guide (MySQL setup, the
"Setup Node.js App" path, the external-host fallback, and the Razorpay webhook config).

## Security notes

- Passwords are bcrypt-hashed; **no endpoint ever returns password data**.
- Admin routes require an authenticated user with `role = 'admin'` (not a shared header).
- Order amounts are always computed server-side from the DB — never trusted from the client.
- Rotate the Razorpay keys that were previously committed to the old root `.env`.
