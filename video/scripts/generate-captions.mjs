// Génère les sous-titres WebVTT de la vidéo à partir du texte de la voix off (voix-off.md)
// et des repères mesurés (src/voix-off.json, produit par scripts/caler-voix.py). Usage : npm run captions
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const out = process.argv[2] ?? "../public/videos/les-soins-de-bea.fr.vtt";

// Texte : bloc de code de voix-off.md, un paragraphe par ligne non vide, sans les balises [émotion].
const md = readFileSync("voix-off.md", "utf8");
const block = md.slice(md.indexOf("```") + 3, md.lastIndexOf("```"));
const texts = block
  .split("\n")
  .map((l) => l.replace(/\[[^\]]*\]\s*/g, "").replace(/\s+/g, " ").trim())
  .filter(Boolean);

// Repères : DEBUT_VOIX (src/voix-off.ts) et les paragraphes mesurés dans src/voix-off.json, dans l'ordre du texte.
const ts = readFileSync("src/voix-off.ts", "utf8");
const offset = Number(ts.match(/DEBUT_VOIX\s*=\s*([\d.]+)/)[1]);
const times = Object.values(JSON.parse(readFileSync("src/voix-off.json", "utf8")).paragraphes);
if (times.length !== texts.length) {
  throw new Error(`${texts.length} paragraphes de texte mais ${times.length} repères : vérifiez voix-off.md et src/voix-off.json`);
}

// La fin est prononcée « en toutes lettres » pour la voix : on affiche l'écriture habituelle.
const display = (t) =>
  t
    .replace(/les soins de béa point f r/i, "lessoinsdebea.fr")
    .replace(/au zéro sept, soixante-deux, quatre-vingt-quatorze, soixante-dix-neuf, trente-neuf/i, "au 07 62 94 79 39")
    .replace(/vingt-quatre heures sur vingt-quatre/i, "24 h/24");

const stamp = (s) => {
  const ms = Math.round(s * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const sec = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${sec}.${String(ms % 1000).padStart(3, "0")}`;
};

/** Coupe les paragraphes longs en phrases, avec un temps proportionnel au nombre de caractères. */
function split(text, start, end) {
  // Coupure uniquement entre deux phrases (ponctuation finale suivie d'une majuscule ou d'un guillemet).
  const parts = text.split(/(?<=[.?!…](?:\s*»)?)\s+(?=[«A-ZÀ-ÖØ-Þ])/).map((p) => p.trim()).filter(Boolean);
  const merged = [];
  for (const p of parts) {
    const last = merged.at(-1);
    if (last && (last.length + p.length < 70 || p.length < 18)) merged[merged.length - 1] = `${last} ${p}`;
    else merged.push(p);
  }
  const total = merged.reduce((n, p) => n + p.length, 0);
  let t = start;
  return merged.map((p) => {
    const d = ((end - start) * p.length) / total;
    const cue = [t, t + d, p];
    t += d;
    return cue;
  });
}

let vtt = "WEBVTT\n\n";
let n = 1;
texts.forEach((text, i) => {
  const [a, b] = times[i];
  for (const [s, e, line] of split(display(text), a + offset, b + offset)) {
    vtt += `${n++}\n${stamp(s)} --> ${stamp(e)}\n${line}\n\n`;
  }
});

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, vtt);
console.log(`[sous-titres] ${n - 1} répliques → ${out}`);
