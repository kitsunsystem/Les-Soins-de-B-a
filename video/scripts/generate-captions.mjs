// Génère les sous-titres WebVTT de la vidéo à partir du texte annoté de la voix off (voix-off-reperes.txt, le même
// texte que voix-off.md) et des instants mesurés (src/voix-off.json, produit par scripts/caler-voix.py).
// Usage : npm run captions
//
// Chaque réplique commence quand la voix en dit le premier mot : on interpole entre les repères mesurés (début et
// fin de paragraphe, mots repères), ce qui reste juste même quand le débit change dans un paragraphe.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const out = process.argv[2] ?? "../public/videos/les-soins-de-bea.fr.vtt";

const { duree, paragraphes, reperes } = JSON.parse(readFileSync("src/voix-off.json", "utf8"));
const reglages = readFileSync("src/voix-off.ts", "utf8");
const offset = Number(reglages.match(/DEBUT_VOIX\s*=\s*([\d.]+)/)[1]);
// Le plan final reste à l'écran après la dernière phrase : la dernière réplique aussi.
const finVideo = offset + duree + Number(reglages.match(/TENUE_FINALE\s*=\s*([\d.]+)/)[1]);

// Texte annoté : « identifiant | texte », [balises] d'expression, {repère} devant les mots.
const lignes = readFileSync("voix-off-reperes.txt", "utf8")
  .split("\n")
  .filter((l) => l.trim() && !l.startsWith("#"));

// Contrôle : le texte annoté doit rester celui de voix-off.md (le texte réellement envoyé à ElevenLabs).
const md = readFileSync("voix-off.md", "utf8");
const bloc = md.slice(md.indexOf("```") + 3, md.lastIndexOf("```"));
const nettoie = (t) => t.replace(/\[[^\]]*\]/g, " ").replace(/\{[^}]*\}/g, "").replace(/\s+/g, " ").trim();
const textesMd = bloc.split("\n").map(nettoie).filter(Boolean);
const textesAnnotes = lignes.map((l) => nettoie(l.split(" | ")[1]));
if (textesMd.join("\n") !== textesAnnotes.join("\n")) {
  throw new Error("voix-off-reperes.txt ne correspond plus au texte de voix-off.md : reportez la modification.");
}

// La fin est prononcée « en toutes lettres » pour la voix : on affiche l'écriture habituelle.
const ECRITURES = [
  [/les soins de béa point f r/i, "lessoinsdebea.fr"],
  [/zéro sept, soixante-deux, quatre-vingt-quatorze, soixante-dix-neuf, trente-neuf/i, "07 62 94 79 39"],
  [/vingt-quatre heures sur vingt-quatre/i, "24 h/24"],
];
const display = (t) => ECRITURES.reduce((acc, [re, ecrit]) => acc.replace(re, ecrit), t);
/** Passages à ne jamais couper entre deux répliques (adresse du site, numéro…). */
const insecables = (texte) =>
  ECRITURES.flatMap(([re]) => {
    const m = texte.match(re);
    return m ? [[m.index, m.index + m[0].length]] : [];
  });

const stamp = (s) => {
  const ms = Math.round(s * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const sec = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${sec}.${String(ms % 1000).padStart(3, "0")}`;
};

/** Texte prononcé d'un paragraphe et ses ancres [position dans le texte, instant dans la voix]. */
function lire(ligne) {
  const [id, brut] = ligne.split(" | ");
  const [debut, fin] = paragraphes[id];
  const noms = [];
  const marque = brut
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\{([^}]+)\}/g, (_, nom) => {
      noms.push(nom);
      return "\u0001";
    })
    .replace(/\s+/g, " ")
    .trim();
  let texte = "";
  const ancres = [[0, debut]];
  for (const c of marque) {
    if (c === "\u0001") {
      const t = reperes[noms[ancres.length - 1]];
      if (t === undefined) throw new Error(`Repère « ${noms[ancres.length - 1]} » absent de src/voix-off.json`);
      ancres.push([texte.length, t]);
    } else texte += c;
  }
  ancres.push([texte.length, fin]);
  // Un repère au tout début du texte (premier mot) remplace le début du paragraphe (qui peut inclure un soupir).
  const uniques = ancres.filter((a, k) => !(ancres[k + 1] && ancres[k + 1][0] === a[0] && k + 1 < ancres.length - 1));
  return { texte, ancres: uniques, fin };
}

/** Instant (voix) où commence le caractère `i`, par interpolation entre les ancres qui l'encadrent. */
function instant(ancres, i) {
  for (let k = 0; k < ancres.length - 1; k++) {
    const [a, ta] = ancres[k];
    const [b, tb] = ancres[k + 1];
    if (i >= a && i <= b) return b === a ? ta : ta + ((tb - ta) * (i - a)) / (b - a);
  }
  return ancres.at(-1)[1];
}

/** Découpe en phrases, puis coupe les phrases trop longues sur la virgule ou les deux-points les plus centraux. */
function decoupe(texte) {
  const phrases = [];
  const re = /(?<=[.?!…](?:\s*»)?)\s+(?=[«A-ZÀ-ÖØ-Þ])/g;
  let debut = 0;
  for (const m of texte.matchAll(re)) {
    phrases.push([debut, m.index]);
    debut = m.index + m[0].length;
  }
  phrases.push([debut, texte.length]);
  // Regroupe les phrases très courtes avec la précédente.
  const groupes = [];
  for (const p of phrases) {
    const dernier = groupes.at(-1);
    const long = p[1] - p[0];
    if (dernier && (dernier[1] - dernier[0] + long < 70 || long < 18)) dernier[1] = p[1];
    else groupes.push([...p]);
  }
  // Au-delà de 90 caractères affichés (plus de deux lignes à l'écran), coupe à la ponctuation la plus proche du
  // milieu, jamais à l'intérieur d'un passage insécable.
  const proteges = insecables(texte);
  const coupe = ([a, b]) => {
    if (display(texte.slice(a, b)).length <= 90) return [[a, b]];
    const milieu = (a + b) / 2;
    let meilleur = null;
    for (const m of texte.slice(a, b).matchAll(/[,:;]\s+(?!»)/g)) {
      const pos = a + m.index + m[0].length;
      if (pos - a < 25 || b - pos < 25 || proteges.some(([x, y]) => pos > x && pos < y)) continue;
      if (meilleur === null || Math.abs(pos - milieu) < Math.abs(meilleur - milieu)) meilleur = pos;
    }
    return meilleur === null ? [[a, b]] : [...coupe([a, meilleur]), ...coupe([meilleur, b])];
  };
  return groupes.flatMap(coupe);
}

const repliques = [];
for (const ligne of lignes) {
  const { texte, ancres, fin } = lire(ligne);
  const morceaux = decoupe(texte);
  morceaux.forEach(([a, b], i) => {
    const debut = instant(ancres, a);
    const finMorceau = i + 1 < morceaux.length ? instant(ancres, morceaux[i + 1][0]) : fin;
    const phrase = display(texte.slice(a, b).trim().replace(/,$/, ""));
    repliques.push([debut + offset, finMorceau + offset, phrase]);
  });
}
// Chaque réplique reste au moins 1,2 s (dans la limite de la suivante) ; la dernière, jusqu'à la fin de la vidéo.
repliques.forEach((r, i) => {
  const suivante = repliques[i + 1]?.[0] ?? finVideo;
  r[1] = i === repliques.length - 1 ? finVideo : Math.min(suivante, Math.max(r[1], r[0] + 1.2));
});

let vtt = "WEBVTT\n\n";
let n = 1;
for (const [debut, fin, phrase] of repliques) vtt += `${n++}\n${stamp(debut)} --> ${stamp(fin)}\n${phrase}\n\n`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, vtt);
console.log(`[sous-titres] ${n - 1} répliques → ${out}`);
