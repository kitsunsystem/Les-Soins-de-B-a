import { defineConfig } from "drizzle-kit";

// Génère les migrations SQL (dossier ./drizzle) pour Cloudflare D1 (SQLite).
// Après `npm run db:generate`, elles sont appliquées automatiquement par le site au démarrage.
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
});
