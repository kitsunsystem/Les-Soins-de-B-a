import Link from "next/link";
import { CalendarHeart, Mail, MapPin, Phone } from "lucide-react";
import { nav, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-sand">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.3fr_1fr_1.2fr]">
        <div>
          <p className="font-serif text-3xl">{site.name}</p>
          <p className="mt-1 font-script text-xl text-rose-deep">{site.tagline}</p>
          <p className="mt-4 max-w-xs text-sm text-ink-soft">{site.motto}</p>
          <Link href="/rendez-vous" className="btn btn-primary mt-6 !py-2.5 text-sm">
            <CalendarHeart className="size-4" aria-hidden />
            Prendre rendez-vous
          </Link>
        </div>

        <nav aria-label="Plan du site">
          <p className="font-serif text-xl">Navigation</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-ink-soft">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-rose-deep">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/rendez-vous" className="hover:text-rose-deep">
                Rendez-vous
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="font-serif text-xl">Contact</p>
          <ul className="mt-4 space-y-3 text-sm text-ink-soft">
            <li>
              <a href={site.phoneHref} className="flex items-center gap-3 hover:text-rose-deep">
                <Phone className="size-4 text-rose-deep" aria-hidden />
                {site.phone}
              </a>
            </li>
            {site.email && (
              <li>
                <a href={`mailto:${site.email}`} className="flex items-center gap-3 hover:text-rose-deep">
                  <Mail className="size-4 text-rose-deep" aria-hidden />
                  {site.email}
                </a>
              </li>
            )}
            <li className="flex items-start gap-3">
              <MapPin className="mt-1 size-4 shrink-0 text-rose-deep" aria-hidden />
              <span>
                Cabinet à {site.city} — sur rendez-vous uniquement
                <br />
                <span className="text-xs">{site.addressNote}</span>
              </span>
            </li>
          </ul>
          {(site.instagram || site.facebook) && (
            <div className="mt-5 flex gap-3 text-sm">
              {site.instagram && (
                <a href={site.instagram} className="link-arrow" rel="noopener" target="_blank">
                  Instagram
                </a>
              )}
              {site.facebook && (
                <a href={site.facebook} className="link-arrow" rel="noopener" target="_blank">
                  Facebook
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-line/80">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-ink-soft md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name} — {site.owner}, entrepreneuse individuelle
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            <li>
              <Link href="/mentions-legales" className="hover:text-rose-deep">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link href="/confidentialite" className="hover:text-rose-deep">
                Confidentialité
              </Link>
            </li>
            <li>
              <Link href="/cgv" className="hover:text-rose-deep">
                Conditions générales
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
