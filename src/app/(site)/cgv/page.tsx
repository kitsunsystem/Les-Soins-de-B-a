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
        {site.city}, ainsi que les consultations réalisées à distance (visio ou téléphone), partout en France.
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
      <p>
        Avant la première séance, le client remplit une fiche d&apos;admission (coordonnées, motif de consultation,
        informations de santé utiles pour écarter toute contre-indication), en ligne ou sur papier.
      </p>

      <h2>Consultations à distance</h2>
      <p>
        Certaines prestations (guidance, tirages, médiumnité, magnétisme sur photo) peuvent être réalisées à distance,
        en visio ou par téléphone. À l&apos;heure du rendez-vous, la praticienne appelle le client au numéro indiqué
        ou lui transmet le lien de la visio. Le client veille à être joignable et disponible, dans un endroit calme ;
        une séance manquée faute de pouvoir le joindre est considérée comme une absence.
      </p>

      <h2>Tarifs</h2>
      <p>Les tarifs en vigueur sont ceux affichés sur le site au moment de la prise de rendez-vous.</p>

      <h2>Paiement</h2>
      <p>
        Au cabinet, le règlement s&apos;effectue en fin de séance, en espèces ou par carte bancaire. Pour les
        consultations à distance, les modalités de règlement sont précisées lors de la confirmation du rendez-vous.
      </p>

      <h2>Acompte</h2>
      <p>
        Après plusieurs annulations ou absences, un acompte peut être demandé lors de la réservation (montant indiqué
        avant validation). Il est réglé en ligne par carte bancaire sur une page de paiement sécurisée, ou selon les
        modalités indiquées par la praticienne, et vient en déduction du prix de la séance.
      </p>
      <p>
        L&apos;acompte n&apos;est pas remboursé si le client annule le rendez-vous ou ne se présente pas. Il est
        intégralement remboursé si la praticienne annule ou refuse le rendez-vous. Lors d&apos;un paiement en ligne,
        le créneau est retenu 30 minutes ; passé ce délai sans paiement, il est libéré.
      </p>

      <h2>Annulation</h2>
      <p>
        Toute annulation doit être signalée au minimum 24 h à l&apos;avance, via le lien présent dans l&apos;email de
        confirmation ou par téléphone. En cas d&apos;annulations ou d&apos;absences répétées, un acompte peut être
        demandé pour les réservations suivantes (voir « Acompte »), et la praticienne se réserve le droit de refuser
        de nouveaux rendez-vous.
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
