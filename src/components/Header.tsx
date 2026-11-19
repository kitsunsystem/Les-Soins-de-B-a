"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarHeart, Menu, Phone, X } from "lucide-react";
import { nav, site } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
      className={`sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
        scrolled || open ? "bg-cream/90 shadow-[0_1px_0_var(--color-line)] backdrop-blur-md" : "bg-cream/0"
      }`}
    >
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-card focus:px-4 focus:py-2"
      >
        Aller au contenu
      </a>
      <div className="mx-auto flex h-18 w-full max-w-[88rem] items-center justify-between gap-4 px-5 md:h-20 md:px-8">
        <Link href="/" className="group flex flex-col leading-none" onClick={() => setOpen(false)}>
          <span className="whitespace-nowrap font-serif text-[1.65rem] text-ink md:text-[1.8rem]">{site.name}</span>
          <span className="mt-1 whitespace-nowrap font-script text-[1.05rem] text-rose-deep">{site.tagline}</span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-0.5 xl:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-2.5 py-2 text-[0.84rem] tracking-wide transition-colors ${
                isActive(item.href) ? "text-rose-deep" : "text-ink-soft hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/rendez-vous" className="btn btn-primary ml-3 whitespace-nowrap !px-5 !py-2.5">
            <CalendarHeart className="size-4" aria-hidden />
            Prendre rendez-vous
          </Link>
        </nav>

        <div className="flex items-center gap-2 xl:hidden">
          <Link href="/rendez-vous" className="btn btn-primary !px-4 !py-2 text-[0.8rem] max-sm:hidden">
            Rendez-vous
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border border-line bg-card/70 text-ink"
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
        <div id="menu-mobile" className="h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-line bg-cream xl:hidden">
          <nav aria-label="Navigation mobile" className="container-page flex flex-col py-6">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`border-b border-line/70 py-3.5 font-serif text-2xl ${
                  isActive(item.href) ? "text-rose-deep" : "text-ink"
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
