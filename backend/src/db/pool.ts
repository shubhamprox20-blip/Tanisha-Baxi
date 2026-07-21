import pg from "pg";
import type { PoolClient } from "pg";
import { env } from "../config/env.js";

const { Pool, types } = pg;

// node-postgres returns int8 (BIGINT) and numeric as strings to avoid silent
// precision loss. Every such value here is an aggregate (COUNT/SUM) or an
// amount in paise, all comfortably inside Number.MAX_SAFE_INTEGER, so parse
// them back to numbers — otherwise `COUNT(*)` arrives as "3" and arithmetic
// on it silently concatenates.
types.setTypeParser(20, (v) => Number(v)); // int8
types.setTypeParser(1700, (v) => Number(v)); // numeric

// Managed Postgres (Neon) requires TLS; a local dev Postgres normally has none.
const isLocalDb = /@(localhost|127\.0\.0\.1)/.test(env.databaseUrl);

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: isLocalDb ? undefined : { rejectUnauthorized: env.dbSslRejectUnauthorized },
  max: env.dbPoolMax,
});

pool.on("error", (err) => {
  // An idle client dropped by the provider must not take the process down.
  console.error("[db] idle client error:", err.message);
});

/** Run a SELECT and get the rows back. Params are `$1, $2, …` placeholders. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await pool.query(sql, params as never);
  return result.rows as T[];
}

/**
 * Run a mutating statement. `rowCount` is how many rows were affected, and
 * `rows` carries anything named in a `RETURNING` clause.
 */
export async function execute(
  sql: string,
  params?: unknown[],
): Promise<{ rowCount: number; rows: Record<string, unknown>[] }> {
  const result = await pool.query(sql, params as never);
  return { rowCount: result.rowCount ?? 0, rows: result.rows };
}

/**
 * Run `fn` inside a transaction on a single dedicated client, committing on
 * success and rolling back on any throw.
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export async function assertDbConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}
