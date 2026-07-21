import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function query(sql: string, params?: any[]) {
  const result = await pool.query(sql, params);
  return result.rows;
}

export async function execute(sql: string, params?: any[]) {
  return await pool.query(sql, params);
}

export async function withTransaction(fn: (client: any) => Promise<any>) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function assertDbConnection() {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}