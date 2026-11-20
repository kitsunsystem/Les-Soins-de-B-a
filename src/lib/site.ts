// Coordonnées et informations générales du site.
// Les valeurs « null » sont masquées automatiquement tant qu'elles ne sont pas renseignées.

export const site = {
  name: "Les Soins de Béa",
  tagline: "Praticienne bien-être à Perpignan",
  owner: "Béatrice Ribes",
  motto: "Prenez soin de vous, votre harmonie est ma priorité.",
  phone: "07.62.94.79.39",
  phoneHref: "tel:+33762947939",
  /** Adresse email publique de Béa (affichée sur le site). */
  email: null as string | null,
  city: "Perpignan",
  postalCode: "66000",
  addressNote: "Adresse communiquée lors de la prise de rendez-vous",
  instagram: null as string | null,
  facebook: null as string | null,
  /** Domaine définitif du site (sitemap, partages). À remplacer par le vrai domaine. */
  url: process.env.SITE_URL ?? "https://www.lessoinsdebea.fr",
  payment: "Espèces ou carte bancaire",
} as const;

/** Vidéo de présentation (rendue depuis le projet video/, fichiers dans public/videos). */
export const presentationVideo = {
  title: "Les Soins de Béa en 1 minute",
  description:
    "Béatrice, son approche holistique, ses quatre univers de soins (corps, énergie, femmes enceintes et bébés, guidance) et la réservation en ligne, au cabinet de Perpignan.",
  src: "/videos/les-soins-de-bea.mp4",
  poster: "/videos/les-soins-de-bea-vignette.jpg",
  captions: "/videos/les-soins-de-bea.fr.vtt",
  duration: "1 min 20",
  isoDuration: "PT1M21S",
  uploadDate: "2026-11-20",
} as const;

export const nav = [
  { href: "/", label: "Accueil" },
  { href: "/a-propos", label: "À propos" },
  { href: "/soins", label: "Soins" },
  { href: "/formations", label: "Formations" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/temoignages", label: "Témoignages" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;
