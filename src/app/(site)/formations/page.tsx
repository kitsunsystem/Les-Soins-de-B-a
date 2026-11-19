import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Hand } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { PageHero } from "@/components/ui";
import { formations } from "@/lib/content";

export const metadata: Metadata = {
  title: "Formations — Magnétisme & Flamme Violette",
  description:
    "Formations au magnétisme et à la Flamme Violette (niveau II) à Perpignan, pour développer votre pratique. Durée, tarifs et modalités sur demande.",
  alternates: { canonical: "/formations" },
};

const icons = [Hand, Flame];

export default function FormationsPage() {
  return (
    <>
      <PageHero
        eyebrow="Transmettre"
        title="Transmettre, c'est prolonger le soin."
        intro="Parce que le magnétisme et la Flamme Violette sont des dons qui se transmettent, je propose des formations à celles et ceux qui souhaitent développer leur pratique."
      />
      <section className="pb-24 pt-8">
        <div className="container-page grid max-w-4xl gap-6 md:grid-cols-2">
          {formations.map((f, i) => {
            const Icon = icons[i % icons.length];
            return (
              <Reveal key={f.title} delay={i * 100} className="card flex flex-col p-8 text-center">
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-sage-soft text-forest">
                  <Icon className="size-7" aria-hidden strokeWidth={1.5} />
                </span>
                <h2 className="mt-5 text-3xl">{f.title}</h2>
                <p className="mt-3 flex-1 text-ink-soft">{f.text}</p>
                <Link href="/contact?objet=formation" className="btn btn-outline mt-7 self-center">
                  Me contacter pour en savoir plus
                </Link>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-10 text-center font-serif text-xl text-ink-soft italic">
          Durée, tarifs et modalités sur demande.
        </p>
      </section>
    </>
  );
}
