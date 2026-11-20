import type { ReactNode } from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile } from "remotion";
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
import { coupeApres, coupeAvant, DEBUT_VOIX, DUREE_VIDEO, DUREE_VOIX, FICHIER_VOIX, paragraphes, reperes, t } from "./voix-off";

/** Secondes → images. */
const f = (secondes: number) => Math.round(secondes * FPS);

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
      <Ouverture duration={d} stress={f(t(reperes.stress))} question={f(t(reperes.question))} marque={f(t(paragraphes.marque[0]))} />
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
      />
    ),
  },
  { id: "formations", de: coupeAvant("formations"), a: coupeApres("formations"), rendu: (d) => <Formations duration={d} /> },
  { id: "cabinet", de: coupeAvant("cabinet"), a: coupeApres("cabinet"), rendu: (d) => <Cabinet duration={d} /> },
  {
    id: "temoignages",
    de: coupeAvant("temoignages"),
    a: coupeApres("temoignages"),
    rendu: (d, debut) => <Temoignages duration={d} citation={f(t(reperes.citationLea)) - debut} auteur="Léa" />,
  },
  {
    id: "reservation",
    de: coupeAvant("reservation"),
    a: coupeApres("reservation"),
    rendu: (d, debut) => <Reservation duration={d} confirmation={f(t(reperes.confirmation)) - debut} />,
  },
  { id: "cadeau", de: coupeAvant("cadeau"), a: coupeApres("cadeau"), rendu: (d) => <Cadeau duration={d} /> },
  {
    id: "final",
    de: coupeAvant("final"),
    a: DUREE_VIDEO,
    rendu: (d, debut) => <Final duration={d} site={f(t(reperes.site)) - debut} telephone={f(t(reperes.telephone)) - debut} />,
  },
];

export const DUREE_TOTALE = f(DUREE_VIDEO);

/** Musique d'ambiance : discrète sous la voix, un peu plus présente une fois la voix terminée. */
function volumeMusique(image: number) {
  const s = image / FPS;
  const finVoix = t(DUREE_VOIX);
  const remontee = finVoix + 0.6;
  const fondu = Math.max(remontee + 0.1, DUREE_VIDEO - 1.2);
  return interpolate(s, [0, 0.5, finVoix - 0.1, remontee, fondu, Math.max(fondu + 0.1, DUREE_VIDEO)], [0, 0.22, 0.22, 0.45, 0.45, 0], clamp);
}

export const Presentation: React.FC<{ audio: boolean }> = ({ audio }) => {
  return (
    <AbsoluteFill style={{ background: colors.linen }}>
      {scenes.map((s, i) => {
        const debut = f(s.de);
        const duree = f(s.a) - debut;
        return (
          <Sequence key={s.id} from={debut} durationInFrames={duree} name={s.id}>
            <Fondu duration={duree} entree={i > 0} sortie={i < scenes.length - 1}>
              {s.rendu(duree, debut)}
            </Fondu>
          </Sequence>
        );
      })}
      {audio && (
        <>
          <Sequence from={f(DEBUT_VOIX)} name="voix off">
            <Audio src={staticFile(FICHIER_VOIX)} />
          </Sequence>
          <Audio src={staticFile("musique.mp3")} volume={volumeMusique} />
        </>
      )}
    </AbsoluteFill>
  );
};
