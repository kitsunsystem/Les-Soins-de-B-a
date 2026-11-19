import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarHeart, Info, Phone } from "lucide-react";
import { disclaimer } from "@/lib/content";
import { site } from "@/lib/site";
import { Botanical, LogoMark } from "./brand";
import { Reveal } from "./Reveal";

export function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-gold ${className}`} aria-hidden>
      <span className="h-px w-10 bg-gold/50" />
      <LogoMark className="size-5" />
      <span className="h-px w-10 bg-gold/50" />
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "center",
  as: Tag = "h2",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "center" | "left";
  as?: "h1" | "h2";
  className?: string;
}) {
  const center = align === "center";
  return (
    <div className={`${center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag className="mt-3 text-[2.4rem] md:text-[3.1rem]">{title}</Tag>
      {intro && <div className="mt-5 text-lg text-ink-soft">{intro}</div>}
    </div>
  );
}

/** En-tête des pages intérieures. */
export function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-32 -top-40 size-[30rem] rounded-full bg-sage-soft blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 top-10 size-[22rem] rounded-full bg-clay-soft/80 blur-3xl" aria-hidden />
      <Botanical className="pointer-events-none absolute -right-6 bottom-0 hidden h-72 text-forest/15 md:block" />
      <Botanical className="pointer-events-none absolute -left-10 top-6 hidden h-56 -scale-x-100 text-clay/15 lg:block" />
      <div className="container-page relative py-16 text-center md:py-24">
        <p className="eyebrow animate-fade-up">{eyebrow}</p>
        <h1 className="mx-auto mt-4 max-w-3xl animate-fade-up text-[2.7rem] [animation-delay:80ms] md:text-[4rem]">
          {title}
        </h1>
        {intro && (
          <div className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg text-ink-soft [animation-delay:160ms]">{intro}</div>
        )}
        {children && <div className="mt-8 animate-fade-up [animation-delay:220ms]">{children}</div>}
      </div>
    </section>
  );
}

export function Disclaimer() {
  return (
    <aside className="container-page pb-16">
      <div className="mx-auto flex max-w-4xl gap-4 rounded-2xl border border-line bg-card/70 p-6 text-sm text-ink-soft">
        <Info className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden />
        <div>
          <p className="font-bold text-ink">Information importante</p>
          <p className="mt-1">{disclaimer}</p>
        </div>
      </div>
    </aside>
  );
}

export function CtaBand({
  title = "Offrez-vous un moment rien qu'à vous",
  text = "Choisissez votre soin et votre créneau en ligne en moins d'une minute, ou appelez-moi directement.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="container-page py-20">
      <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-forest px-6 py-16 text-center text-linen md:px-16 md:py-20">
        <Botanical className="pointer-events-none absolute -left-8 -top-10 h-72 text-linen/10" />
        <Botanical className="pointer-events-none absolute -bottom-14 -right-6 h-72 rotate-180 text-gold/20" />
        <p className="eyebrow !text-gold">Sur rendez-vous uniquement</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-[2.3rem] !text-linen md:text-[3rem]">{title}</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-linen/80">{text}</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/rendez-vous" className="btn btn-accent">
            <CalendarHeart className="size-4" aria-hidden />
            Réserver en ligne
          </Link>
          <a href={site.phoneHref} className="btn border border-linen/30 text-linen hover:bg-linen/10">
            <Phone className="size-4" aria-hidden />
            {site.phone}
          </a>
        </div>
      </Reveal>
    </section>
  );
}

export function Stars({ className = "" }: { className?: string }) {
  return (
    <span className={`tracking-[0.15em] text-gold ${className}`} aria-label="5 étoiles sur 5">
      ★★★★★
    </span>
  );
}
