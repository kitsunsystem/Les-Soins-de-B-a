import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarHeart, Info, Phone } from "lucide-react";
import { disclaimer } from "@/lib/content";
import { site } from "@/lib/site";
import { Reveal } from "./Reveal";

export function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-gold ${className}`} aria-hidden>
      <span className="h-px w-12 bg-gold/50" />
      <span className="text-sm">✦</span>
      <span className="h-px w-12 bg-gold/50" />
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "center",
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "center" | "left";
  as?: "h1" | "h2";
}) {
  const center = align === "center";
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag className="mt-2 text-4xl md:text-5xl">{title}</Tag>
      {center && <Ornament className="mt-5" />}
      {intro && <div className="mt-5 text-ink-soft">{intro}</div>}
    </div>
  );
}

/** En-tête des pages intérieures, avec le fond aquarelle du site. */
export function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: ReactNode }) {
  return (
    <section className="relative -mt-18 overflow-hidden pt-18 md:-mt-20 md:pt-20">
      <Image
        src="/images/hero-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-cream/30 via-cream/40 to-cream" />
      <div className="container-page relative py-16 text-center md:py-24">
        <p className="eyebrow animate-fade-up">{eyebrow}</p>
        <h1 className="mt-2 animate-fade-up text-5xl [animation-delay:80ms] md:text-6xl">{title}</h1>
        <Ornament className="mt-6 animate-fade-up [animation-delay:160ms]" />
        {intro && (
          <div className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg text-ink-soft [animation-delay:220ms]">
            {intro}
          </div>
        )}
      </div>
    </section>
  );
}

export function Disclaimer() {
  return (
    <aside className="container-page pb-16">
      <div className="mx-auto flex max-w-4xl gap-4 rounded-2xl border border-line bg-card/70 p-6 text-sm text-ink-soft">
        <Info className="mt-0.5 size-5 shrink-0 text-rose-deep" aria-hidden />
        <div>
          <p className="font-medium text-ink">Information importante</p>
          <p className="mt-1">{disclaimer}</p>
        </div>
      </div>
    </aside>
  );
}

export function CtaBand({
  title = "Offrez-vous un moment de bien-être",
  text = "Choisissez votre soin et votre créneau en ligne en quelques clics, ou appelez-moi directement.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-rose-soft/60">
      <div
        className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-rose/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full bg-sage/25 blur-3xl"
        aria-hidden
      />
      <Reveal className="container-page relative py-20 text-center">
        <p className="eyebrow">Sur rendez-vous uniquement</p>
        <h2 className="mx-auto mt-2 max-w-2xl text-4xl md:text-5xl">{title}</h2>
        <p className="mx-auto mt-5 max-w-xl text-ink-soft">{text}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/rendez-vous" className="btn btn-primary">
            <CalendarHeart className="size-4" aria-hidden />
            Réserver en ligne
          </Link>
          <a href={site.phoneHref} className="btn btn-outline">
            <Phone className="size-4" aria-hidden />
            {site.phone}
          </a>
        </div>
      </Reveal>
    </section>
  );
}

export function Stars() {
  return (
    <p className="tracking-[0.2em] text-gold" aria-label="5 étoiles sur 5">
      ★★★★★
    </p>
  );
}
