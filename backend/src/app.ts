import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { router } from "./routes/index.js";
import { attachUser } from "./middleware/auth.js";
import { asyncHandler } from "./middleware/asyncHandler.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { razorpayWebhook } from "./controllers/orders.controller.js";

export function createApp() {
  const app = express();

  // Behind cPanel/Passenger or any proxy, trust it so secure cookies & IPs work.
  app.set("trust proxy", 1);

  // cors must run before helmet so its Access-Control-* headers are not
  // overridden by helmet's Cross-Origin-Resource-Policy: same-origin default.
  const corsOptions: cors.CorsOptions = {
    origin: true,       // reflect the request's Origin — allows any origin
    credentials: true,  // needed for httpOnly cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions)); // handle preflight for all routes
  app.use((helmet as any)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));
  app.use(morgan(env.isProd ? "combined" : "dev"));

  // Razorpay webhook must see the RAW body to verify its signature — mount it
  // before the JSON body parser.
  app.post(
    "/api/webhooks/razorpay",
    express.raw({ type: "application/json" }),
    attachUser,
    asyncHandler(razorpayWebhook),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(generalLimiter);

  app.use("/api", router);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

// Vercel serverless handler — must be a default export of the Express app instance.
export default createApp();
