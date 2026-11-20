// Voix off ElevenLabs (texte et réglages : ../voix-off.md).
// Les instants viennent de voix-off.json, produit par scripts/caler-voix.py à partir de public/voix-off.mp3 et du
// texte annoté ../voix-off-reperes.txt : après une nouvelle voix, relancer le script, la vidéo se recale toute seule.
import donnees from "./voix-off.json";

export const FICHIER_VOIX = "voix-off.mp3";

/** La voix démarre un peu après la première image. */
export const DEBUT_VOIX = 0.3;
/** Durée du fichier de voix (s). */
export const DUREE_VOIX: number = donnees.duree;
/** Le plan final reste à l'écran après la dernière phrase. */
export const TENUE_FINALE = 2.2;

const ORDRE = [
  "accroche",
  "marque",
  "accueil",
  "beatrice",
  "univers",
  "corps",
  "energetique",
  "femmes-bebes",
  "guidance",
  "formations",
  "cabinet",
  "temoignages",
  "reservation",
  "cadeau",
  "final",
] as const;
export type IdParagraphe = (typeof ORDRE)[number];

/** Repères utilisés par les scènes (noms entre accolades dans voix-off-reperes.txt). */
const NOMS_REPERES = [
  "stress",
  "tensions",
  "fatigue",
  "question",
  "moment",
  "reflexologie",
  "massages",
  "massage-relaxant",
  "massage-californien",
  "massage-ayurvedique",
  "massage-energetique",
  "soin-complet",
  "magnetiseuse",
  "feu",
  "magnetisme-distance",
  "photo",
  "massage-prenatal",
  "atelier-massage-bebe",
  "oracle-tarot",
  "amour",
  "travail",
  "choix-de-vie",
  "mediumnite",
  "deuil",
  "seances",
  "seanceCabinet",
  "seanceDistance",
  "seanceTelephone",
  "seanceVisio",
  "seancePartout",
  "formationMagnetisme",
  "flammeViolette",
  "table",
  "coin",
  "lumiere",
  "citationLea",
  "evasion",
  "liberte",
  "ecritLea",
  "citationVal",
  "feeVal",
  "ajouteVal",
  "citationSarah",
  "mainsSarah",
  "coeurSarah",
  "confieSarah",
  "confirmation",
  "site",
  "telephone",
  "p0",
  "p1",
  "p2",
  "p3",
  "p4",
  "prenezSoin",
] as const;
export type NomRepere = (typeof NOMS_REPERES)[number];

const sourceParagraphes: Record<string, number[]> = donnees.paragraphes;
const sourceReperes: Record<string, number> = donnees.reperes;
for (const id of ORDRE) {
  if (sourceParagraphes[id]?.length !== 2) throw new Error(`Paragraphe « ${id} » absent de voix-off.json : relancer scripts/caler-voix.py.`);
}
for (const nom of NOMS_REPERES) {
  if (typeof sourceReperes[nom] !== "number") throw new Error(`Repère « ${nom} » absent de voix-off.json : relancer scripts/caler-voix.py.`);
}

/** Début et fin de chaque paragraphe dans le fichier de voix (secondes). */
export const paragraphes = sourceParagraphes as Record<IdParagraphe, [number, number]>;
/** Mots-clés à l'intérieur des paragraphes, pour synchroniser l'image (secondes dans le fichier de voix). */
export const reperes = sourceReperes as Record<NomRepere, number>;

/** Seconde de la vidéo correspondant à une seconde du fichier de voix. */
export const t = (secondesVoix: number) => DEBUT_VOIX + secondesVoix;

/**
 * Prolongation (s) de certaines scènes au-delà du milieu du silence qui suit : la voix enchaîne déjà sur la scène
 * suivante pendant qu'on lit encore la fin de celle-ci (les citations, la dernière photo du cabinet).
 */
const PROLONGATIONS: Partial<Record<IdParagraphe, number>> = { cabinet: 0.5, temoignages: 1.0 };

/** Coupe entre un paragraphe et le suivant : au milieu du silence qui les sépare (secondes vidéo). */
export function coupeApres(id: IdParagraphe) {
  const i = ORDRE.indexOf(id);
  const suivant = ORDRE[i + 1];
  if (!suivant) return t(DUREE_VOIX) + TENUE_FINALE;
  return t((paragraphes[id][1] + paragraphes[suivant][0]) / 2) + (PROLONGATIONS[id] ?? 0);
}

/** Coupe juste avant un paragraphe (= coupe après le précédent). */
export function coupeAvant(id: IdParagraphe) {
  const i = ORDRE.indexOf(id);
  return i === 0 ? 0 : coupeApres(ORDRE[i - 1]);
}

export const DUREE_VIDEO = t(DUREE_VOIX) + TENUE_FINALE;
