import type { Metadata } from "next";
import { LegalPage, Todo } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Conditions générales",
  alternates: { canonical: "/cgv" },
};

export default function CgvPage() {
  return (
    <LegalPage title="Conditions générales" updated="novembre 2026">
      <h2>Prestataire</h2>
      <p>
        {site.owner} — {site.name}, entreprise individuelle.
        <br />
        SIRET : <Todo>À compléter</Todo>
      </p>

      <h2>Objet</h2>
      <p>
        Les présentes conditions régissent les prestations de bien-être proposées par {site.owner} à son cabinet de{" "}
        {site.city}.
      </p>

      <h2>Nature des prestations</h2>
      <p>
        Les prestations proposées (réflexologie, kinésiologie, magnétisme, massages bien-être, guidance, formations)
        relèvent du domaine du bien-être et ne constituent en aucun cas des actes médicaux. Elles ne se substituent à
        aucun traitement médical ou suivi psychologique.
      </p>

      <h2>Prise de rendez-vous</h2>
      <p>
        Les rendez-vous se prennent en ligne sur ce site, par téléphone ou via le formulaire de contact. Une demande
        en ligne réserve le créneau choisi ; le rendez-vous est définitif après confirmation par la praticienne,
        envoyée par email.
      </p>

      <h2>Tarifs</h2>
      <p>Les tarifs en vigueur sont ceux affichés sur le site au moment de la prise de rendez-vous.</p>

      <h2>Paiement</h2>
      <p>Le règlement s&apos;effectue en fin de séance, en espèces ou par carte bancaire.</p>

      <h2>Annulation</h2>
      <p>
        Toute annulation doit être signalée au minimum 24 h à l&apos;avance, via le lien présent dans l&apos;email de
        confirmation ou par téléphone. En cas d&apos;annulation tardive ou de non-présentation répétée, la
        praticienne se réserve le droit de refuser de nouveaux rendez-vous.
      </p>

      <h2>Cartes cadeaux</h2>
      <p>
        Les cartes cadeaux sont valables 12 mois à compter de leur date d&apos;émission. Elles ne sont ni
        remboursables, ni échangeables contre de l&apos;argent.
      </p>

      <h2>Obligations du client</h2>
      <p>
        Le client s&apos;engage à informer la praticienne de son état de santé général et de tout traitement en
        cours, afin d&apos;adapter la séance. Les prestations ne peuvent être réalisées sur des personnes mineures
        sans l&apos;accord et la présence d&apos;un parent ou tuteur légal.
      </p>

      <h2>Responsabilité</h2>
      <p>
        La praticienne met tout en œuvre pour proposer un accompagnement de qualité, sans engagement de résultat.
        Les prestations relèvent du bien-être et ne peuvent être assimilées à un traitement médical.
      </p>

      <h2>Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de litige, une solution amiable sera
        recherchée. À défaut, le client peut saisir le médiateur de la consommation mentionné dans les mentions
        légales.
      </p>
    </LegalPage>
  );
}
