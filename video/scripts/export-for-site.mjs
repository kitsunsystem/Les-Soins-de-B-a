// Prépare la vidéo pour le site : version web compressée (< 25 Mo, limite des fichiers statiques
// Cloudflare), vignette et sous-titres, dans ../public/videos/. Usage : npm run render && npm run site
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";

const source = "out/les-soins-de-bea.mp4";
const dir = "../public/videos";
if (!existsSync(source)) throw new Error(`${source} introuvable : lancez d'abord « npm run render ».`);
mkdirSync(dir, { recursive: true });

// ffmpeg fourni par Remotion (aucune installation supplémentaire).
const ffmpeg = (...args) => execFileSync("npx", ["remotion", "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", ...args], { stdio: "inherit" });

// Vidéo web : H.264 1080p, démarrage rapide (moov en tête), son AAC.
ffmpeg(
  "-i", source,
  "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-pix_fmt", "yuv420p",
  "-profile:v", "high", "-movflags", "+faststart",
  "-c:a", "aac", "-b:a", "128k",
  `${dir}/les-soins-de-bea.mp4`,
);

// Vignette : le plan « Bienvenue aux Soins de Béa » (≈ 9,5 s).
ffmpeg("-ss", "9.5", "-i", source, "-frames:v", "1", "-vf", "scale=1600:-2", "-q:v", "3", `${dir}/les-soins-de-bea-vignette.jpg`);

execFileSync("node", ["scripts/generate-captions.mjs", `${dir}/les-soins-de-bea.fr.vtt`], { stdio: "inherit" });
execFileSync("node", ["scripts/video-sizes.mjs"], { cwd: "..", stdio: "inherit" });

const mo = (f) => (statSync(f).size / 1024 / 1024).toFixed(1);
console.log(`[site] vidéo ${mo(`${dir}/les-soins-de-bea.mp4`)} Mo, vignette ${mo(`${dir}/les-soins-de-bea-vignette.jpg`)} Mo → ${dir}`);
if (statSync(`${dir}/les-soins-de-bea.mp4`).size > 25 * 1024 * 1024) {
  console.warn("[site] ATTENTION : plus de 25 Mo, Cloudflare refusera le fichier. Augmentez le CRF (ex. 26).");
}
