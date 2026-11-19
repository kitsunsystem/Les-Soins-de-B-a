import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { site } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HealthAndBeautyBusiness",
  name: site.name,
  description:
    "Praticienne bien-être à Perpignan : réflexologie, kinésiologie, massages, magnétisme et guidance spirituelle.",
  url: site.url,
  telephone: "+33762947939",
  image: `${site.url}/images/welcome-illustration.jpg`,
  founder: { "@type": "Person", name: site.owner },
  address: { "@type": "PostalAddress", addressLocality: site.city, postalCode: site.postalCode, addressCountry: "FR" },
  areaServed: "Perpignan",
  paymentAccepted: "Cash, Credit Card",
  priceRange: "25 € - 70 €",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
