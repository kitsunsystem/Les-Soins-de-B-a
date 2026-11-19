// Applique les migrations SQL (dossier ./drizzle) sur la base PostgreSQL de production.
// Lancé automatiquement avant `next build` ; ignoré si DATABASE_URL n'est pas défini.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] DATABASE_URL absent : migrations ignorées (base locale PGlite en développement).");
  process.exit(0);
}

const client = postgres(url, { max: 1, prepare: false });
try {
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("[migrate] Base de données à jour.");
} finally {
  await client.end();
}
