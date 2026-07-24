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

app.use((helmet as any)()); 
    app.use(
    cors({
      // allow requests from any origin
      origin: true,
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

  app.use("/api", router);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
