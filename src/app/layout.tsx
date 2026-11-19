import type { Metadata, Viewport } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/dancing-script/500.css";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Les Soins de Béa — Réflexologie, massages & magnétisme à Perpignan",
    template: "%s · Les Soins de Béa",
  },
  description:
    "Béatrice, praticienne bien-être à Perpignan : réflexologie, kinésiologie, massages, magnétisme et guidance. Prise de rendez-vous en ligne.",
  applicationName: site.name,
  authors: [{ name: site.owner }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: site.name,
    title: "Les Soins de Béa — Praticienne bien-être à Perpignan",
    description: site.motto,
    images: [{ url: "/images/welcome-illustration.jpg", width: 1313, height: 1198, alt: "Les Soins de Béa" }],
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: "#f8f2ec",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Active les animations d'apparition uniquement si JavaScript est disponible. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
