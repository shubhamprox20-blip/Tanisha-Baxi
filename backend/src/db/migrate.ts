import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { env } from "../config/env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "migrations");

/**
 * Minimal forward-only migration runner. Applies every `*.sql` file in
 * db/migrations (sorted by name) that has not been recorded in
 * `schema_migrations`. Safe to run repeatedly.
 */
async function run(): Promise<void> {
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    multipleStatements: true,
  });

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [appliedRows] = await conn.query<mysql.RowDataPacket[]>(
      "SELECT name FROM schema_migrations",
    );
    const applied = new Set(appliedRows.map((r) => r.name as string));

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
      console.log(`[migrate] applying ${file}...`);
      await conn.beginTransaction();
      try {
        await conn.query(sql);
        await conn.query("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
        await conn.commit();
        count += 1;
      } catch (err) {
        await conn.rollback();
        throw err;
      }
    }

    console.log(
      count === 0 ? "[migrate] already up to date." : `[migrate] applied ${count} migration(s).`,
    );
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
