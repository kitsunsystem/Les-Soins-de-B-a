// Textes de la vidéo. Les soins, durées, tarifs et coordonnées viennent directement du site
// (src/lib/content.ts et src/lib/site.ts) : une mise à jour du site se retrouve dans la vidéo au prochain rendu.
import type { LucideIcon } from "lucide-react";
import { Baby, Eye, Leaf, Sparkles } from "lucide-react";
import { categories, formations, services, testimonials, type Category, type CategoryId } from "../../src/lib/content";
import { site } from "../../src/lib/site";

export { categories, formations, services, site };

const NBSP = " ";

export const categoryIcons: Record<Category["icon"], LucideIcon> = { leaf: Leaf, sparkles: Sparkles, baby: Baby, eye: Eye };

export const accroche = {
  intro: "Stress, tensions, fatigue du quotidien…",
  ligne1: "Et si vous preniez enfin",
  ligne2: `un moment pour vous${NBSP}?`,
};

export const disciplines = "Réflexologie · Kinésiologie · Massages · Magnétisme · Guidance";

export const motto = `«${NBSP}${site.motto}${NBSP}»`;

/** Descriptions courtes affichées sous certains soins (les autres textes viennent du site). */
export const descriptionsCourtes: Partial<Record<string, string>> = {
  "massage-energetique": "Libération des blocages énergétiques par l'imposition des mains et le massage.",
  "soin-complet": "L'expérience la plus aboutie : massage viscéral, réflexologie, bien-être et énergétique.",
  "magnetisme-distance": "Accompagnement énergétique à distance, à partir d'une photo récente.",
  "massage-prenatal": "Un moment de détente et de reconnexion, adapté à chaque trimestre.",
  "atelier-massage-bebe": "Je vous transmets les gestes pour masser votre bébé et renforcer le lien.",
  "oracle-tarot": "Amour, travail, famille, choix de vie : un tirage personnalisé selon votre demande.",
  mediumnite: "Guidance, accompagnement autour d'un deuil, questionnement spirituel.",
};

/** Catégories pour lesquelles on affiche la description sous chaque soin (peu de lignes). */
export const avecDescriptions: CategoryId[] = ["energetique", "femmes-bebes", "guidance"];

export const raisons = [
  {
    title: "Une approche holistique",
    text: "J'intègre le magnétisme, la kinésiologie et la réflexologie dans chaque soin pour un accompagnement complet.",
  },
  {
    title: "Une écoute attentive",
    text: "Toute ma bienveillance et mon attention, au service de votre sérénité.",
  },
  {
    title: "Un cadre de confiance",
    text: "Un cabinet chaleureux à Perpignan, où chaque personne est accueillie avec bienveillance et écoute.",
  },
];

/**
 * Extraits du livre d'or : chaque extrait est un passage exact (début du message) du témoignage publié
 * sur le site (src/lib/content.ts). Le rendu s'arrête si un extrait ne correspond plus au texte du site.
 */
const extraits: Record<string, string> = {
  Léa: "Un moment suspendu, d'évasion, de liberté. Des sensations, chaque fois plus uniques, singulières et intenses.",
  Céline:
    "Béa est à l'écoute et est très douce. Elle vise juste et cible tout de suite les points de tension et les problématiques.",
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
  avantages: ["Sans création de compte", "Confirmation et rappel par email", "Annulation en ligne jusqu'à 24 h avant"],
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

export const avertissement =
  "Pratiques de bien-être : elles ne se substituent pas à une consultation ou à un traitement médical.";
