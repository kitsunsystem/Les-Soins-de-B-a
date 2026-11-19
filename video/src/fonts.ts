// Polices auto-hébergées identiques au site (paquets @fontsource), chargées avant le rendu.
import { loadFont } from "@remotion/fonts";
import cormorant400 from "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2";
import cormorant500 from "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2";
import cormorant400Italic from "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff2";
import cormorant500Italic from "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2";
import montserrat400 from "@fontsource/montserrat/files/montserrat-latin-400-normal.woff2";
import montserrat500 from "@fontsource/montserrat/files/montserrat-latin-500-normal.woff2";
import montserrat600 from "@fontsource/montserrat/files/montserrat-latin-600-normal.woff2";
import montserrat400Italic from "@fontsource/montserrat/files/montserrat-latin-400-italic.woff2";
import dancing500 from "@fontsource/dancing-script/files/dancing-script-latin-500-normal.woff2";
import dancing600 from "@fontsource/dancing-script/files/dancing-script-latin-600-normal.woff2";

const faces = [
  { family: "Cormorant Garamond", url: cormorant400, weight: "400", style: "normal" },
  { family: "Cormorant Garamond", url: cormorant500, weight: "500", style: "normal" },
  { family: "Cormorant Garamond", url: cormorant400Italic, weight: "400", style: "italic" },
  { family: "Cormorant Garamond", url: cormorant500Italic, weight: "500", style: "italic" },
  { family: "Montserrat", url: montserrat400, weight: "400", style: "normal" },
  { family: "Montserrat", url: montserrat500, weight: "500", style: "normal" },
  { family: "Montserrat", url: montserrat600, weight: "600", style: "normal" },
  { family: "Montserrat", url: montserrat400Italic, weight: "400", style: "italic" },
  { family: "Dancing Script", url: dancing500, weight: "500", style: "normal" },
  { family: "Dancing Script", url: dancing600, weight: "600", style: "normal" },
];

let started = false;

export function loadFonts() {
  if (started) return;
  started = true;
  for (const face of faces) {
    loadFont({ ...face, format: "woff2" });
  }
}
