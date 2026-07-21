import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pkg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "migrations");

async function run(): Promise<void> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const appliedRows = await client.query(
      "SELECT name FROM schema_migrations"
    );

    const applied = new Set(
      appliedRows.rows.map((r) => r.name as string)
    );

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let count = 0;

    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");

      console.log(`[migrate] applying ${file}...`);

      try {
        await client.query("BEGIN");

        await client.query(sql);

        await client.query(
          "INSERT INTO schema_migrations (name) VALUES ($1)",
          [file]
        );

        await client.query("COMMIT");

        count++;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }

    console.log(
      count === 0
        ? "[migrate] already up to date."
        : `[migrate] applied ${count} migration(s).`
    );
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});