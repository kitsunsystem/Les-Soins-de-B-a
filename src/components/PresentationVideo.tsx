"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  CalendarHeart,
  Captions,
  CaptionsOff,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

type FullscreenVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

/**
 * Lecteur vidéo aux couleurs du site.
 * - vignette légère au chargement : la vidéo n'est téléchargée qu'au clic ;
 * - commandes maison (lecture, progression, volume, sous-titres, plein écran), masquées pendant la lecture ;
 * - sous-titres affichés dans la typographie du site ;
 * - écran de fin avec invitation à réserver ;
 * - raccourcis clavier : Espace/K lecture, ←/→ ±5 s, M son, C sous-titres, F plein écran.
 */
export function PresentationVideo({
  src,
  poster,
  captions,
  title,
  duration: durationLabel,
}: {
  src: string;
  poster: string;
  captions: string;
  title: string;
  duration: string;
}) {
  const [started, setStarted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<FullscreenVideo>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointer = useRef<string>("mouse");

  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [cue, setCue] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const v = () => videoRef.current;

  // Valeur courante lue par les écouteurs du plein écran natif (iPhone).
  const captionsOnRef = useRef(captionsOn);
  useEffect(() => {
    captionsOnRef.current = captionsOn;
  }, [captionsOn]);

  /** Affiche les commandes, puis les masque après 2,5 s d'inactivité si la vidéo est en lecture. */
  const poke = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
    }, 2500);
  }, []);

  const togglePlay = useCallback(() => {
    const video = v();
    if (!video) return;
    if (video.paused || video.ended) void video.play();
    else video.pause();
    poke();
  }, [poke]);

  const seekBy = (delta: number) => {
    const video = v();
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, video.currentTime + delta), video.duration || 0);
    poke();
  };

  const toggleMute = () => {
    const video = v();
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 0.6;
    poke();
  };

  const toggleFullscreen = () => {
    const wrap = wrapRef.current;
    const video = v();
    if (!wrap || !video) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (wrap.requestFullscreen) void wrap.requestFullscreen();
    else video.webkitEnterFullscreen?.(); // iPhone : lecteur plein écran natif
    poke();
  };

  // Sous-titres : la piste est chargée en mode « hidden » et rendue par nous, dans le style du site.
  useEffect(() => {
    const video = v();
    if (!started || !video) return;
    const track = video.textTracks[0];
    if (!track) return;
    track.mode = "hidden";
    const onCue = () => {
      const active = track.activeCues?.[0] as VTTCue | undefined;
      setCue(active?.text ?? "");
    };
    track.addEventListener("cuechange", onCue);
    // Plein écran natif de l'iPhone : on y affiche les sous-titres natifs.
    const onNativeFs = () => (track.mode = captionsOnRef.current ? "showing" : "hidden");
    const onNativeFsEnd = () => (track.mode = "hidden");
    video.addEventListener("webkitbeginfullscreen", onNativeFs);
    video.addEventListener("webkitendfullscreen", onNativeFsEnd);
    return () => {
      track.removeEventListener("cuechange", onCue);
      video.removeEventListener("webkitbeginfullscreen", onNativeFs);
      video.removeEventListener("webkitendfullscreen", onNativeFsEnd);
    };
  }, [started]);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("input")) return;
    const k = e.key.toLowerCase();
    if (k === " " || k === "k") togglePlay();
    else if (k === "arrowright") seekBy(5);
    else if (k === "arrowleft") seekBy(-5);
    else if (k === "m") toggleMute();
    else if (k === "c") setCaptionsOn((c) => !c);
    else if (k === "f") toggleFullscreen();
    else return;
    e.preventDefault();
  };

  const pct = duration ? (time / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;
  const effectiveVolume = muted ? 0 : volume;
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2;
  const showUi = controlsVisible || !playing;

  if (!started) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-[2rem] bg-forest-dark shadow-soft ring-1 ring-line">
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="group absolute inset-0 block size-full text-left"
          aria-label={`Lire la vidéo « ${title} » (${durationLabel}, sous-titrée)`}
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
              <span className="block text-[0.72rem] text-linen/75 max-sm:hidden">{durationLabel} · sous-titrée</span>
            </span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      role="region"
      aria-label={`Lecteur vidéo : ${title}`}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onPointerMove={(e) => {
        if (e.pointerType !== "touch") poke();
      }}
      onPointerDown={(e) => {
        lastPointer.current = e.pointerType;
        // Sur écran tactile, un premier toucher affiche les commandes sans mettre en pause.
        if (e.pointerType !== "touch") poke();
      }}
      onFocus={(e) => {
        // Navigation au clavier vers un bouton : on montre les commandes (pas pour un simple toucher du lecteur).
        if (e.target !== e.currentTarget) poke();
      }}
      className={`group/player relative aspect-video overflow-hidden bg-forest-dark shadow-soft ring-1 ring-line ${
        fullscreen ? "rounded-none" : "rounded-[2rem]"
      } ${showUi ? "" : "cursor-none"}`}
    >
      <video
        ref={videoRef}
        className="size-full"
        poster={poster}
        playsInline
        autoPlay
        preload="auto"
        onClick={() => {
          if (lastPointer.current === "touch" && !controlsVisible && playing) poke();
          else togglePlay();
        }}
        onDoubleClick={toggleFullscreen}
        onPlay={() => {
          setPlaying(true);
          setEnded(false);
          poke();
        }}
        onPause={() => {
          setPlaying(false);
          setControlsVisible(true);
        }}
        onEnded={() => {
          setEnded(true);
          setPlaying(false);
          setControlsVisible(true);
          if (document.fullscreenElement) void document.exitFullscreen();
        }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onCanPlay={() => setWaiting(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onProgress={(e) => {
          const b = e.currentTarget.buffered;
          if (b.length) setBuffered(b.end(b.length - 1));
        }}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
      >
        <source src={src} type="video/mp4" />
        <track kind="captions" src={captions} srcLang="fr" label="Français" default />
        Votre navigateur ne peut pas lire cette vidéo : <a href={src}>la télécharger</a>.
      </video>

      {/* Sous-titres dans le style du site */}
      {captionsOn && cue && playing && (
        <div
          className={`pointer-events-none absolute inset-x-0 flex justify-center px-6 transition-[bottom] duration-300 ${
            showUi ? "bottom-[5.5rem] sm:bottom-28" : "bottom-5 sm:bottom-8"
          }`}
          aria-hidden
        >
          <p
            className={`max-w-[90%] rounded-xl bg-forest-dark/85 px-4 py-2 text-center font-semibold leading-snug text-linen shadow-soft backdrop-blur-sm ${
              fullscreen ? "text-2xl" : "text-[0.82rem] sm:text-base"
            }`}
          >
            {cue}
          </p>
        </div>
      )}

      {/* Chargement */}
      {waiting && playing && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
          <span className="grid size-16 place-items-center rounded-full bg-forest-dark/60 backdrop-blur-sm">
            <Loader2 className="size-8 animate-spin text-linen" />
          </span>
        </div>
      )}

      {/* Grand bouton de lecture quand la vidéo est en pause */}
      {!playing && !ended && !waiting && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute left-1/2 top-[36%] grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-forest text-linen shadow-soft ring-4 ring-linen/60 transition-transform hover:scale-110 sm:top-[42%] sm:size-16 md:size-20"
          aria-label="Reprendre la lecture"
        >
          <Play className="ml-0.5 size-5 sm:ml-1 sm:size-7 md:size-8" fill="currentColor" />
        </button>
      )}

      {/* Écran de fin */}
      {ended && (
        <div className="absolute inset-0 grid place-items-center bg-forest-dark/85 p-6 text-center text-linen backdrop-blur-sm">
          <div>
            <p className="eyebrow !text-gold">Les Soins de Béa</p>
            <p className="mt-3 font-serif text-2xl sm:text-4xl">Envie de vous offrir ce moment ?</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/rendez-vous" className="btn btn-accent">
                <CalendarHeart className="size-4" aria-hidden />
                Prendre rendez-vous
              </Link>
              <button type="button" onClick={togglePlay} className="btn border border-linen/30 text-linen hover:bg-linen/10">
                <RotateCcw className="size-4" aria-hidden />
                Revoir la vidéo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barre de commandes */}
      {!ended && (
        <div
          className={`absolute inset-x-2 bottom-2 rounded-2xl bg-forest-dark/80 px-3 pb-1.5 pt-2.5 text-linen shadow-soft ring-1 ring-linen/10 backdrop-blur-md transition-[opacity,transform] duration-300 sm:inset-x-4 sm:bottom-4 sm:px-4 sm:pb-2 sm:pt-3 ${
            showUi ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
          }`}
        >
          {/* Progression */}
          <div className="group/seek relative mb-1 flex h-4 items-center rounded-full has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-linen/20 transition-[height] group-hover/seek:h-2">
              <div className="absolute inset-y-0 left-0 bg-linen/35" style={{ width: `${bufPct}%` }} />
              <div className="absolute inset-y-0 left-0 bg-clay" style={{ width: `${pct}%` }} />
            </div>
            <span
              className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-linen bg-clay shadow transition-transform group-hover/seek:scale-125"
              style={{ left: `${pct}%` }}
              aria-hidden
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={time}
              onChange={(e) => {
                const video = v();
                if (video) video.currentTime = Number(e.target.value);
                poke();
              }}
              aria-label="Progression de la vidéo"
              aria-valuetext={`${fmt(time)} sur ${fmt(duration)}`}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <CtrlButton label={playing ? "Pause" : "Lecture"} onClick={togglePlay}>
              {playing ? <Pause className="size-5" fill="currentColor" /> : <Play className="size-5" fill="currentColor" />}
            </CtrlButton>

            <div className="group/vol flex items-center">
              <CtrlButton label={effectiveVolume === 0 ? "Activer le son" : "Couper le son"} onClick={toggleMute}>
                <VolumeIcon className="size-5" />
              </CtrlButton>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={effectiveVolume}
                onChange={(e) => {
                  const video = v();
                  if (!video) return;
                  video.volume = Number(e.target.value);
                  video.muted = Number(e.target.value) === 0;
                  poke();
                }}
                aria-label="Volume"
                className="volume-range hidden w-0 cursor-pointer opacity-0 transition-all duration-300 group-hover/vol:w-20 group-hover/vol:opacity-100 focus-visible:w-20 focus-visible:opacity-100 sm:block"
                style={{ ["--vol" as string]: `${effectiveVolume * 100}%` }}
              />
            </div>

            <span className="ml-1 text-xs font-semibold tabular-nums text-linen/85 sm:text-sm" aria-live="off">
              {fmt(time)} <span className="text-linen/50">/ {fmt(duration)}</span>
            </span>

            <span className="flex-1" />

            <CtrlButton
              label={captionsOn ? "Masquer les sous-titres" : "Afficher les sous-titres"}
              pressed={captionsOn}
              onClick={() => {
                setCaptionsOn((c) => !c);
                poke();
              }}
            >
              {captionsOn ? <Captions className="size-5" /> : <CaptionsOff className="size-5" />}
            </CtrlButton>
            <CtrlButton label={fullscreen ? "Quitter le plein écran" : "Plein écran"} onClick={toggleFullscreen}>
              {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </CtrlButton>
          </div>
        </div>
      )}
    </div>
  );
}

function CtrlButton({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={`grid size-10 place-items-center rounded-full transition-colors hover:bg-linen/15 focus-visible:outline-gold ${
        pressed ? "text-gold" : "text-linen"
      }`}
    >
      {children}
    </button>
  );
}
