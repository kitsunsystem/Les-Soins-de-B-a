import type { Metadata } from "next";
import Link from "next/link";
import { CalendarHeart, Sparkles } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CategoryBadge, CategoryIcon, ServiceCard, tones } from "@/components/services";
import { CtaBand, Disclaimer, PageHero } from "@/components/ui";
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
        title={
          <>
            Des soins pour le corps, <span className="accent">l&apos;énergie et l&apos;esprit</span>
          </>
        }
        intro="Quatre univers complémentaires, avec durées et tarifs. Choisissez votre soin et réservez votre créneau en ligne."
      >
        <ul className="flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${tones[c.id].soft} ${tones[c.id].text}`}
              >
                <CategoryIcon icon={c.icon} className="size-4" />
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </PageHero>

      {categories.map((c, idx) => {
        const t = tones[c.id];
        return (
          <section
            key={c.id}
            id={c.id}
            className={`scroll-mt-24 py-16 md:py-24 ${idx % 2 === 0 ? "bg-card/50" : ""}`}
            aria-labelledby={`titre-${c.id}`}
          >
            <div className="container-page">
              <Reveal className="grid items-end gap-6 md:grid-cols-[1fr_auto]">
                <div className="flex items-start gap-5">
                  <CategoryBadge category={c} className="size-16" />
                  <div>
                    <h2 id={`titre-${c.id}`} className="text-[2.3rem] md:text-[2.9rem]">
                      {c.name}
                    </h2>
                    <p className="mt-2 max-w-2xl text-lg text-ink-soft">{c.intro}</p>
                  </div>
                </div>
                <p className={`rounded-2xl px-5 py-3 text-sm md:max-w-xs ${t.soft}`}>
                  <span className={`font-bold ${t.text}`}>Idéal pour :</span> {c.idealFor}.
                </p>
              </Reveal>

              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {servicesByCategory(c.id).map((s, i) => (
                  <Reveal key={s.id} delay={(i % 3) * 70}>
                    <ServiceCard service={s} />
                  </Reveal>
                ))}
              </div>

              {c.id === "corps" && (
                <Reveal className="mt-8 flex items-start gap-4 rounded-2xl border border-dashed border-gold/60 bg-amber-soft/50 p-6">
                  <Sparkles className="mt-1 size-5 shrink-0 text-gold" aria-hidden />
                  <div>
                    <p className="font-serif text-xl">{bientotDisponible.title}</p>
                    <p className="mt-1 text-sm text-ink-soft">{bientotDisponible.text}</p>
                  </div>
                </Reveal>
              )}

              {c.id === "energetique" && (
                <Reveal className="mt-8 rounded-2xl bg-amber-soft p-7 md:p-8">
                  <h3 className="text-2xl">Qu&apos;est-ce que le magnétisme ?</h3>
                  <p className="mt-2 text-ink-soft">{magnetismeExplication}</p>
                </Reveal>
              )}

              {c.id === "guidance" && (
                <Reveal className="mt-8 rounded-2xl bg-lavender-soft/60 p-6 text-sm text-ink-soft">{guidanceNote}</Reveal>
              )}
            </div>
          </section>
        );
      })}

      <section className="container-page pt-6 text-center">
        <p className="text-ink-soft">Vous hésitez entre deux soins ?</p>
        <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/rendez-vous" className="btn btn-primary">
            <CalendarHeart className="size-4" aria-hidden />
            Réserver en ligne
          </Link>
          <Link href="/contact?objet=question" className="btn btn-outline">
            Me poser la question
          </Link>
        </div>
      </section>
      <CtaBand />
      <Disclaimer />
    </>
  );
}
