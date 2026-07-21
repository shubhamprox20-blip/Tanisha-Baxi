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

  db: {
    host: optional("DB_HOST", "localhost"),
    port: Number(optional("DB_PORT", "3306")),
    user: required("DB_USER"),
    password: optional("DB_PASSWORD", ""),
    database: required("DB_NAME"),
    connectionLimit: Number(optional("DB_CONNECTION_LIMIT", "10")),
  },

  razorpay: {
    keyId: optional("RAZORPAY_KEY_ID", ""),
    keySecret: optional("RAZORPAY_KEY_SECRET", ""),
    webhookSecret: optional("RAZORPAY_WEBHOOK_SECRET", ""),
  },

  upload: {
    dir: optional("UPLOAD_DIR", "uploads"),
    maxBytes: Number(optional("MAX_UPLOAD_BYTES", "5242880")),
  },

  seed: {
    adminEmail: optional("SEED_ADMIN_EMAIL", "admin@taneshabaxi.com"),
    adminPassword: optional("SEED_ADMIN_PASSWORD", "change-me-strong"),
  },
} as const;

/** True when Razorpay credentials are present; payment routes guard on this. */
export const razorpayConfigured = Boolean(env.razorpay.keyId && env.razorpay.keySecret);
