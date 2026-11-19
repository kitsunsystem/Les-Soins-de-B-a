import type { D1Database } from "@cloudflare/workers-types";

// Bindings et variables du Worker (voir wrangler.jsonc).
declare global {
  interface CloudflareEnv {
    DB: D1Database;
    SITE_URL?: string;
    CRON_SECRET?: string;
  }
}

export {};
