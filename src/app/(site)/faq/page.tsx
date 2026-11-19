import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { CtaBand, PageHero } from "@/components/ui";
import { faq } from "@/lib/content";

export const metadata: Metadata = {
  title: "Questions fréquentes",
  description:
    "Déroulement d'une séance, prise de rendez-vous, annulation, paiement, cartes cadeaux, magnétisme à distance : les réponses à vos questions.",
  alternates: { canonical: "/faq" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero eyebrow="Questions" title="Vos questions, mes réponses" />
      <section className="pb-24">
        <div className="container-page max-w-3xl space-y-3">
          {faq.map((f, i) => (
            <details key={f.q} className="card group p-0 [&_summary::-webkit-details-marker]:hidden" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-serif text-xl">
                {f.q}
                <Plus
                  className="size-5 shrink-0 text-rose-deep transition-transform duration-300 group-open:rotate-45"
                  aria-hidden
                />
              </summary>
              <p className="px-6 pb-6 text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      <CtaBand title="Une autre question ?" text="Je vous réponds avec plaisir, par téléphone ou via le formulaire de contact." />
    </>
  );
}
