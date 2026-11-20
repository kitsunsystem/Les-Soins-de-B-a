import type { Metadata } from "next";
import Link from "next/link";
import { Gift, Globe2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CategoryBadge, RemoteBadge } from "@/components/services";
import { CtaBand, Disclaimer, PageHero } from "@/components/ui";
import { categories, servicesByCategory } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tarifs des soins",
  description:
    "Tarifs des soins bien-être de Béa à Perpignan : réflexologie dès 30 €, massages, magnétisme. Consultation de guidance d'une heure à 60 €, aussi à distance partout en France.",
  alternates: { canonical: "/tarifs" },
};

export default function TarifsPage() {
  return (
    <>
      <PageHero
        eyebrow="Investir en vous"
        title="Tarifs"
        intro={
          <>
            Sur rendez-vous uniquement. Au cabinet, règlement en fin de séance : {site.payment.toLowerCase()}.
            <span className="mt-3 flex items-center justify-center gap-2 text-base font-semibold text-lavender">
              <Globe2 className="size-4" aria-hidden />
              Guidance, tarot et médiumnité aussi à distance, partout en France
            </span>
          </>
        }
      />
      <section className="pb-20">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          {categories.map((c, i) => (
            <Reveal key={c.id} delay={(i % 2) * 80} className="card p-7 md:p-8">
              <h2 className="flex items-center gap-3 text-3xl">
                <CategoryBadge category={c} className="size-12" />
                {c.name}
              </h2>
              <table className="mt-6 w-full text-sm">
                <caption className="sr-only">Tarifs — {c.name}</caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">Soin</th>
                    <th scope="col">Durée</th>
                    <th scope="col">Tarif</th>
                  </tr>
                </thead>
                <tbody>
                  {servicesByCategory(c.id).map((s) => (
                    <tr key={s.id} className="border-b border-line/70 last:border-0">
                      <th scope="row" className="py-3 pr-3 text-left font-normal">
                        {s.durationMinutes ? (
                          <Link href={`/rendez-vous?soin=${s.id}`} className="hover:text-forest">
                            {s.name}
                          </Link>
                        ) : (
                          s.name
                        )}
                        <RemoteBadge service={s} className="ml-2 align-middle" />
                      </th>
                      <td className="whitespace-nowrap py-3 pr-3 text-right text-ink-soft">{s.durationLabel}</td>
                      <td className="whitespace-nowrap py-3 text-right font-serif text-xl text-clay">{s.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          ))}

          <Reveal className="card p-7 md:p-8">
            <h2 className="text-3xl">Formations</h2>
            <p className="mt-4 flex justify-between border-b border-line/70 pb-3 text-sm">
              <span>Magnétisme · Flamme Violette II</span>
              <span className="font-serif text-xl text-clay">sur demande</span>
            </p>
            <Link href="/formations" className="link-arrow mt-5 inline-block text-sm">
              Découvrir les formations →
            </Link>
          </Reveal>

          <Reveal delay={80} className="relative overflow-hidden rounded-[1.5rem] bg-clay-soft p-7 md:p-8">
            <Gift className="absolute -right-4 -top-4 size-28 text-clay/25" aria-hidden strokeWidth={1} />
            <h2 className="relative text-3xl">Cartes & bons cadeaux</h2>
            <p className="relative mt-4 text-sm text-ink-soft">
              Offrez du bien-être : cartes et bons cadeaux disponibles, montant libre. Une attention précieuse pour
              les êtres qui vous sont chers. Valables 12 mois.
            </p>
            <Link href="/contact?objet=cadeau" className="btn btn-primary relative mt-6 !py-2.5 text-sm">
              Commander une carte cadeau
            </Link>
          </Reveal>
        </div>
      </section>
      <Disclaimer />
      <CtaBand />
    </>
  );
}
