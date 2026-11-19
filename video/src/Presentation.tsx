import { Fragment, type ReactNode } from "react";
import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { Beatrice } from "./scenes/Beatrice";
import { Cabinet } from "./scenes/Cabinet";
import { Cadeau } from "./scenes/Cadeau";
import { Categorie } from "./scenes/Categorie";
import { Final } from "./scenes/Final";
import { Formations } from "./scenes/Formations";
import { Ouverture } from "./scenes/Ouverture";
import { Pourquoi } from "./scenes/Pourquoi";
import { Reservation } from "./scenes/Reservation";
import { Temoignages } from "./scenes/Temoignages";
import { Univers } from "./scenes/Univers";
import { colors, EASE_IN_OUT, TRANSITION } from "./theme";
import { fonduCreme } from "./transition";

type Scene = { id: string; duree: number; rendu: (duree: number) => ReactNode };

// Déroulé de la vidéo (durées en images, 30 images = 1 seconde ; chaque fondu dure TRANSITION images).
export const scenes: Scene[] = [
  { id: "ouverture", duree: 261, rendu: (d) => <Ouverture duration={d} /> },
  { id: "beatrice", duree: 186, rendu: (d) => <Beatrice duration={d} /> },
  { id: "univers", duree: 156, rendu: (d) => <Univers duration={d} /> },
  { id: "corps", duree: 186, rendu: (d) => <Categorie id="corps" fond="creme" duration={d} /> },
  { id: "energetique", duree: 156, rendu: (d) => <Categorie id="energetique" fond="sable" duration={d} /> },
  { id: "femmes-bebes", duree: 136, rendu: (d) => <Categorie id="femmes-bebes" fond="creme" duration={d} /> },
  { id: "guidance", duree: 146, rendu: (d) => <Categorie id="guidance" fond="sable" duration={d} /> },
  { id: "formations", duree: 126, rendu: (d) => <Formations duration={d} /> },
  { id: "pourquoi", duree: 156, rendu: (d) => <Pourquoi duration={d} /> },
  { id: "cabinet", duree: 121, rendu: (d) => <Cabinet duration={d} /> },
  { id: "temoignages", duree: 186, rendu: (d) => <Temoignages duration={d} /> },
  { id: "reservation", duree: 201, rendu: (d) => <Reservation duration={d} /> },
  { id: "cadeau", duree: 116, rendu: (d) => <Cadeau duration={d} /> },
  { id: "final", duree: 200, rendu: (d) => <Final duration={d} /> },
];

/** Décalage des animations d'une scène par rapport au début de son fondu d'entrée. */
const APPARITION = 8;

export const DUREE_TOTALE = scenes.reduce((total, s) => total + s.duree, 0) - (scenes.length - 1) * TRANSITION;

export const Presentation: React.FC<{ musique: boolean }> = ({ musique }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: colors.cream }}>
      <TransitionSeries>
        {scenes.map((s, i) => (
          <Fragment key={s.id}>
            {i > 0 && (
              <TransitionSeries.Transition
                presentation={fonduCreme()}
                timing={linearTiming({ durationInFrames: TRANSITION, easing: EASE_IN_OUT })}
              />
            )}
            <TransitionSeries.Sequence durationInFrames={s.duree} name={s.id}>
              {i === 0 ? (
                s.rendu(s.duree)
              ) : (
                // Les animations de la scène démarrent quand elle devient visible (milieu du fondu).
                <Sequence from={APPARITION} name={`${s.id} — contenu`}>
                  {s.rendu(s.duree - APPARITION)}
                </Sequence>
              )}
            </TransitionSeries.Sequence>
          </Fragment>
        ))}
      </TransitionSeries>
      {musique && (
        <Audio
          src={staticFile("musique.mp3")}
          volume={(f) =>
            interpolate(f, [0, 20, durationInFrames - 45, durationInFrames - 1], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      )}
    </AbsoluteFill>
  );
};
