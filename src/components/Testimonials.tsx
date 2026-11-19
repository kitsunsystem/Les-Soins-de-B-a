"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Quote, X } from "lucide-react";
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
      <div className="columns-1 gap-6 md:columns-2 lg:columns-3 [&>*]:mb-6">
        {items.map((t) => (
          <figure key={t.name} className="card relative break-inside-avoid p-7">
            <Quote className="absolute right-6 top-6 size-8 text-sage-soft" aria-hidden />
            <span className="tracking-[0.15em] text-gold" aria-label="5 étoiles sur 5">
              ★★★★★
            </span>
            <blockquote className="mt-4 font-serif text-[1.15rem] leading-relaxed text-ink italic">« {t.text} »</blockquote>
            <figcaption className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-clay-soft font-serif text-clay-dark">
                  {t.name.charAt(0)}
                </span>
                <span className="font-bold text-ink">{t.name}</span>
              </span>
              {showBook && (
                <button
                  type="button"
                  onClick={() => setCurrent(t)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-forest underline-offset-4 hover:underline"
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
        className="m-auto max-h-[92dvh] w-[min(92vw,900px)] rounded-3xl bg-card p-0 backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
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
