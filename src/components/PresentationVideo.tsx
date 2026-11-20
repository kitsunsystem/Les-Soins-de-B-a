"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";

/**
 * Vidéo de présentation : vignette légère au chargement, la vidéo n'est téléchargée qu'au clic.
 * Sous-titres français activés par défaut (lecture sans le son, accessibilité).
 */
export function PresentationVideo({
  src,
  poster,
  captions,
  title,
  duration,
}: {
  src: string;
  poster: string;
  captions: string;
  title: string;
  duration: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video overflow-hidden rounded-[2rem] bg-forest-dark shadow-soft ring-1 ring-line">
      {playing ? (
        <video className="size-full" controls autoPlay playsInline preload="auto" poster={poster}>
          <source src={src} type="video/mp4" />
          <track kind="captions" src={captions} srcLang="fr" label="Français" default />
          Votre navigateur ne peut pas lire cette vidéo : <a href={src}>la télécharger</a>.
        </video>
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 block size-full text-left"
          aria-label={`Lire la vidéo « ${title} » (${duration}, sous-titrée)`}
        >
          <Image
            src={poster}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 760px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <span
            className="absolute bottom-3 left-3 flex items-center gap-2.5 rounded-full bg-forest py-1.5 pl-1.5 pr-4 text-linen shadow-soft transition-transform duration-300 group-hover:scale-[1.04] sm:bottom-5 sm:left-5 sm:gap-3 sm:py-2 sm:pl-2 sm:pr-5"
            aria-hidden
          >
            <span className="relative grid size-8 place-items-center rounded-full bg-linen text-forest sm:size-11">
              <span className="absolute inset-0 animate-ping rounded-full bg-linen/50 [animation-duration:2.4s]" />
              <Play className="relative ml-0.5 size-4 sm:size-5" fill="currentColor" />
            </span>
            <span className="leading-tight">
              <span className="block text-[0.8rem] font-bold sm:text-base">Voir la vidéo</span>
              <span className="block text-[0.72rem] text-linen/75 max-sm:hidden">{duration} · sous-titrée</span>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
