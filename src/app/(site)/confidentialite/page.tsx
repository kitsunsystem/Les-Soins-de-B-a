import type { Metadata } from "next";
import { LegalPage, Todo } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  alternates: { canonical: "/confidentialite" },
};

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="novembre 2026">
      <h2>Responsable du traitement</h2>
      <p>
        {site.owner} — {site.name}, {site.city}.
      </p>

      <h2>Données collectées</h2>
      <ul>
        <li>
          <strong>Prise de rendez-vous en ligne</strong> : nom, prénom, email, téléphone, soin choisi, date et heure
          du rendez-vous, message facultatif.
        </li>
        <li>
          <strong>Formulaire de contact</strong> : nom, prénom, email, téléphone (facultatif), objet et message.
        </li>
      </ul>
      <p>
        Ces informations sont regroupées dans une fiche client (historique des rendez-vous et des messages, notes de
        suivi) consultable uniquement par la praticienne, dans un espace protégé par mot de passe.
      </p>
      <p>
        Merci de ne transmettre que les informations de santé utiles à l&apos;adaptation de la séance (grossesse,
        contre-indication…). Elles sont traitées de manière strictement confidentielle.
      </p>

      <h2>Finalités et base légale</h2>
      <p>Les données sont utilisées exclusivement pour :</p>
      <ul>
        <li>gérer vos rendez-vous (confirmation, rappel la veille, annulation) — exécution de la prestation ;</li>
        <li>répondre à vos demandes de contact — votre consentement ;</li>
        <li>vous envoyer les informations demandées (cartes cadeaux, formations).</li>
      </ul>
      <p>Aucune donnée n&apos;est vendue, cédée ou utilisée à des fins publicitaires.</p>

      <h2>Destinataires et sous-traitants</h2>
      <ul>
        <li>
          <strong>Brevo</strong> (Sendinblue SAS, France) : envoi des emails de confirmation et de rappel. Données
          hébergées dans l&apos;Union européenne.
        </li>
        <li>
          <strong>Hébergement du site et de la base de données</strong> : Cloudflare, Inc. (Cloudflare Workers et
          D1), dans le cadre de clauses contractuelles conformes au RGPD.
        </li>
      </ul>

      <h2>Durée de conservation</h2>
      <p>
        Les données sont conservées pendant 3 ans maximum après le dernier contact ou le dernier rendez-vous, puis
        supprimées.
      </p>

      <h2>Vos droits (RGPD)</h2>
      <p>
        Conformément au Règlement Général sur la Protection des Données, vous disposez d&apos;un droit
        d&apos;accès, de rectification, d&apos;effacement, de limitation et d&apos;opposition au traitement de vos
        données. Pour exercer ces droits, contactez : {site.email ?? <Todo>email à compléter</Todo>} ou le{" "}
        {site.phone}.
      </p>

      <h2>Cookies</h2>
      <p>
        Ce site n&apos;utilise aucun cookie de mesure d&apos;audience ou publicitaire. Seul un cookie technique est
        déposé dans l&apos;espace d&apos;administration réservé à la praticienne.
      </p>

      <h2>Réclamation</h2>
      <p>
        En cas de litige, vous pouvez adresser une réclamation à la CNIL :{" "}
        <a href="https://www.cnil.fr" rel="noopener" target="_blank">
          www.cnil.fr
        </a>
        .
      </p>
    </LegalPage>
  );
}
