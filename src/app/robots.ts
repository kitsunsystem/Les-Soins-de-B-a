import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/rendez-vous/annulation", "/rendez-vous/acompte", "/fiche-admission"] }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
