// Voix off ElevenLabs (texte et réglages : ../voix-off.md).
// Les repères ci-dessous ont été mesurés sur public/voix-off.mp3 par transcription automatique
// (Whisper) : si vous régénérez la voix, mettez-les à jour, la vidéo se recale toute seule.

export const FICHIER_VOIX = "voix-off.mp3";

/** La voix démarre un peu après la première image. */
export const DEBUT_VOIX = 0.3;
/** Durée du fichier de voix (s). */
export const DUREE_VOIX = 78.13;
/** Le plan final reste à l'écran après la dernière phrase. */
export const TENUE_FINALE = 2.2;

export type IdParagraphe =
  | "accroche"
  | "marque"
  | "accueil"
  | "beatrice"
  | "univers"
  | "corps"
  | "energetique"
  | "femmes-bebes"
  | "guidance"
  | "formations"
  | "cabinet"
  | "temoignages"
  | "reservation"
  | "cadeau"
  | "final";

/** Début et fin de chaque paragraphe dans le fichier de voix (secondes). */
export const paragraphes: Record<IdParagraphe, [number, number]> = {
  accroche: [0.0, 7.5],
  marque: [8.15, 10.6],
  accueil: [11.09, 15.73],
  beatrice: [16.21, 20.78],
  univers: [21.16, 23.49],
  corps: [23.92, 28.83],
  energetique: [29.44, 35.03],
  "femmes-bebes": [35.37, 39.32],
  guidance: [39.68, 43.48],
  formations: [43.87, 48.35],
  cabinet: [48.69, 51.55],
  temoignages: [51.91, 58.49],
  reservation: [58.84, 64.58],
  cadeau: [64.94, 68.11],
  final: [68.47, 78.11],
};

/** Mots-clés à l'intérieur des paragraphes, pour synchroniser l'image (secondes dans le fichier de voix). */
export const reperes = {
  stress: 0.78,
  question: 4.95,
  citationLea: 54.62,
  confirmation: 62.32,
  site: 70.56,
  telephone: 73.26,
} as const;

const ordre = Object.keys(paragraphes) as IdParagraphe[];

/** Seconde de la vidéo correspondant à une seconde du fichier de voix. */
export const t = (secondesVoix: number) => DEBUT_VOIX + secondesVoix;

/** Coupe entre un paragraphe et le suivant : au milieu du silence qui les sépare (secondes vidéo). */
export function coupeApres(id: IdParagraphe) {
  const i = ordre.indexOf(id);
  const suivant = ordre[i + 1];
  if (!suivant) return t(DUREE_VOIX) + TENUE_FINALE;
  return t((paragraphes[id][1] + paragraphes[suivant][0]) / 2);
}

/** Coupe juste avant un paragraphe (= coupe après le précédent). */
export function coupeAvant(id: IdParagraphe) {
  const i = ordre.indexOf(id);
  return i === 0 ? 0 : coupeApres(ordre[i - 1]);
}

export const DUREE_VIDEO = t(DUREE_VOIX) + TENUE_FINALE;
