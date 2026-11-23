// Voix off ElevenLabs (texte et réglages : ../voix-off.md).
// Les instants viennent de voix-off.json, produit par scripts/caler-voix.py à partir de public/voix-off.mp3 et du
// texte annoté ../voix-off-reperes.txt : après une nouvelle voix, relancer le script, la vidéo se recale toute seule.
// Les réglages du montage (début de la voix, tenue du plan final, silences insérés) sont dans montage.json.
import montage from "./montage.json";
import { FPS } from "./theme";
import donnees from "./voix-off.json";

export const FICHIER_VOIX = "voix-off.mp3";

/** La voix démarre un peu après la première image. */
export const DEBUT_VOIX: number = montage.debutVoix;
/** Durée du fichier de voix (s). */
export const DUREE_VOIX: number = donnees.duree;
/** Le plan final reste à l'écran après la dernière phrase. */
export const TENUE_FINALE: number = montage.tenueFinale;

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
  "guidance-complete",
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

/**
 * Silences insérés dans la voix, après certains paragraphes (montage.json) : la vidéo y montre des images sans voix
 * (les certificats de Béatrice). Le point de coupe est au milieu du blanc qui suit le paragraphe, calé sur une image.
 */
export const silences = Object.entries(montage.silences as Record<string, number>)
  .map(([id, duree]) => {
    const i = ORDRE.indexOf(id as IdParagraphe);
    if (i < 0 || i === ORDRE.length - 1) throw new Error(`montage.json : silence après « ${id} », qui n'est pas un paragraphe suivi d'un autre.`);
    const suivant = ORDRE[i + 1];
    const point = Math.round(((paragraphes[id as IdParagraphe][1] + paragraphes[suivant][0]) / 2) * FPS) / FPS;
    return { id: id as IdParagraphe, point, duree: Math.round(duree * FPS) / FPS };
  })
  .sort((a, b) => a.point - b.point);

/** Seconde de la vidéo correspondant à une seconde du fichier de voix (les silences insérés décalent la suite). */
export const t = (secondesVoix: number) =>
  DEBUT_VOIX + secondesVoix + silences.reduce((decalage, s) => decalage + (secondesVoix >= s.point ? s.duree : 0), 0);

/** Début et fin (secondes vidéo) du silence inséré après un paragraphe, ou `undefined` s'il n'y en a pas. */
export function silenceApres(id: IdParagraphe) {
  const s = silences.find((x) => x.id === id);
  return s && { de: t(s.point) - s.duree, a: t(s.point) };
}

/**
 * Prolongation (s) de certaines scènes au-delà du milieu du silence qui suit : la voix enchaîne déjà sur la scène
 * suivante pendant qu'on lit encore la fin de celle-ci (le surlignage « photo », les trois modes de séance allumés
 * ensemble, la dernière photo du cabinet, les citations).
 */
const PROLONGATIONS: Partial<Record<IdParagraphe, number>> = { energetique: 0.15, guidance: 1.0, cabinet: 0.5, temoignages: 1.0 };

/**
 * Coupe entre un paragraphe et le suivant : au milieu du silence qui les sépare (secondes vidéo). Après un silence
 * inséré, c'est la fin de ce silence : la scène suivante commence quand la voix reprend.
 */
export function coupeApres(id: IdParagraphe) {
  const i = ORDRE.indexOf(id);
  const suivant = ORDRE[i + 1];
  if (!suivant) return t(DUREE_VOIX) + TENUE_FINALE;
  const silence = silenceApres(id);
  if (silence) return silence.a;
  return t((paragraphes[id][1] + paragraphes[suivant][0]) / 2) + (PROLONGATIONS[id] ?? 0);
}

/** Coupe juste avant un paragraphe (= coupe après le précédent). */
export function coupeAvant(id: IdParagraphe) {
  const i = ORDRE.indexOf(id);
  return i === 0 ? 0 : coupeApres(ORDRE[i - 1]);
}

export const DUREE_VIDEO = t(DUREE_VOIX) + TENUE_FINALE;
