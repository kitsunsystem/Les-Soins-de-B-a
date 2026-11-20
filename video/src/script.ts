// Textes affichés à l'écran. Soins, tarifs, « idéal pour », témoignages, formations et coordonnées viennent
// directement du site (src/lib/content.ts, src/lib/site.ts) ; les titres reprennent ceux des nouvelles pages.
import type { LucideIcon } from "lucide-react";
import { Baby, Eye, Leaf, Sparkles } from "lucide-react";
import {
  categories,
  formations,
  parcours,
  services,
  testimonials,
  type Category,
  type CategoryId,
} from "../../src/lib/content";
import { site } from "../../src/lib/site";

export { categories, formations, services, site };

const NBSP = " ";

export const categoryIcons: Record<Category["icon"], LucideIcon> = { leaf: Leaf, sparkles: Sparkles, baby: Baby, eye: Eye };

export const accroche = {
  intro: "Stress, tensions, fatigue du quotidien…",
  ligne1: "Et si vous preniez enfin",
  ligne2: `un moment rien qu'à vous${NBSP}?`,
};

export const devise = `«${NBSP}${site.motto}${NBSP}»`;

/** Prix le plus bas et durée la plus courte de la carte (les « preuves » de l'accueil). */
const prix = services
  .map((s) => s.price.match(/\d+/)?.[0])
  .filter((p): p is string => Boolean(p))
  .map(Number);
const durees = services.map((s) => s.durationMinutes).filter((d): d is number => d !== null);
export const preuves = { prixMin: Math.min(...prix), dureeMin: Math.min(...durees) };

/** Les formations suivies, comme les pastilles de l'accueil. */
export const pastillesFormations = parcours.map((f) => f.title.replace("Formation en ", "").replace("Formation ", ""));

/** Les trois étapes de l'accueil, en version courte pour la vidéo. */
export const etapes = [
  { titre: "Je réserve en ligne", texte: "Un soin, un créneau libre, 24 h/24, sans créer de compte." },
  { titre: "Béatrice confirme", texte: "Email récapitulatif, puis confirmation à ajouter à l'agenda." },
  { titre: "Je prends soin de moi", texte: "Règlement sur place, espèces ou carte." },
];

/**
 * Témoignages : passages exacts (début des messages) du livre d'or publié sur le site.
 * Le rendu s'arrête si un extrait ne correspond plus au texte du site.
 */
const extraits: Record<string, string> = {
  Val: "Merci d'être là. Merci pour le bien-être que vous m'avez procuré, vous êtes une vraie fée.",
  Léa: "Un moment suspendu, d'évasion, de liberté. Des sensations, chaque fois plus uniques, singulières et intenses.",
  Sarah: "Un grand merci pour ce moment de bien-être et d'échange. Tu es une pépite avec des mains et un cœur en or",
};

export const temoignages = Object.entries(extraits).map(([name, extrait]) => {
  const original = testimonials.find((t) => t.name === name);
  if (!original || !original.text.includes(extrait)) {
    throw new Error(`L'extrait du témoignage de ${name} ne correspond plus au texte du site.`);
  }
  const text = /[.!?…]$/.test(extrait) ? extrait : `${extrait}.`;
  return { name, text: `«${NBSP}${text}${NBSP}»` };
});

export const reservation = {
  /** Soins proposés à l'étape 1 de la démonstration (le premier est celui qui est réservé). */
  groupes: [
    {
      categorie: "corps" as CategoryId,
      soins: ["reflexologie-plantaire", "reflexologie-complete", "massage-relaxant", "massage-ayurvedique"],
    },
    { categorie: "energetique" as CategoryId, soins: ["massage-energetique", "soin-complet"] },
  ],
  creneaux: ["9h00", "10h30", "14h00", "15h30", "18h00"],
};

export const cadeau = {
  title: "Cartes & bons cadeaux",
  text: "Offrez du bien-être : cartes et bons cadeaux disponibles, montant libre. Une attention précieuse pour les êtres qui vous sont chers.",
  note: "Valables 12 mois",
};

/** Domaine affiché à la fin (repris de site.url). */
export const domaine = site.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
