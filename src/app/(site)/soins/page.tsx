import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CategoryIcon, ServiceCard } from "@/components/services";
import { CtaBand, Disclaimer, Ornament, PageHero } from "@/components/ui";
import {
  bientotDisponible,
  categories,
  guidanceNote,
  magnetismeExplication,
  servicesByCategory,
} from "@/lib/content";

export const metadata: Metadata = {
  title: "Les soins — Réflexologie, massages, magnétisme, guidance",
  description:
    "Réflexologie plantaire, facio-crânienne, massages bien-être, magnétisme, massage prénatal, atelier bébé, oracle et tarot : tous les soins de Béa à Perpignan, avec durées et tarifs.",
  alternates: { canonical: "/soins" },
};

export default function SoinsPage() {
  return (
    <>
      <PageHero
        eyebrow="Mon offre"
        title="Les soins"
        intro="Quatre univers complémentaires pour prendre soin de vous, dans toutes vos dimensions."
      />

      <nav
        aria-label="Univers de soins"
        className="sticky top-18 z-30 border-y border-line bg-cream/90 backdrop-blur-md md:top-20"
      >
        <ul className="container-page flex gap-2 overflow-x-auto py-3 [scrollbar-width:none]">
          {categories.map((c) => (
            <li key={c.id} className="shrink-0">
              <a
                href={`#${c.id}`}
                className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm text-ink-soft transition-colors hover:border-rose-deep hover:text-rose-deep"
              >
                <CategoryIcon icon={c.icon} className="size-4" />
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {categories.map((c, idx) => (
        <section
          key={c.id}
          id={c.id}
          className={`scroll-mt-36 py-16 md:py-24 ${idx % 2 === 1 ? "bg-sand" : ""}`}
          aria-labelledby={`titre-${c.id}`}
        >
          <div className="container-page">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-rose-soft text-rose-deep">
                <CategoryIcon icon={c.icon} />
              </span>
              <h2 id={`titre-${c.id}`} className="mt-4 text-4xl md:text-5xl">
                {c.name}
              </h2>
              <Ornament className="mt-5" />
              <p className="mt-5 text-ink-soft">{c.intro}</p>
            </Reveal>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {servicesByCategory(c.id).map((s, i) => (
                <Reveal key={s.id} delay={(i % 3) * 70}>
                  <ServiceCard service={s} />
                </Reveal>
              ))}
            </div>

            {c.id === "corps" && (
              <Reveal className="mx-auto mt-10 max-w-3xl rounded-2xl border border-dashed border-gold/60 bg-card/60 p-6 text-center">
                <p className="flex items-center justify-center gap-2 font-serif text-xl">
                  <Sparkles className="size-4 text-gold" aria-hidden />
                  {bientotDisponible.title}
                </p>
                <p className="mt-2 text-sm text-ink-soft">{bientotDisponible.text}</p>
              </Reveal>
            )}

            {c.id === "energetique" && (
              <Reveal className="mx-auto mt-10 max-w-3xl rounded-2xl bg-sage-soft p-7">
                <h3 className="text-2xl">Qu&apos;est-ce que le magnétisme ?</h3>
                <p className="mt-2 text-sm text-ink-soft">{magnetismeExplication}</p>
              </Reveal>
            )}

            {c.id === "guidance" && (
              <Reveal className="mx-auto mt-10 max-w-3xl text-center text-sm text-ink-soft italic">
                {guidanceNote}
              </Reveal>
            )}
          </div>
        </section>
      ))}

      <Disclaimer />
      <CtaBand />
    </>
  );
}
