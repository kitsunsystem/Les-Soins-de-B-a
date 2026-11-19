import Image from "next/image";
import Link from "next/link";
import { Award, CalendarHeart, HeartHandshake, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CategoryIcon } from "@/components/services";
import { Testimonials } from "@/components/Testimonials";
import { CtaBand, Ornament, SectionHeading } from "@/components/ui";
import { categories, testimonials } from "@/lib/content";
import { site } from "@/lib/site";

const raisons = [
  {
    icon: HeartHandshake,
    title: "Une approche holistique",
    text: "J'intègre le magnétisme, la kinésiologie et la réflexologie dans chaque soin pour un accompagnement complet.",
  },
  {
    icon: Award,
    title: "Une écoute attentive",
    text: "Forte d'un parcours riche dans l'accompagnement de la personne, je mets toute ma bienveillance et mon attention au service de votre sérénité.",
  },
  {
    icon: ShieldCheck,
    title: "Un cadre de confiance",
    text: "Un cabinet chaleureux à Perpignan, où chaque personne est accueillie avec bienveillance et écoute.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Accueil */}
      <section className="relative -mt-18 overflow-hidden md:-mt-20">
        <Image
          src="/images/hero-bg.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/10 via-transparent to-cream" />
        <div className="container-page relative flex min-h-[88dvh] flex-col items-center justify-center pb-16 pt-32 text-center">
          <p className="eyebrow animate-fade-up text-[1.7rem]">Bienvenue</p>
          <h1 className="mt-3 animate-fade-up text-6xl [animation-delay:80ms] sm:text-7xl md:text-8xl">
            Les Soins de Béa
          </h1>
          <p className="mt-6 animate-fade-up text-xs font-medium uppercase tracking-[0.2em] text-ink-soft [animation-delay:160ms] sm:text-sm sm:tracking-[0.3em]">
            Praticienne bien-être à Perpignan
          </p>
          <p className="mt-3 animate-fade-up text-ink-soft italic [animation-delay:200ms]">
            Réflexologie · Kinésiologie · Massages · Magnétisme · Guidance
          </p>
          <Ornament className="mt-8 animate-fade-up [animation-delay:240ms]" />
          <p className="mt-8 max-w-2xl animate-fade-up font-serif text-2xl text-rose-deep italic [animation-delay:280ms] md:text-3xl">
            « {site.motto} »
          </p>
          <div className="mt-10 flex animate-fade-up flex-col gap-3 [animation-delay:340ms] sm:flex-row">
            <Link href="/rendez-vous" className="btn btn-primary">
              <CalendarHeart className="size-4" aria-hidden />
              Prendre rendez-vous
            </Link>
            <Link href="/soins" className="btn btn-outline">
              Découvrir mes soins
            </Link>
          </div>
        </div>
      </section>

      {/* Présentation */}
      <section className="py-20 md:py-28">
        <div className="container-page grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div className="relative mx-auto max-w-md">
              <div className="absolute -inset-4 -rotate-2 rounded-[2rem] bg-rose-soft" aria-hidden />
              <Image
                src="/images/welcome-illustration.webp"
                alt="Illustration aquarelle « les soins de béa » : une femme en méditation au cœur d'un lotus, entourée de feuillages, de pierres et de cartes d'oracle"
                width={1313}
                height={1198}
                sizes="(max-width: 768px) 90vw, 450px"
                className="relative rounded-[1.75rem] shadow-soft"
              />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <p className="eyebrow">Bienvenue dans mon univers</p>
            <h2 className="mt-2 text-4xl md:text-5xl">Une rencontre, un soin, un chemin</h2>
            <p className="mt-6 text-ink-soft">
              Je suis Béatrice, praticienne bien-être à Perpignan. Mon approche est holistique : elle relie le
              corps, l&apos;énergie et l&apos;esprit.
            </p>
            <p className="mt-4 text-ink-soft">
              Je vous accueille dans un cadre doux et apaisant pour un accompagnement personnalisé, à votre rythme
              et à votre écoute, autour de la réflexologie, de la kinésiologie, du magnétisme et de la guidance.
            </p>
            <Link href="/a-propos" className="link-arrow mt-8 inline-block">
              En savoir plus sur moi →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Univers de soins */}
      <section className="bg-sand py-20 md:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="Mon offre" title="Les 4 univers de soins" />
          </Reveal>
          <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={i * 80}>
                <Link
                  href={`/soins#${c.id}`}
                  className="card group flex h-full items-start gap-5 p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
                >
                  <span className="grid size-14 shrink-0 place-items-center rounded-full bg-rose-soft text-rose-deep transition-colors group-hover:bg-rose-deep group-hover:text-white">
                    <CategoryIcon icon={c.icon} />
                  </span>
                  <span>
                    <span className="block font-serif text-[1.65rem] leading-tight">{c.name}</span>
                    <span className="mt-1 block text-sm text-ink-soft">{c.summary}</span>
                    <span className="mt-3 block text-sm font-medium text-rose-deep">Découvrir →</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi me consulter */}
      <section className="py-20 md:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading title="Pourquoi me consulter" />
          </Reveal>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {raisons.map((r, i) => (
              <Reveal key={r.title} delay={i * 100} className="text-center">
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-sage-soft text-ink">
                  <r.icon className="size-6" aria-hidden strokeWidth={1.5} />
                </span>
                <h3 className="mt-5 text-2xl">{r.title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm text-ink-soft">{r.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="bg-sand py-20 md:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="Livre d'or" title="Ce que disent celles et ceux qui m'ont fait confiance" />
          </Reveal>
          <Reveal className="mt-14">
            <Testimonials items={testimonials.slice(0, 3)} showBook={false} />
          </Reveal>
          <p className="mt-10 text-center">
            <Link href="/temoignages" className="link-arrow">
              Lire tous les témoignages →
            </Link>
          </p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
