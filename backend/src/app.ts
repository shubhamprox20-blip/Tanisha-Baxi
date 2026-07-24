import path from "node:path";
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

  app.use(helmet());
    app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );
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

  // Admin-uploaded product images. Served under /uploads so it never collides
  // with the frontend's own design assets at /assets. In dev the Vite proxy
  // forwards /uploads here; in production see DEPLOY.md.
  app.use(
    "/uploads",
    express.static(path.resolve(process.cwd(), env.upload.dir), {
      fallthrough: true,
      maxAge: "7d",
    }),
  );

  app.use("/api", router);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
