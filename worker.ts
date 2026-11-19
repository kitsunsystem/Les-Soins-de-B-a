// Point d'entrée du Worker Cloudflare : le site Next.js (généré par OpenNext dans .open-next/)
// + une tâche planifiée quotidienne qui déclenche l'envoi des rappels de rendez-vous.
// @ts-expect-error — fichier généré par `opennextjs-cloudflare build`
import { default as handler } from "./.open-next/worker.js";

type Env = { SITE_URL?: string; CRON_SECRET?: string };

const worker = {
  fetch: handler.fetch,

  async scheduled(_controller: unknown, env: Env, ctx: unknown) {
    if (!env.CRON_SECRET) {
      console.warn("[rappels] CRON_SECRET non défini : rappels désactivés.");
      return;
    }
    const base = (env.SITE_URL ?? "https://localhost").replace(/\/$/, "");
    const request = new Request(`${base}/api/cron/rappels`, {
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    });
    const response: Response = await handler.fetch(request, env, ctx);
    console.log(`[rappels] ${response.status} ${await response.text()}`);
  },
};

export default worker;
