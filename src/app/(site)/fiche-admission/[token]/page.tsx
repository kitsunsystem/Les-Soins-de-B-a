import type { Metadata } from "next";
import { ClipboardList, Lock } from "lucide-react";
import { Ornament } from "@/components/ui";
import { getClientByAdmissionToken } from "@/lib/clients";
import { site } from "@/lib/site";
import { formatDateStr, parisDateStr } from "@/lib/time";
import { AdmissionForm } from "./AdmissionForm";

export const metadata: Metadata = {
  title: "Fiche d'admission",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default async function FicheAdmissionPage({ params }: PageProps<"/fiche-admission/[token]">) {
  const { token } = await params;
  const c = await getClientByAdmissionToken(token);

  if (!c) {
    return (
      <section className="py-16 md:py-24">
        <div className="container-page max-w-xl">
          <div className="card p-8 text-center md:p-10">
            <ClipboardList className="mx-auto size-12 text-forest" aria-hidden strokeWidth={1.25} />
            <h1 className="mt-4 text-4xl">Fiche d&apos;admission</h1>
            <Ornament className="mt-5" />
            <p className="mt-6 text-ink-soft">
              Ce lien n&apos;est pas valide. Pour recevoir votre lien personnel, appelez Béatrice au{" "}
              <a className="text-forest underline" href={site.phoneHref}>
                {site.phone}
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Seules les coordonnées sont pré-remplies : les réponses de santé ne sont jamais réaffichées.
  const prefill = {
    lastName: c.lastName || (c.firstName ? "" : c.name),
    firstName: c.firstName,
    birthdate: c.birthdate,
    phone: c.phone,
    email: c.email,
    address: c.address,
    profession: c.profession,
    howFound: c.howFound,
  };

  return (
    <section className="py-12 md:py-20">
      <div className="container-page max-w-3xl">
        <header className="text-center">
          <p className="eyebrow">Les Soins de Béa</p>
          <h1 className="mt-3 text-[2.6rem] md:text-[3.4rem]">Fiche d&apos;admission</h1>
          <Ornament className="mt-5" />
          <p className="mx-auto mt-5 max-w-xl text-ink-soft">
            Ces informations permettent à Béatrice d&apos;adapter chaque séance à votre situation et d&apos;écarter
            toute contre-indication. Comptez 5 minutes.
          </p>
          <p className="mx-auto mt-3 flex max-w-xl items-center justify-center gap-2 text-sm text-ink-soft">
            <Lock className="size-4 shrink-0 text-forest" aria-hidden />
            Strictement confidentiel : seule Béatrice y a accès. Rien n&apos;est transmis par email.
          </p>
          {c.admissionReceivedAt && (
            <p className="mx-auto mt-5 max-w-xl rounded-2xl bg-forest-soft p-4 text-sm text-forest">
              Votre fiche a bien été reçue le {formatDateStr(parisDateStr(c.admissionReceivedAt), { weekday: undefined, year: "numeric" })}.
              Vous pouvez la remplir à nouveau ci-dessous si votre situation a changé.
            </p>
          )}
        </header>
        <AdmissionForm token={token} prefill={prefill} update={Boolean(c.admissionReceivedAt)} />
      </div>
    </section>
  );
}
