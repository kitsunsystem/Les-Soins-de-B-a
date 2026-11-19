import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { Testimonials } from "@/components/Testimonials";
import { CtaBand, PageHero } from "@/components/ui";
import { testimonials } from "@/lib/content";

export const metadata: Metadata = {
  title: "Témoignages — Livre d'or",
  description:
    "Les témoignages laissés dans le livre d'or des Soins de Béa par celles et ceux qui lui ont fait confiance, à Perpignan.",
  alternates: { canonical: "/temoignages" },
};

export default function TemoignagesPage() {
  return (
    <>
      <PageHero
        eyebrow="Livre d'or"
        title="Leurs mots, ma plus belle reconnaissance"
        intro="Tous ces témoignages sont issus de mon livre d'or, écrits de la main de mes clientes après leur séance, avec leur autorisation. Cliquez sur « Voir l'original » pour découvrir la page manuscrite."
      />
      <section className="pb-24">
        <Reveal className="container-page">
          <Testimonials items={testimonials} />
        </Reveal>
      </section>
      <CtaBand title="À votre tour de vous offrir ce moment" />
    </>
  );
}
