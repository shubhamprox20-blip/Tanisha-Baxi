import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool, query, withTransaction } from "./pool.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "migrations");

async function run(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedRows = await query<{ name: string }>("SELECT name FROM schema_migrations");
  const applied = new Set(appliedRows.map((r) => r.name));

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
    console.log(`[migrate] applying ${file}...`);

    // Each migration and its bookkeeping row commit together, so a failure
    // part-way leaves nothing recorded and the file can be retried.
    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    });

    count++;
  }

  console.log(
    count === 0 ? "[migrate] already up to date." : `[migrate] applied ${count} migration(s).`,
  );
}

run()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error("[migrate] failed:", err);
    await pool.end().catch(() => undefined);
    process.exit(1);
  });
