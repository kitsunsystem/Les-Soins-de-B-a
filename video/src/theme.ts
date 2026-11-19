import { Easing } from "remotion";

// Palette identique à celle du site (src/app/globals.css, bloc @theme).
export const colors = {
  cream: "#f8f2ec",
  sand: "#f1e7dc",
  card: "#fffcf8",
  ink: "#4a3628",
  inkSoft: "#6b5747",
  rose: "#d9a8a0",
  roseSoft: "#f3e1dc",
  roseDeep: "#a35c52",
  roseDarker: "#8a4b42",
  gold: "#bf9d5f",
  sage: "#93ab9a",
  sageSoft: "#e5ece5",
  line: "#e8dccf",
} as const;

// Mêmes polices que le site.
export const fonts = {
  serif: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
  sans: '"Montserrat", system-ui, sans-serif',
  script: '"Dancing Script", cursive',
} as const;

// Ombres du site (--shadow-soft, --shadow-card), agrandies pour la vidéo.
export const shadows = {
  soft: "0 16px 64px -24px rgba(120, 70, 50, 0.22)",
  card: "0 6px 38px -12px rgba(120, 70, 50, 0.14)",
} as const;

// Courbe des animations d'apparition du site : cubic-bezier(0.16, 1, 0.3, 1).
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

export const FPS = 30;
/** Durée des fondus entre les scènes (la scène sortante s'efface, puis la suivante apparaît). */
export const TRANSITION = 24;
