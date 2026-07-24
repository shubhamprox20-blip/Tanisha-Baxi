import dotenv from "dotenv";

dotenv.config();

/** Read a required env var or throw a clear startup error. */
function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

/** Read an optional env var with a fallback default. */
function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

const NODE_ENV = optional("NODE_ENV", "development");
const isProd = NODE_ENV === "production";

export const env = {
  nodeEnv: NODE_ENV,
  isProd,
  port: Number(optional("PORT", "5000")),
  clientOrigin: optional("CLIENT_ORIGIN", "http://localhost:5173"),

  jwtSecret: isProd ? required("JWT_SECRET") : optional("JWT_SECRET", "dev-insecure-secret"),
  jwtExpiresIn: optional("JWT_EXPIRES_IN", "7d"),
  cookieSecure: optional("COOKIE_SECURE", isProd ? "true" : "false") === "true",

  // Postgres connection string (Neon: copy the pooled "-pooler" URL).
  databaseUrl: required("DATABASE_URL"),
  // Only set false if the provider's TLS certificate fails verification.
  dbSslRejectUnauthorized: optional("DB_SSL_REJECT_UNAUTHORIZED", "true") === "true",
  dbPoolMax: Number(optional("DB_POOL_MAX", "10")),

  razorpay: {
    keyId: optional("RAZORPAY_KEY_ID", ""),
    keySecret: optional("RAZORPAY_KEY_SECRET", ""),
    webhookSecret: optional("RAZORPAY_WEBHOOK_SECRET", ""),
    // Razorpay rejects a single order above ₹5,00,000 (verified against the
    // test API: 50000000 paise succeeds, 50000100 returns "Amount exceeds
    // maximum amount allowed"). Raise only if Razorpay lifts it for this
    // account — the ceiling is per-account and per-method.
    maxOrderPaise: Number(optional("RAZORPAY_MAX_ORDER_PAISE", "50000000")),
  },

  upload: {
    // 4 MB — stays under Vercel's 4.5 MB serverless payload limit.
    maxBytes: Number(optional("MAX_UPLOAD_BYTES", "4194304")),
  },

  cloudinary: {
    cloudName: required("CLOUDINARY_CLOUD_NAME"),
    apiKey: required("CLOUDINARY_API_KEY"),
    apiSecret: required("CLOUDINARY_API_SECRET"),
  },

  seed: {
    adminEmail: optional("SEED_ADMIN_EMAIL", "admin@taneshabaxi.com"),
    adminPassword: optional("SEED_ADMIN_PASSWORD", "change-me-strong"),
  },
} as const;

/** True when Razorpay credentials are present; payment routes guard on this. */
export const razorpayConfigured = Boolean(env.razorpay.keyId && env.razorpay.keySecret);
