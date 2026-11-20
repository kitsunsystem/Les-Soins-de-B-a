import Link from "next/link";
import { CalendarHeart, Mail, MapPin, Phone } from "lucide-react";
import { categories } from "@/lib/content";
import { nav, site } from "@/lib/site";
import { Botanical, Logo } from "./brand";

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-forest-dark text-linen/80">
      <Botanical className="pointer-events-none absolute -right-10 -top-6 h-80 text-linen/[0.07]" />
      <div className="container-page relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo inverted />
          <p className="mt-5 max-w-xs font-serif text-lg italic text-linen/90">« {site.motto} »</p>
          <Link href="/rendez-vous" className="btn btn-light mt-7 !py-2.5 text-sm">
            <CalendarHeart className="size-4" aria-hidden />
            Prendre rendez-vous
          </Link>
        </div>

        <nav aria-label="Les soins">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Les soins</p>
          <ul className="mt-5 space-y-2.5 text-[0.95rem]">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/soins#${c.id}`} className="hover:text-linen">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/tarifs" className="hover:text-linen">
                Tarifs & cartes cadeaux
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Plan du site">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Le cabinet</p>
          <ul className="mt-5 space-y-2.5 text-[0.95rem]">
            {nav
              .filter((n) => !["/soins", "/tarifs"].includes(n.href))
              .map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-linen">
                    {item.label}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Contact</p>
          <ul className="mt-5 space-y-3.5 text-[0.95rem]">
            <li>
              <a href={site.phoneHref} className="flex items-center gap-3 font-semibold text-linen hover:text-gold">
                <Phone className="size-4 text-gold" aria-hidden />
                {site.phone}
              </a>
            </li>
            {site.email && (
              <li>
                <a href={`mailto:${site.email}`} className="flex items-center gap-3 hover:text-linen">
                  <Mail className="size-4 text-gold" aria-hidden />
                  {site.email}
                </a>
              </li>
            )}
            <li className="flex items-start gap-3">
              <MapPin className="mt-1 size-4 shrink-0 text-gold" aria-hidden />
              <span>
                Cabinet à {site.city}, sur rendez-vous · et partout en France à distance
                <br />
                <span className="text-sm text-linen/60">{site.addressNote}</span>
              </span>
            </li>
          </ul>
          {(site.instagram || site.facebook) && (
            <div className="mt-5 flex gap-4 text-sm">
              {site.instagram && (
                <a href={site.instagram} className="underline underline-offset-4 hover:text-linen" rel="noopener" target="_blank">
                  Instagram
                </a>
              )}
              {site.facebook && (
                <a href={site.facebook} className="underline underline-offset-4 hover:text-linen" rel="noopener" target="_blank">
                  Facebook
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="relative border-t border-linen/10">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-linen/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name} — {site.owner}, entrepreneuse individuelle. Pratiques de bien-être,
            non médicales.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            <li>
              <Link href="/mentions-legales" className="hover:text-linen">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link href="/confidentialite" className="hover:text-linen">
                Confidentialité
              </Link>
            </li>
            <li>
              <Link href="/cgv" className="hover:text-linen">
                Conditions générales
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
