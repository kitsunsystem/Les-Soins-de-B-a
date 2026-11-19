import type { Metadata } from "next";
import Link from "next/link";
import { CalendarX2 } from "lucide-react";
import { Ornament } from "@/components/ui";
import { canClientCancel, CLIENT_CANCEL_LIMIT_HOURS, getByToken } from "@/lib/bookings";
import { site } from "@/lib/site";
import { formatDateTime } from "@/lib/time";
import { cancelAction } from "./actions";

export const metadata: Metadata = {
  title: "Annuler un rendez-vous",
  robots: { index: false, follow: false },
};

export default async function AnnulationPage({ searchParams }: PageProps<"/rendez-vous/annulation">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const erreur = typeof sp.erreur === "string" ? sp.erreur : "";
  const appt = await getByToken(token);

  return (
    <section className="py-16 md:py-24">
      <div className="container-page max-w-xl">
        <div className="card p-8 text-center md:p-10">
          <CalendarX2 className="mx-auto size-12 text-rose-deep" aria-hidden strokeWidth={1.25} />
          <h1 className="mt-4 text-4xl">Annuler un rendez-vous</h1>
          <Ornament className="mt-5" />

          {!appt ? (
            <p className="mt-6 text-ink-soft">
              Ce lien d&apos;annulation n&apos;est pas valide. Pour toute question, appelez le{" "}
              <a className="text-rose-deep underline" href={site.phoneHref}>
                {site.phone}
              </a>
              .
            </p>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-sand p-5 text-left text-sm">
                <p className="font-serif text-xl">{appt.serviceName}</p>
                <p className="mt-1 first-letter:uppercase">{formatDateTime(appt.startsAt)}</p>
                <p className="text-ink-soft">au nom de {appt.clientName}</p>
              </div>

              {erreur && (
                <p role="alert" className="mt-5 rounded-xl bg-rose-soft px-4 py-3 text-sm text-rose-darker">
                  {erreur}
                </p>
              )}

              {appt.status === "cancelled" || appt.status === "declined" ? (
                <p className="mt-6 text-ink-soft" role="status">
                  Ce rendez-vous est annulé. Au plaisir de vous accueillir une prochaine fois !
                </p>
              ) : canClientCancel(appt) ? (
                <form action={cancelAction} className="mt-6">
                  <input type="hidden" name="token" value={token} />
                  <p className="text-sm text-ink-soft">
                    Vous pouvez annuler en ligne jusqu&apos;à {CLIENT_CANCEL_LIMIT_HOURS} h avant le rendez-vous. Le
                    créneau sera libéré pour quelqu&apos;un d&apos;autre.
                  </p>
                  <button type="submit" className="btn btn-primary mt-5">
                    Confirmer l&apos;annulation
                  </button>
                </form>
              ) : (
                <p className="mt-6 text-ink-soft">
                  Le rendez-vous est dans moins de {CLIENT_CANCEL_LIMIT_HOURS} h : merci d&apos;appeler directement
                  le{" "}
                  <a className="text-rose-deep underline" href={site.phoneHref}>
                    {site.phone}
                  </a>
                  .
                </p>
              )}
            </>
          )}
          <Link href="/rendez-vous" className="link-arrow mt-8 inline-block text-sm">
            Prendre un nouveau rendez-vous
          </Link>
        </div>
      </div>
    </section>
  );
}
