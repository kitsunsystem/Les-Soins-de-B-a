import type { Metadata } from "next";
import { BookingWizard } from "@/components/BookingWizard";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = {
  title: "Prendre rendez-vous en ligne",
  description:
    "Réservez votre soin bien-être à Perpignan en ligne : choisissez votre soin, votre créneau, et recevez la confirmation par email.",
  alternates: { canonical: "/rendez-vous" },
};

export default async function RendezVousPage({ searchParams }: PageProps<"/rendez-vous">) {
  const sp = await searchParams;
  const soin = typeof sp.soin === "string" ? sp.soin : undefined;
  return (
    <>
      <PageHero
        eyebrow="Réservation"
        title="Prendre rendez-vous"
        intro="Choisissez votre soin puis un créneau disponible. Vous recevez aussitôt un email récapitulatif, puis la confirmation de Béatrice."
      />
      <section className="pb-24">
        <div className="container-page">
          <BookingWizard key={soin ?? "all"} initialServiceId={soin} />
        </div>
      </section>
    </>
  );
}
