// Point d'entrée du Worker Cloudflare : le site Next.js (généré par OpenNext dans .open-next/),
// la lecture des vidéos par plages d'octets, et une tâche planifiée quotidienne (rappels de rendez-vous).
// @ts-expect-error — fichier généré par `opennextjs-cloudflare build`
import { default as handler } from "./.open-next/worker.js";
// Tailles des vidéos (générées par scripts/video-sizes.mjs à chaque build).
import videoSizes from "./video-sizes.json";

type Assets = { fetch: (request: Request) => Promise<Response> };
type Env = { SITE_URL?: string; CRON_SECRET?: string; ASSETS?: Assets };

/** Ne laisse passer que les octets [start, end[ d'un flux, sans le charger en mémoire. */
function byteSlice(start: number, end: number) {
  let pos = 0;
  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const from = pos;
      pos += chunk.byteLength;
      if (pos <= start) return;
      controller.enqueue(chunk.subarray(Math.max(0, start - from), Math.min(chunk.byteLength, end - from)));
      if (pos >= end) controller.terminate();
    },
  });
}

/**
 * Les fichiers statiques de Cloudflare ignorent l'en-tête « Range » : Safari (iPhone, Mac) refuse alors de lire
 * les vidéos. On sert donc /videos/* en réponses partielles (206), comme un serveur vidéo classique.
 */
async function serveVideo(request: Request, assets: Assets): Promise<Response> {
  const url = new URL(request.url);
  const full = await assets.fetch(new Request(url, { method: "GET" }));
  const size = (videoSizes as Record<string, number>)[url.pathname] ?? Number(full.headers.get("content-length"));
  const headers = new Headers(full.headers);
  headers.set("Accept-Ranges", "bytes");
  if (size && !headers.has("Content-Length")) headers.set("Content-Length", String(size));
  headers.set("Cache-Control", "public, max-age=86400");

  const range = request.headers.get("range");
  const m = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (!full.ok || !full.body || !size || !m || (m[1] === "" && m[2] === "")) {
    return new Response(request.method === "HEAD" ? null : full.body, { status: full.status, headers });
  }

  let start: number;
  let end: number;
  if (m[1] === "") {
    // « bytes=-N » : les N derniers octets
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end) {
    await full.body.cancel();
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}`, "Accept-Ranges": "bytes" } });
  }

  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  if (request.method === "HEAD") {
    await full.body.cancel();
    return new Response(null, { status: 206, headers });
  }
  const sliced = full.body.pipeThrough(byteSlice(start, end + 1));
  // FixedLengthStream (propre aux Workers) fait envoyer un Content-Length exact, attendu par Safari.
  const Fixed = (globalThis as { FixedLengthStream?: new (n: number) => TransformStream }).FixedLengthStream;
  return new Response(Fixed ? sliced.pipeThrough(new Fixed(end - start + 1)) : sliced, { status: 206, headers });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: unknown) {
    const { pathname } = new URL(request.url);
    if (env.ASSETS && pathname.startsWith("/videos/") && (request.method === "GET" || request.method === "HEAD")) {
      return serveVideo(request, env.ASSETS);
    }
    return handler.fetch(request, env, ctx);
  },

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
