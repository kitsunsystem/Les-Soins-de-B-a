// Taille de chaque vidéo de public/videos, lue par worker.ts pour répondre aux requêtes partielles (« Range »)
// — les fichiers statiques de Cloudflare ne transmettent pas leur taille au Worker. Lancé à chaque build.
import { readdirSync, statSync, writeFileSync } from "node:fs";

const dir = "public/videos";
const sizes = {};
for (const f of readdirSync(dir).sort()) {
  if (/\.(mp4|webm|mov)$/i.test(f)) sizes[`/videos/${f}`] = statSync(`${dir}/${f}`).size;
}
writeFileSync("video-sizes.json", `${JSON.stringify(sizes, null, 2)}\n`);
console.log(`[vidéos] ${Object.keys(sizes).length} fichier(s) recensé(s) dans video-sizes.json`);
