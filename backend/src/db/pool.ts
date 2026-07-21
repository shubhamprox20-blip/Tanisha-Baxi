import mysql from "mysql2/promise";
import { env } from "../config/env.js";

/**
 * Shared MySQL connection pool. On cPanel the DB host is typically `localhost`
 * and credentials come from the "MySQL Databases" screen.
 */
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  connectionLimit: env.db.connectionLimit,
  waitForConnections: true,
  namedPlaceholders: true,
  // Keep numeric columns as JS numbers; DECIMAL is returned as string by default,
  // which we handle explicitly where used.
});

// mysql2's param typings are narrow; we accept the common JS shapes here.
type Params = any[] | Record<string, unknown>;

/** Typed query helper returning rows as an array of a given shape. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: Params,
): Promise<T[]> {
  const [rows] = await pool.query(sql, params as never);
  return rows as T[];
}

/** Run a mutating statement and return the raw ResultSetHeader (insertId, affectedRows). */
export async function execute(
  sql: string,
  params?: Params,
): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.execute(sql, params as never);
  return result as mysql.ResultSetHeader;
}

/**
 * Run a set of statements inside a single transaction. The callback receives a
 * dedicated connection; commit/rollback is handled automatically.
 */
export async function withTransaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>,
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Verify connectivity at startup; throws if the DB is unreachable. */
export async function assertDbConnection(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}
