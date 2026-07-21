import { createApp } from "./app.js";
import { env, razorpayConfigured } from "./config/env.js";
import { assertDbConnection, pool } from "./db/pool.js";

async function main(): Promise<void> {
  try {
    await assertDbConnection();
    console.log("[db] connected.");
  } catch (err) {
    console.error("[db] connection failed — check DB_* env vars:", (err as Error).message);
    process.exit(1);
  }

  if (!razorpayConfigured) {
    console.warn("[razorpay] not configured — payment endpoints will return errors until keys are set.");
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[start] Tanesha Baxi API listening on :${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[stop] ${signal} received, shutting down...`);
    server.close(async () => {
      await pool.end().catch(() => undefined);
      process.exit(0);
    });
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void main();
