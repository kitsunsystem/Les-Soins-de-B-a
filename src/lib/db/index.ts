import "server-only";
import type { D1Database } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { migrations } from "./migrations.generated";
import * as schema from "./schema";

export type DB = DrizzleD1Database<typeof schema>;

// Applique les migrations manquantes une fois par instance du Worker.
// Compatible avec la table `d1_migrations` de Wrangler (`wrangler d1 migrations apply`).
let migrated: Promise<void> | null = null;

async function migrate(d1: D1Database) {
  await d1
    .prepare(
      "CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)",
    )
    .run();
  const { results } = await d1.prepare("SELECT name FROM d1_migrations").all<{ name: string }>();
  const applied = new Set(results.map((r) => r.name));
  for (const m of migrations) {
    if (applied.has(m.name)) continue;
    try {
      // Un batch D1 est exécuté dans une transaction : une migration est appliquée entièrement ou pas du tout.
      await d1.batch([
        ...m.statements.map((s) => d1.prepare(s)),
        d1.prepare("INSERT INTO d1_migrations (name) VALUES (?)").bind(m.name),
      ]);
    } catch (e) {
      // Une autre instance a pu appliquer la migration en même temps.
      const again = await d1.prepare("SELECT 1 AS ok FROM d1_migrations WHERE name = ?").bind(m.name).first();
      if (!again) throw e;
    }
  }
}

export async function getDb(): Promise<DB> {
  const { env } = await getCloudflareContext({ async: true });
  const d1 = env.DB;
  if (!d1) throw new Error("Base D1 introuvable : vérifiez le binding « DB » dans wrangler.jsonc.");
  if (!migrated) {
    migrated = migrate(d1).catch((e) => {
      migrated = null;
      throw e;
    });
  }
  await migrated;
  return drizzle(d1, { schema });
}

export { schema };
