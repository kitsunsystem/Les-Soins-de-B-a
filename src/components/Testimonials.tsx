"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BookOpen, X } from "lucide-react";
import type { Testimonial } from "@/lib/content";

/** Cartes de témoignages + affichage de la page manuscrite du livre d'or. */
export function Testimonials({ items, showBook = true }: { items: Testimonial[]; showBook?: boolean }) {
  const [current, setCurrent] = useState<Testimonial | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (current && !d.open) d.showModal();
    if (!current && d.open) d.close();
  }, [current]);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <figure key={t.name} className="card flex flex-col p-7">
            <p className="tracking-[0.2em] text-gold" aria-label="5 étoiles sur 5">
              ★★★★★
            </p>
            <blockquote className="mt-4 flex-1 font-serif text-[1.2rem] leading-relaxed text-ink italic">
              « {t.text} »
            </blockquote>
            <figcaption className="mt-5 flex items-center justify-between gap-3">
              <span className="font-script text-2xl text-rose-deep">— {t.name}</span>
              {showBook && (
                <button
                  type="button"
                  onClick={() => setCurrent(t)}
                  className="flex items-center gap-1.5 text-xs text-ink-soft underline-offset-4 hover:text-rose-deep hover:underline"
                >
                  <BookOpen className="size-3.5" aria-hidden />
                  Voir l&apos;original
                </button>
              )}
            </figcaption>
          </figure>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setCurrent(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setCurrent(null);
        }}
        className="m-auto max-h-[92dvh] w-[min(92vw,900px)] rounded-2xl bg-card p-0 backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
        aria-label={current ? `Livre d'or — message de ${current.name}` : undefined}
      >
        {current && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setCurrent(null)}
              className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-card/90 shadow"
              aria-label="Fermer"
            >
              <X className="size-5" />
            </button>
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={current.image}
                alt={`Page manuscrite du livre d'or écrite par ${current.name}`}
                fill
                sizes="(max-width: 900px) 92vw, 900px"
                className="object-contain"
              />
            </div>
            <p className="px-6 py-4 text-center text-sm text-ink-soft">
              Page du livre d&apos;or écrite par <strong className="text-ink">{current.name}</strong>
            </p>
          </div>
        )}
      </dialog>
    </>
  );
}
