import type { Metadata } from "next";
import Image from "next/image";
import { GraduationCap } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CtaBand, Disclaimer, PageHero, SectionHeading } from "@/components/ui";
import { parcours } from "@/lib/content";

export const metadata: Metadata = {
  title: "À propos — Béatrice, praticienne bien-être",
  description:
    "Découvrez Béatrice, praticienne bien-être à Perpignan : son parcours, ses formations (réflexologie, kinésiologie, magnétisme, lithothérapie) et son cabinet.",
  alternates: { canonical: "/a-propos" },
};

const cabinet = [
  { src: "/images/cabinet-1.webp", w: 1600, h: 1200, alt: "La table de soin du cabinet, décorée de suspensions et de plantes" },
  { src: "/images/cabinet-2.webp", w: 1200, h: 1600, alt: "L'espace d'accueil du cabinet avec bureau et fauteuils" },
  { src: "/images/cabinet-3.webp", w: 1200, h: 1600, alt: "Vue d'ensemble du cabinet, lumière douce" },
];

export default function AProposPage() {
  return (
    <>
      <PageHero
        eyebrow="À propos"
        title="Béatrice"
        intro={<p className="font-serif text-2xl italic text-forest">« Accompagner chacun vers son équilibre, c&apos;est ma vocation. »</p>}
      />

      <section className="py-16 md:py-24">
        <div className="container-page grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <Reveal className="relative mx-auto w-full max-w-sm md:sticky md:top-28 md:self-start">
            <Image
              src="/images/about-hero-zen.webp"
              alt="Bougie, galets empilés et fleurs dans une ambiance zen"
              width={1024}
              height={1280}
              sizes="(max-width: 768px) 90vw, 400px"
              className="rounded-[1.75rem] shadow-soft"
            />
          </Reveal>
          <Reveal delay={100}>
            <p className="eyebrow">Qui suis-je ?</p>
            <h2 className="mt-2 text-4xl md:text-5xl">Je suis Béatrice, praticienne bien-être à Perpignan.</h2>
            <div className="mt-8 space-y-5 text-ink-soft">
              <p>
                J&apos;ai consacré une grande partie de ma vie professionnelle à l&apos;accompagnement de la
                personne. Cette expérience a façonné ma manière d&apos;aborder chaque rencontre : avec rigueur,
                écoute et profond respect.
              </p>
              <p>
                J&apos;ai toujours ressenti, dès l&apos;adolescence, une sensibilité particulière aux énergies. Le
                magnétisme s&apos;est imposé à moi naturellement, et cette pratique traditionnelle est
                aujourd&apos;hui au cœur de mon accompagnement.
              </p>
              <p>
                Au fil des années, j&apos;ai complété ma démarche par plusieurs formations : réflexologie,
                kinésiologie, massage bien-être, lithothérapie, Flamme Violette. Chaque approche enrichit les
                autres, et je construis avec vous un accompagnement sur mesure, selon vos besoins du moment.
              </p>
              <p>
                Je propose également des séances de guidance — oracle, tarot, médiumnité — pour celles et ceux qui
                souhaitent un espace d&apos;écoute autour des questions existentielles, toujours dans la
                bienveillance et le respect de chacun.
              </p>
              <p className="border-l-2 border-sage pl-5 font-serif text-xl text-ink italic">
                Mon souhait : vous offrir un espace de confiance où le corps se détend, où l&apos;énergie circule,
                et où chacun trouve son apaisement.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-sand py-16 md:py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Parcours"
              title="Mes formations"
              intro="Formations professionnelles suivies auprès d'organismes privés spécialisés."
            />
          </Reveal>
          <ol className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
            {parcours.map((f, i) => (
              <Reveal as="li" key={f.title} delay={i * 60} className="card flex items-start gap-4 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sage-soft text-forest">
                  <GraduationCap className="size-5" aria-hidden strokeWidth={1.5} />
                </span>
                <span>
                  <span className="block font-serif text-xl leading-snug">{f.title}</span>
                  <span className="text-sm text-ink-soft">{f.date}</span>
                </span>
              </Reveal>
            ))}
          </ol>
          <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-ink-soft">
            Ces formations ne constituent pas des diplômes d&apos;État et n&apos;autorisent pas l&apos;exercice de
            la médecine.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="Mon cabinet" title="Un espace pensé pour votre détente" />
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {cabinet.map((img, i) => (
              <Reveal key={img.src} delay={i * 80} className={i === 0 ? "sm:col-span-3 lg:col-span-1" : ""}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={img.w}
                  height={img.h}
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="h-80 w-full rounded-2xl object-cover shadow-card lg:h-[26rem]"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Disclaimer />
      <CtaBand />
    </>
  );
}
