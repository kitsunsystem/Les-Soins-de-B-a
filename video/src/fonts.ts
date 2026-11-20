// Polices variables auto-hébergées, identiques au site (paquets @fontsource-variable), chargées avant le rendu.
import { loadFont } from "@remotion/fonts";
import frauncesItalic from "@fontsource-variable/fraunces/files/fraunces-latin-soft-italic.woff2";
import fraunces from "@fontsource-variable/fraunces/files/fraunces-latin-soft-normal.woff2";
import nunitoItalic from "@fontsource-variable/nunito-sans/files/nunito-sans-latin-wght-italic.woff2";
import nunito from "@fontsource-variable/nunito-sans/files/nunito-sans-latin-wght-normal.woff2";

const faces = [
  { family: "Fraunces Variable", url: fraunces, weight: "100 900", style: "normal" },
  { family: "Fraunces Variable", url: frauncesItalic, weight: "100 900", style: "italic" },
  { family: "Nunito Sans Variable", url: nunito, weight: "200 1000", style: "normal" },
  { family: "Nunito Sans Variable", url: nunitoItalic, weight: "200 1000", style: "italic" },
];

let started = false;

export function loadFonts() {
  if (started) return;
  started = true;
  for (const face of faces) {
    loadFont({ ...face, format: "woff2" });
  }
}
