import type { Metadata } from "next";
import { BookingWizard } from "@/components/BookingWizard";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = {
  title: "Prendre rendez-vous en ligne",
  description:
    "Réservez en ligne votre soin bien-être au cabinet à Perpignan, ou votre consultation de guidance à distance (visio ou téléphone), partout en France.",
  alternates: { canonical: "/rendez-vous" },
};

export default async function RendezVousPage({ searchParams }: PageProps<"/rendez-vous">) {
  const sp = await searchParams;
  const soin = typeof sp.soin === "string" ? sp.soin : undefined;
  const remote = sp.distance === "1";
  return (
    <>
      <PageHero
        eyebrow="Réservation"
        title="Prendre rendez-vous"
        intro="Au cabinet à Perpignan ou à distance, partout en France : choisissez votre soin puis un créneau. Vous recevez aussitôt un email récapitulatif, puis la confirmation de Béatrice."
      />
      <section className="pb-24">
        <div className="container-page">
          <BookingWizard key={`${soin ?? "all"}-${remote}`} initialServiceId={soin} remote={remote} />
        </div>
      </section>
    </>
  );
}
