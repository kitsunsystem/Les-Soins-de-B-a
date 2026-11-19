import type { Metadata } from "next";
import { LegalPage, Todo } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updated="novembre 2026">
      <h2>Éditeur du site</h2>
      <p>
        <strong>{site.name}</strong> — {site.owner}, entreprise individuelle (micro-entrepreneuse)
        <br />
        SIRET : <Todo>À compléter</Todo>
        <br />
        Adresse professionnelle : <Todo>À compléter</Todo> — {site.city}
        <br />
        Téléphone : {site.phone}
        <br />
        Email : {site.email ?? <Todo>À compléter</Todo>}
      </p>

      <h2>Directrice de la publication</h2>
      <p>{site.owner}</p>

      <h2>Hébergement</h2>
      <p>
        Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, États-Unis — cloudflare.com
        <br />
        <span className="text-xs">(à adapter si le site est hébergé ailleurs)</span>
      </p>

      <h2>Activité</h2>
      <p>
        Pratiques de bien-être — Code APE : <Todo>À compléter, généralement 9604Z</Todo>
      </p>

      <h2>Assurance responsabilité civile professionnelle</h2>
      <p>
        <Todo>Nom de l&apos;assureur — À compléter</Todo>
      </p>

      <h2>Médiateur de la consommation</h2>
      <p>
        Conformément à l&apos;article L.616-1 du Code de la consommation, en cas de litige, le client peut recourir
        gratuitement au médiateur de la consommation suivant :{" "}
        <Todo>Nom et coordonnées du médiateur — À compléter</Todo>.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus de ce site (textes, images, logo) est la propriété exclusive de {site.owner}.
        Toute reproduction sans autorisation est interdite.
      </p>

      <h2>Photographies</h2>
      <p>
        Certaines images utilisées sur ce site sont des illustrations d&apos;ambiance et ne représentent pas
        nécessairement le cabinet ou la praticienne. Les pages du livre d&apos;or sont publiées avec
        l&apos;autorisation de leurs autrices.
      </p>
    </LegalPage>
  );
}
