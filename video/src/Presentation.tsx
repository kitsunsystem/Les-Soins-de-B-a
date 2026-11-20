import type { ReactNode } from "react";
import { AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile } from "remotion";
import { Accueil } from "./scenes/Accueil";
import { Beatrice } from "./scenes/Beatrice";
import { Cabinet } from "./scenes/Cabinet";
import { Cadeau } from "./scenes/Cadeau";
import { Final } from "./scenes/Final";
import { Formations } from "./scenes/Formations";
import { Ouverture } from "./scenes/Ouverture";
import { Reservation } from "./scenes/Reservation";
import { Soins } from "./scenes/Soins";
import { Temoignages } from "./scenes/Temoignages";
import { Univers } from "./scenes/Univers";
import { colors, FPS } from "./theme";
import { clamp, Fondu } from "./ui";
import { coupeApres, coupeAvant, DEBUT_VOIX, DUREE_VIDEO, DUREE_VOIX, FICHIER_VOIX, paragraphes, reperes, t, type NomRepere } from "./voix-off";

/** Secondes → images. */
const f = (secondes: number) => Math.round(secondes * FPS);
/** Repère de la voix → image de la scène qui commence à l'image `debut`. */
const r = (nom: NomRepere, debut = 0) => f(t(reperes[nom])) - debut;

type Scene = {
  id: string;
  /** Début et fin de la scène, en secondes de vidéo. */
  de: number;
  a: number;
  /** `debut` : image de début de la scène dans la vidéo, pour convertir les repères de la voix. */
  rendu: (duree: number, debut: number) => ReactNode;
};

// Chaque scène commence et finit au milieu des silences de la voix off (voir src/voix-off.ts).
const scenes: Scene[] = [
  {
    id: "ouverture",
    de: 0,
    a: coupeApres("marque"),
    rendu: (d) => (
      <Ouverture
        duration={d}
        stress={r("stress")}
        tensions={r("tensions")}
        fatigue={r("fatigue")}
        question={r("question")}
        moment={r("moment")}
        marque={f(t(paragraphes.marque[0]))}
      />
    ),
  },
  { id: "accueil", de: coupeAvant("accueil"), a: coupeApres("accueil"), rendu: (d) => <Accueil duration={d} /> },
  { id: "beatrice", de: coupeAvant("beatrice"), a: coupeApres("beatrice"), rendu: (d) => <Beatrice duration={d} /> },
  { id: "univers", de: coupeAvant("univers"), a: coupeApres("univers"), rendu: (d) => <Univers duration={d} /> },
  {
    id: "soins",
    de: coupeAvant("corps"),
    a: coupeApres("guidance"),
    rendu: (d, debut) => (
      <Soins
        duration={d}
        changements={[f(coupeAvant("energetique")) - debut, f(coupeAvant("femmes-bebes")) - debut, f(coupeAvant("guidance")) - debut]}
        reperes={Object.fromEntries(Object.entries(reperes).map(([nom, s]) => [nom, f(t(s)) - debut]))}
      />
    ),
  },
  {
    id: "formations",
    de: coupeAvant("formations"),
    a: coupeApres("formations"),
    rendu: (d, debut) => (
      <Formations duration={d} reperes={[r("formationMagnetisme", debut), r("flammeViolette", debut)]} />
    ),
  },
  {
    id: "cabinet",
    de: coupeAvant("cabinet"),
    a: coupeApres("cabinet"),
    rendu: (d, debut) => <Cabinet duration={d} photos={[r("table", debut), r("coin", debut), r("lumiere", debut)]} />,
  },
  {
    id: "temoignages",
    de: coupeAvant("temoignages"),
    a: coupeApres("temoignages"),
    rendu: (d, debut) => (
      <Temoignages
        duration={d}
        lectures={[
          { auteur: "Léa", fragments: [r("citationLea", debut), r("evasion", debut), r("liberte", debut)], signature: r("ecritLea", debut) },
          { auteur: "Val", fragments: [r("citationVal", debut), r("feeVal", debut)], signature: r("ajouteVal", debut) },
          {
            auteur: "Sarah",
            fragments: [r("citationSarah", debut), r("mainsSarah", debut), r("coeurSarah", debut)],
            signature: r("confieSarah", debut),
          },
        ]}
      />
    ),
  },
  {
    id: "reservation",
    de: coupeAvant("reservation"),
    a: coupeApres("reservation"),
    rendu: (d, debut) => <Reservation duration={d} confirmation={r("confirmation", debut)} />,
  },
  { id: "cadeau", de: coupeAvant("cadeau"), a: coupeApres("cadeau"), rendu: (d) => <Cadeau duration={d} /> },
  {
    id: "final",
    de: coupeAvant("final"),
    a: DUREE_VIDEO,
    rendu: (d, debut) => (
      <Final
        duration={d}
        site={r("site", debut)}
        telephone={r("telephone", debut)}
        paires={(["p0", "p1", "p2", "p3", "p4"] as const).map((p) => r(p, debut))}
        prenezSoin={r("prenezSoin", debut)}
      />
    ),
  },
];

export const DUREE_TOTALE = f(DUREE_VIDEO);

/**
 * Niveaux du mixage. Le son est mixé par ffmpeg au rendu (Html5Audio) : la voix, mono et normalisée à −16 LUFS,
 * est répartie sur les deux canaux à −3 dB. On la remonte de 1 dB (environ −15,7 LUFS, crêtes vers −4 dBFS) et la
 * musique reste environ 14,5 LU dessous.
 */
const VOLUME_VOIX = 1.12;
const MUSIQUE_SOUS_VOIX = 0.175;
const MUSIQUE_SEULE = 0.355;

/** Musique d'ambiance : discrète sous la voix, un peu plus présente une fois la voix terminée. */
function volumeMusique(image: number) {
  const s = image / FPS;
  const finVoix = t(DUREE_VOIX);
  const remontee = finVoix + 0.6;
  const fondu = Math.max(remontee + 0.1, DUREE_VIDEO - 1.2);
  return interpolate(
    s,
    [0, 0.5, finVoix - 0.1, remontee, fondu, Math.max(fondu + 0.1, DUREE_VIDEO)],
    [0, MUSIQUE_SOUS_VOIX, MUSIQUE_SOUS_VOIX, MUSIQUE_SEULE, MUSIQUE_SEULE, 0],
    clamp,
  );
}

export const Presentation: React.FC<{ audio: boolean }> = ({ audio }) => {
  return (
    <AbsoluteFill style={{ background: colors.linen }}>
      {scenes.map((s, i) => {
        const debut = f(s.de);
        const duree = f(s.a) - debut;
        return (
          <Sequence key={s.id} from={debut} durationInFrames={duree} name={s.id}>
            {/* La scène des univers a sa propre poussée, panneau par panneau ; le plan final garde son cadre fixe. */}
            <Fondu duration={duree} entree={i > 0} sortie={i < scenes.length - 1} poussee={s.id !== "soins" && s.id !== "final"}>
              {s.rendu(duree, debut)}
            </Fondu>
          </Sequence>
        );
      })}
      {audio && (
        <>
          <Sequence from={f(DEBUT_VOIX)} name="voix off">
            <Html5Audio src={staticFile(FICHIER_VOIX)} volume={VOLUME_VOIX} />
          </Sequence>
          <Html5Audio src={staticFile("musique.mp3")} volume={volumeMusique} />
        </>
      )}
    </AbsoluteFill>
  );
};
