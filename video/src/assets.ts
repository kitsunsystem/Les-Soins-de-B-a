// Images reprises directement du site (public/images) : une seule source pour le site et la vidéo.
import welcome from "../../public/images/welcome-illustration.jpg";
import zen from "../../public/images/about-hero-zen.webp";
import cabinet1 from "../../public/images/cabinet-1.webp";
import cabinet2 from "../../public/images/cabinet-2.webp";
import cabinet3 from "../../public/images/cabinet-3.webp";

import flammeViolette from "../../public/images/diplomes/flamme-violette.jpg";
import kinesiologie from "../../public/images/diplomes/kinesiologie.jpg";
import lithotherapie from "../../public/images/diplomes/lithotherapie.jpg";
import magnetisme from "../../public/images/diplomes/magnetisme.jpg";
import massageBienEtre from "../../public/images/diplomes/massage-bien-etre.jpg";
import reflexologie from "../../public/images/diplomes/reflexologie.jpg";

export const images = { welcome, zen, cabinet1, cabinet2, cabinet3 };

/** Certificats de Béatrice : scans retouchés (même blanc de papier, éclairage aplani), voir scripts/retoucher-diplomes.py. */
export const diplomes = {
  magnetisme,
  reflexologie,
  "massage-bien-etre": massageBienEtre,
  kinesiologie,
  lithotherapie,
  "flamme-violette": flammeViolette,
};
