import "server-only";
import path from "node:path";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type DB = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __beaDb?: Promise<DB> };

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const client = postgres(url, { max: 5, prepare: false, idle_timeout: 20 });
    return drizzle(client, { schema });
  }

  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL manquant : configurez une base PostgreSQL (voir README).");
  }

  // Développement local : PostgreSQL embarqué (PGlite), aucune installation requise.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  const client = new PGlite(dir);
  const db = drizzlePglite(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db as unknown as DB;
}

export function getDb(): Promise<DB> {
  if (!globalForDb.__beaDb) {
    globalForDb.__beaDb = connect().catch((e) => {
      globalForDb.__beaDb = undefined;
      throw e;
    });
  }
  return globalForDb.__beaDb;
}

export { schema };
