import type { Metadata } from "next";
import Link from "next/link";
import { CalendarX2, CheckCircle2, CreditCard } from "lucide-react";
import { AdmissionCta } from "@/components/BookingWizard";
import { Ornament } from "@/components/ui";
import { confirmDepositPayment, releaseHold } from "@/lib/bookings";
import { site } from "@/lib/site";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = {
  title: "Acompte de réservation",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Retour de la page de paiement Stripe : acompte payé (session_id) ou paiement abandonné (annule). */
export default async function AcomptePage({ searchParams }: PageProps<"/rendez-vous/acompte">) {
  const sp = await searchParams;
  const sessionId = typeof sp.session_id === "string" && /^cs_[A-Za-z0-9_]{8,200}$/.test(sp.session_id) ? sp.session_id : "";
  const cancelled = typeof sp.annule === "string" && UUID.test(sp.annule) ? sp.annule : "";

  let view: "paid" | "unpaid" | "conflict" | "abandoned" | "error" = "error";
  let result: Awaited<ReturnType<typeof confirmDepositPayment>> | null = null;
  if (sessionId) {
    try {
      result = await confirmDepositPayment(sessionId);
      view = result.ok ? "paid" : "conflict" in result && result.conflict ? "conflict" : result.appt ? "unpaid" : "error";
    } catch (e) {
      console.error("[acompte] vérification du paiement", e);
    }
  } else if (cancelled) {
    await releaseHold(cancelled);
    view = "abandoned";
  }
  const appt = result?.appt;

  return (
    <section className="py-16 md:py-24">
      <div className="container-page max-w-xl">
        <div className="card p-8 text-center md:p-10" role="status">
          {view === "paid" ? (
            <CheckCircle2 className="mx-auto size-14 text-sage" aria-hidden strokeWidth={1.5} />
          ) : view === "abandoned" || view === "conflict" ? (
            <CalendarX2 className="mx-auto size-12 text-forest" aria-hidden strokeWidth={1.25} />
          ) : (
            <CreditCard className="mx-auto size-12 text-forest" aria-hidden strokeWidth={1.25} />
          )}
          <h1 className="mt-4 text-4xl">
            {view === "paid"
              ? appt?.status === "confirmed"
                ? "Acompte reçu, rendez-vous confirmé !"
                : "Acompte reçu, merci !"
              : view === "abandoned"
                ? "Paiement interrompu"
                : view === "conflict"
                  ? "Créneau plus disponible"
                  : view === "unpaid"
                    ? "Paiement en cours de vérification"
                    : "Paiement introuvable"}
          </h1>
          <Ornament className="mt-5" />

          {appt && (view === "paid" || view === "unpaid") && (
            <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-sand p-5 text-left text-sm">
              <p className="font-serif text-xl">{appt.serviceName}</p>
              <p className="mt-1 first-letter:uppercase">{formatDateTime(appt.startsAt)}</p>
              <p className="text-ink-soft">Acompte : {appt.depositCents / 100} € (déduit du prix de la séance)</p>
            </div>
          )}

          <p className="mt-6 text-ink-soft">
            {view === "paid"
              ? appt?.status === "confirmed"
                ? "Vous allez recevoir un email de confirmation avec le rendez-vous à ajouter à votre agenda."
                : "Le créneau est réservé pour vous. Vous recevez un email récapitulatif, puis la confirmation de Béatrice très rapidement."
              : view === "abandoned"
                ? "Aucun montant n'a été débité et le créneau a été libéré. Vous pouvez reprendre votre réservation quand vous le souhaitez."
                : view === "conflict"
                  ? "Le délai de paiement était dépassé et le créneau a été réservé entre-temps. Votre acompte vous est intégralement remboursé. Merci de choisir un autre créneau."
                  : view === "unpaid"
                    ? "Le paiement n'est pas encore confirmé par la banque. Vous recevrez un email dès qu'il le sera ; sinon, le créneau sera libéré automatiquement."
                    : `Nous n'avons pas pu vérifier ce paiement. Si vous avez été débité(e), contactez Béatrice au ${site.phone}.`}
          </p>

          {view === "paid" && result?.admissionUrl && <AdmissionCta url={result.admissionUrl} />}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {view === "abandoned" || view === "conflict" ? (
              <Link href="/rendez-vous" className="btn btn-primary">
                Choisir un créneau
              </Link>
            ) : (
              <Link href="/" className="link-arrow">
                Retour à l&apos;accueil
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
