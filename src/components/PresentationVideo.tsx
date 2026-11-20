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
          <span className="absolute inset-0 bg-gradient-to-t from-forest-dark/70 via-forest-dark/5 to-transparent" aria-hidden />
          <span
            className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-linen/95 text-forest shadow-soft transition-transform duration-300 group-hover:scale-110 md:size-24"
            aria-hidden
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-linen/40 [animation-duration:2.4s]" />
            <Play className="relative ml-1 size-8 md:size-9" fill="currentColor" />
          </span>
          <span className="absolute bottom-5 left-6 right-6 text-linen md:bottom-7 md:left-8" aria-hidden>
            <span className="block text-[0.7rem] font-bold uppercase tracking-[0.18em] text-gold">
              Vidéo · {duration} · sous-titrée
            </span>
            <span className="mt-1 block font-serif text-xl md:text-2xl">{title}</span>
          </span>
        </button>
      )}
    </div>
  );
}
