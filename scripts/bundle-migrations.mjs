// Copie les migrations SQL de ./drizzle dans un module TypeScript embarqué dans le Worker,
// pour que le site applique lui-même les migrations manquantes sur D1 (aucune commande à lancer).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const files = readdirSync("drizzle")
  .filter((f) => /^\d{4}_.+\.sql$/.test(f))
  .sort();

const migrations = files.map((name) => ({
  name,
  statements: readFileSync(`drizzle/${name}`, "utf8")
    .split("--> statement-breakpoint")
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((s) => s.length > 0),
}));

writeFileSync(
  "src/lib/db/migrations.generated.ts",
  `// Fichier généré par scripts/bundle-migrations.mjs — ne pas modifier à la main.\n` +
    `export const migrations: { name: string; statements: string[] }[] = ${JSON.stringify(migrations, null, 2)};\n`,
);
console.log(`[migrations] ${migrations.length} migration(s) embarquée(s).`);
