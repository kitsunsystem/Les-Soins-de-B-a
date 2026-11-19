"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarHeart, Clock, MapPin, Menu, Phone, X } from "lucide-react";
import { nav, site } from "@/lib/site";
import { Logo } from "./brand";

export function TopBar() {
  return (
    <div className="hidden bg-forest-dark text-[0.8rem] text-linen/85 md:block">
      <div className="container-page flex h-9 items-center justify-between gap-6">
        <p className="flex items-center gap-5">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-gold" aria-hidden />
            Cabinet de soins bien-être à {site.city}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-gold" aria-hidden />
            Sur rendez-vous · réservation en ligne 24 h/24
          </span>
        </p>
        <a href={site.phoneHref} className="flex items-center gap-1.5 font-semibold text-linen hover:text-gold">
          <Phone className="size-3.5" aria-hidden />
          {site.phone}
        </a>
      </div>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={`sticky top-0 z-40 bg-linen/92 backdrop-blur-md transition-shadow duration-300 ${
        scrolled || open ? "shadow-[0_1px_0_var(--color-line),0_10px_30px_-20px_rgb(38_53_46/0.35)]" : ""
      }`}
    >
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-card focus:px-4 focus:py-2"
      >
        Aller au contenu
      </a>
      <div className="mx-auto flex h-18 w-full max-w-[88rem] items-center justify-between gap-4 px-5 md:h-20 md:px-8">
        <Link href="/" onClick={() => setOpen(false)} aria-label={`${site.name} — accueil`}>
          <Logo />
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-0.5 xl:flex">
          {nav.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`relative whitespace-nowrap rounded-full px-3 py-2 text-[0.92rem] font-semibold transition-colors ${
                isActive(item.href) ? "text-forest" : "text-ink-soft hover:text-ink"
              }`}
            >
              {item.label}
              {isActive(item.href) && (
                <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-clay" aria-hidden />
              )}
            </Link>
          ))}
          <Link href="/rendez-vous" className="btn btn-primary ml-4 !px-5 !py-2.5">
            <CalendarHeart className="size-4" aria-hidden />
            Prendre rendez-vous
          </Link>
        </nav>

        <div className="flex items-center gap-2 xl:hidden">
          <Link href="/rendez-vous" className="btn btn-primary !px-4 !py-2 text-[0.85rem] max-sm:hidden">
            Rendez-vous
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border border-line bg-card text-ink"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="menu-mobile" className="h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-line bg-linen xl:hidden">
          <nav aria-label="Navigation mobile" className="container-page flex flex-col py-6">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`border-b border-line/70 py-3.5 font-serif text-[1.65rem] ${
                  isActive(item.href) ? "text-clay" : "text-ink"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/rendez-vous" onClick={() => setOpen(false)} className="btn btn-primary mt-8">
              <CalendarHeart className="size-4" aria-hidden />
              Prendre rendez-vous en ligne
            </Link>
            <a href={site.phoneHref} className="btn btn-outline mt-3">
              <Phone className="size-4" aria-hidden />
              {site.phone}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
