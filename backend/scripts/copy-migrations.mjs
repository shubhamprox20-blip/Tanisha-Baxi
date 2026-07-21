// tsc only emits .js, so the .sql migration files never reach dist/.
// Copy them across after every build so `npm run migrate:prod` works on the
// deployed (compiled) app, not just via tsx in development.
import { cp } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

await cp(join(root, "src/db/migrations"), join(root, "dist/db/migrations"), {
  recursive: true,
});

console.log("[build] copied migrations to dist/db/migrations");
