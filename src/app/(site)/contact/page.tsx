import type { Metadata } from "next";
import Link from "next/link";
import { CalendarHeart, Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm, contactSubjects } from "@/components/ContactForm";
import { PageHero } from "@/components/ui";
import { getService } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez Béatrice, praticienne bien-être à Perpignan : téléphone, formulaire de contact, cartes cadeaux, formations.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const sp = await searchParams;
  const objet = typeof sp.objet === "string" ? sp.objet : "";
  const subject = contactSubjects[objet as keyof typeof contactSubjects] ?? contactSubjects.rdv;
  const service = getService(typeof sp.soin === "string" ? sp.soin : null);
  const message = service ? `Bonjour, je souhaiterais un rendez-vous pour : ${service.name}.\n\n` : "";

  return (
    <>
      <PageHero
        eyebrow="À bientôt"
        title="Me contacter"
        intro="Pour toute question, demande de rendez-vous sur mesure ou commande de carte cadeau."
      />
      <section className="pb-24">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_22rem]">
          <ContactForm defaultSubject={subject} defaultMessage={message} />

          <aside className="space-y-5">
            <div className="rounded-[1.25rem] bg-rose-soft p-6">
              <p className="font-serif text-2xl">Réserver directement</p>
              <p className="mt-2 text-sm text-ink-soft">
                Pour un soin classique, choisissez votre créneau en ligne : c&apos;est plus rapide.
              </p>
              <Link href="/rendez-vous" className="btn btn-primary mt-4 w-full !py-2.5 text-sm">
                <CalendarHeart className="size-4" aria-hidden />
                Prendre rendez-vous
              </Link>
            </div>
            <div className="card space-y-5 p-6 text-sm">
              <p className="font-serif text-2xl">Mes coordonnées</p>
              <p className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-rose-deep" aria-hidden />
                <span>
                  Cabinet à {site.city}
                  <br />
                  <span className="text-ink-soft">{site.addressNote}</span>
                </span>
              </p>
              <p className="flex gap-3">
                <Phone className="mt-0.5 size-5 shrink-0 text-rose-deep" aria-hidden />
                <a href={site.phoneHref} className="hover:text-rose-deep">
                  {site.phone}
                </a>
              </p>
              {site.email && (
                <p className="flex gap-3">
                  <Mail className="mt-0.5 size-5 shrink-0 text-rose-deep" aria-hidden />
                  <a href={`mailto:${site.email}`} className="hover:text-rose-deep">
                    {site.email}
                  </a>
                </p>
              )}
              <p className="flex gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-rose-deep" aria-hidden />
                <span>Sur rendez-vous uniquement</span>
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
