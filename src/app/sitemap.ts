import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const pages = [
  ["", 1],
  ["/soins", 0.9],
  ["/rendez-vous", 0.9],
  ["/tarifs", 0.8],
  ["/a-propos", 0.8],
  ["/temoignages", 0.7],
  ["/formations", 0.6],
  ["/faq", 0.6],
  ["/contact", 0.7],
  ["/mentions-legales", 0.2],
  ["/confidentialite", 0.2],
  ["/cgv", 0.2],
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(([path, priority]) => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly",
    priority,
  }));
}
