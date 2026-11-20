import { Easing } from "remotion";
import type { CategoryId } from "../../src/lib/content";

// Palette identique au site (src/app/globals.css, bloc @theme) :
// eucalyptus (calme, nature) · terracotta (chaleur, toucher) · lin (douceur) · or (énergie).
export const colors = {
  linen: "#f8f4ee",
  sand: "#f0e8dd",
  card: "#fffdf9",
  line: "#e6ddd0",
  ink: "#26352e",
  inkSoft: "#56655d",
  forest: "#345445",
  forestDark: "#24392f",
  forestSoft: "#dde7df",
  sage: "#9fb5a2",
  sageSoft: "#e6eee6",
  clay: "#b4694a",
  clayDark: "#8c4a32",
  claySoft: "#f5e4d9",
  gold: "#c29a4f",
  amberSoft: "#f7ecd6",
  blush: "#e3b7ab",
  blushSoft: "#f8e7e2",
  lavender: "#7d6aa3",
  lavenderSoft: "#ece7f4",
} as const;

/** Une couleur par univers de soins (src/components/services.tsx, `tones`). */
export const tones: Record<CategoryId, { soft: string; text: string; solid: string; rgbSoft: string }> = {
  corps: { soft: colors.sageSoft, text: colors.forest, solid: colors.forest, rgbSoft: "230, 238, 230" },
  energetique: { soft: colors.amberSoft, text: "#87601c", solid: "#87601c", rgbSoft: "247, 236, 214" },
  "femmes-bebes": { soft: colors.blushSoft, text: colors.clayDark, solid: colors.clay, rgbSoft: "248, 231, 226" },
  guidance: { soft: colors.lavenderSoft, text: colors.lavender, solid: colors.lavender, rgbSoft: "236, 231, 244" },
};

// Mêmes polices que le site : Fraunces « soft » pour les titres, Nunito Sans pour le texte.
export const fonts = {
  serif: '"Fraunces Variable", Georgia, serif',
  sans: '"Nunito Sans Variable", system-ui, sans-serif',
} as const;

/** Réglages des titres du site (h1–h4) : graisse 420, axe « SOFT » au maximum, léger resserrement. */
export const titre = {
  fontFamily: fonts.serif,
  fontWeight: 420,
  fontVariationSettings: '"SOFT" 100',
  letterSpacing: "-0.015em",
  lineHeight: 1.12,
} as const;

// Ombres du site (--shadow-soft, --shadow-card), agrandies pour la vidéo.
export const shadows = {
  soft: "0 28px 78px -36px rgba(38, 53, 46, 0.38)",
  card: "0 10px 44px -20px rgba(38, 53, 46, 0.26)",
} as const;

// Courbe des apparitions du site : cubic-bezier(0.16, 1, 0.3, 1).
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

export const FPS = 30;
/** Durée (images) du fondu de sortie d'une scène puis de celui d'entrée de la suivante. */
export const FONDU = 7;
