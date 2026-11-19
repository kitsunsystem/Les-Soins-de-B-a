// Configuration Remotion (rendu de la vidéo de présentation).
// Doc : https://www.remotion.dev/docs/config
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
// Qualité élevée : les dégradés pastel du site supportent mal une compression trop forte.
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
// Couleurs BT.709 en plage standard, correctement étiquetées : rendu fidèle sur les réseaux sociaux et lecteurs.
Config.setColorSpace("bt709");
Config.setOverwriteOutput(true);
