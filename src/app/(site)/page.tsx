import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck, CalendarHeart, CreditCard, HandHeart, MailCheck, MapPin, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { Botanical } from "@/components/brand";
import { NextSlot } from "@/components/NextSlot";
import { Reveal } from "@/components/Reveal";
import { CategoryBadge, ServiceLine, tones } from "@/components/services";
import { Testimonials } from "@/components/Testimonials";
import { CtaBand, SectionHeading, Stars } from "@/components/ui";
import { categories, faq, getService, parcours, popularServiceIds, servicesByCategory, testimonials } from "@/lib/content";
import { site } from "@/lib/site";

const popular = popularServiceIds.map((id) => getService(id)!).filter(Boolean);

const steps = [
  {
    icon: CalendarCheck,
    title: "Je réserve en ligne",
    text: "Je choisis mon soin et un créneau libre dans l'agenda, 24 h/24. Pas besoin de créer de compte.",
  },
  {
    icon: MailCheck,
    title: "Béatrice confirme",
    text: "Je reçois un email récapitulatif, puis la confirmation avec le rendez-vous à ajouter à mon agenda.",
  },
  {
    icon: HandHeart,
    title: "Je prends soin de moi",
    text: "Un échange pour cerner mes besoins, puis le soin dans un cadre apaisant. Règlement sur place, espèces ou carte.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ——— Accueil : on comprend tout de suite ——— */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 -top-40 size-[34rem] rounded-full bg-sage-soft blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-32 top-40 size-[28rem] rounded-full bg-clay-soft/70 blur-3xl" aria-hidden />
        <div className="container-page relative grid items-center gap-14 pb-20 pt-10 md:pt-16 lg:grid-cols-[1.08fr_1fr] lg:gap-10 lg:pb-28">
          <div>
            <p className="eyebrow animate-fade-up">Praticienne bien-être · {site.city}</p>
            <h1 className="mt-5 animate-fade-up text-[2.75rem] [animation-delay:60ms] sm:text-[3.4rem] lg:text-[4.1rem]">
              Réflexologie, massages <span className="accent">&amp; magnétisme</span> à Perpignan
            </h1>
            <p className="mt-6 max-w-xl animate-fade-up text-lg text-ink-soft [animation-delay:120ms] md:text-xl">
              Béatrice vous reçoit dans son cabinet pour des soins sur mesure qui{" "}
              <strong className="font-semibold text-ink">apaisent le corps, libèrent les tensions et rééquilibrent l&apos;énergie</strong>.
              Pour les femmes enceintes et les bébés aussi.
            </p>
            <div className="mt-9 flex animate-fade-up flex-col gap-3 [animation-delay:180ms] sm:flex-row">
              <Link href="/rendez-vous" className="btn btn-primary !px-7 !py-4 text-base">
                <CalendarHeart className="size-5" aria-hidden />
                Prendre rendez-vous
              </Link>
              <Link href="/soins" className="btn btn-outline !px-7 !py-4 text-base">
                Voir les soins & tarifs
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <ul className="mt-10 grid animate-fade-up grid-cols-1 gap-4 text-sm [animation-delay:240ms] sm:grid-cols-3">
              <li className="flex items-center gap-3">
                <Stars className="text-base" />
                <span className="leading-tight text-ink-soft">
                  <strong className="block text-ink">5/5</strong>au livre d&apos;or
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="font-serif text-2xl leading-none text-clay">25 €</span>
                <span className="leading-tight text-ink-soft">
                  <strong className="block text-ink">Séances dès</strong>30 min
                </span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="size-5 text-forest" aria-hidden />
                <span className="leading-tight text-ink-soft">
                  <strong className="block text-ink">Cabinet</strong>à {site.city}
                </span>
              </li>
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative ml-auto aspect-[4/5] w-[86%] overflow-hidden arch shadow-soft">
              <Image
                src="/images/about-hero-zen.webp"
                alt="Bougie, galets empilés et fleurs : l'ambiance douce du cabinet"
                fill
                priority
                sizes="(max-width: 1024px) 80vw, 480px"
                className="object-cover"
              />
            </div>
            <div className="absolute -left-2 bottom-24 hidden aspect-square w-44 overflow-hidden rounded-full border-[6px] border-linen shadow-soft sm:block md:w-52">
              <Image
                src="/images/welcome-illustration.webp"
                alt="Illustration aquarelle des soins de Béa : lotus, mains, pierres et cartes"
                fill
                sizes="210px"
                className="object-cover object-[50%_60%]"
              />
            </div>
            <NextSlot className="absolute -bottom-5 left-4 right-4 animate-float sm:left-auto sm:right-2" />
            <Botanical className="pointer-events-none absolute -right-8 -top-8 h-44 text-forest/25" />
          </div>
        </div>
      </section>

      {/* ——— Les soins les plus demandés ——— */}
      <section className="border-y border-line bg-card/60">
        <div className="container-page py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <p className="shrink-0 font-serif text-2xl lg:w-48">Les plus demandés</p>
            <ul className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {popular.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/rendez-vous?soin=${s.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-line bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-forest hover:shadow-card"
                  >
                    <span className="font-bold leading-snug">{s.name}</span>
                    <span className="mt-auto flex items-end justify-between pt-3">
                      <span className="text-sm text-ink-soft">{s.durationLabel}</span>
                      <span className="font-serif text-2xl leading-none text-clay">{s.price}</span>
                    </span>
                    <span className="mt-3 flex items-center gap-1 text-sm font-bold text-forest">
                      Réserver
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ——— Les 4 univers ——— */}
      <section className="py-20 md:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Mon offre"
              title={
                <>
                  Quatre univers de soins, <span className="accent">une même attention</span>
                </>
              }
              intro="Chaque séance est adaptée à vos besoins du moment. Le magnétisme accompagne naturellement chacun de mes soins."
            />
          </Reveal>
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {categories.map((c, i) => {
              const t = tones[c.id];
              const list = servicesByCategory(c.id);
              return (
                <Reveal key={c.id} delay={(i % 2) * 90} className="card flex flex-col overflow-hidden p-0">
                  <div className={`flex items-start gap-4 p-7 pb-5 ${t.soft}`}>
                    <CategoryBadge category={c} className="size-14 !bg-card" />
                    <div>
                      <h3 className="text-[1.7rem]">{c.name}</h3>
                      <p className="mt-1 text-[0.95rem] text-ink-soft">
                        <span className={`font-bold ${t.text}`}>Idéal pour</span> {c.idealFor}.
                      </p>
                    </div>
                  </div>
                  <ul className="flex-1 px-7 pt-3">
                    {list.slice(0, 5).map((s) => (
                      <ServiceLine key={s.id} service={s} />
                    ))}
                  </ul>
                  <div className="px-7 pb-6 pt-3">
                    <Link href={`/soins#${c.id}`} className="link-arrow text-sm">
                      {list.length > 5 ? `Voir les ${list.length} soins` : "Découvrir cet univers"} →
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ——— Comment ça se passe ——— */}
      <section className="bg-sand py-20 md:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="En toute simplicité" title="Votre séance en 3 étapes" />
          </Reveal>
          <ol className="relative mt-14 grid gap-6 md:grid-cols-3">
            <span className="absolute left-[16%] right-[16%] top-10 hidden h-px border-t border-dashed border-forest/30 md:block" aria-hidden />
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 110} className="relative text-center">
                <span className="relative mx-auto grid size-20 place-items-center rounded-full bg-card text-forest shadow-card">
                  <s.icon className="size-8" aria-hidden strokeWidth={1.5} />
                  <span className="absolute -right-1 -top-1 grid size-7 place-items-center rounded-full bg-clay text-sm font-bold text-white">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-6 text-2xl">{s.title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-ink-soft">{s.text}</p>
              </Reveal>
            ))}
          </ol>
          <p className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-soft">
            <span className="flex items-center gap-2">
              <CreditCard className="size-4 text-forest" aria-hidden /> Espèces ou carte bancaire
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-forest" aria-hidden /> Annulation gratuite jusqu&apos;à 24 h avant
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-forest" aria-hidden /> Cartes cadeaux disponibles
            </span>
          </p>
        </div>
      </section>

      {/* ——— Qui suis-je ——— */}
      <section className="overflow-x-clip py-20 md:py-28">
        <div className="container-page grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-3 rotate-[-3deg] rounded-[2.2rem] bg-clay-soft" aria-hidden />
            <Image
              src="/images/welcome-illustration.webp"
              alt="Illustration aquarelle « les soins de béa » : une femme en méditation au cœur d'un lotus, entourée de feuillages, de pierres et de cartes d'oracle"
              width={1000}
              height={913}
              sizes="(max-width: 1024px) 90vw, 450px"
              className="relative rounded-[2rem] shadow-soft"
            />
          </Reveal>
          <Reveal delay={100}>
            <p className="eyebrow">Qui suis-je ?</p>
            <h2 className="mt-3 text-[2.4rem] md:text-[3rem]">
              Béatrice, <span className="accent">à l&apos;écoute de votre équilibre</span>
            </h2>
            <p className="mt-6 text-lg text-ink-soft">
              J&apos;ai consacré une grande partie de ma vie à l&apos;accompagnement de la personne. Sensible aux énergies
              depuis l&apos;adolescence, j&apos;ai fait du magnétisme le cœur de ma pratique, que j&apos;enrichis de
              réflexologie, de kinésiologie et de massages bien-être.
            </p>
            <p className="mt-4 text-lg text-ink-soft">
              Mon approche est holistique : elle relie le corps, l&apos;énergie et l&apos;esprit, à votre rythme et dans
              le respect de chacun.
            </p>
            <ul className="mt-7 flex flex-wrap gap-2">
              {parcours.map((f) => (
                <li key={f.title} className="rounded-full border border-line bg-card px-3.5 py-1.5 text-sm font-semibold text-ink-soft">
                  {f.title.replace("Formation en ", "").replace("Formation ", "")}
                </li>
              ))}
            </ul>
            <Link href="/a-propos" className="link-arrow mt-8 inline-block">
              Mon parcours et mon cabinet →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ——— Témoignages ——— */}
      <section className="bg-sand py-20 md:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Livre d'or"
              title={
                <>
                  Elles en parlent <span className="accent">mieux que moi</span>
                </>
              }
              intro={
                <>
                  <Stars className="mr-2" /> Des mots écrits à la main dans mon livre d&apos;or, après leur séance.
                </>
              }
            />
          </Reveal>
          <Reveal className="mt-14">
            <Testimonials items={testimonials.slice(0, 3)} showBook={false} />
          </Reveal>
          <p className="mt-4 text-center">
            <Link href="/temoignages" className="link-arrow">
              Lire les {testimonials.length} témoignages →
            </Link>
          </p>
        </div>
      </section>

      {/* ——— Questions fréquentes ——— */}
      <section className="py-20 md:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow="Questions fréquentes"
              title="Vous vous demandez peut-être…"
              intro={
                <>
                  Une autre question ?{" "}
                  <Link href="/contact" className="link-arrow">
                    Écrivez-moi
                  </Link>{" "}
                  ou appelez le{" "}
                  <a href={site.phoneHref} className="link-arrow whitespace-nowrap">
                    {site.phone}
                  </a>
                  .
                </>
              }
            />
          </Reveal>
          <Reveal delay={80} className="space-y-3">
            {faq.slice(0, 5).map((f) => (
              <details key={f.q} className="card group p-0 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-serif text-[1.2rem]">
                  {f.q}
                  <Plus className="size-5 shrink-0 text-clay transition-transform duration-300 group-open:rotate-45" aria-hidden />
                </summary>
                <p className="px-6 pb-6 text-ink-soft">{f.a}</p>
              </details>
            ))}
            <Link href="/faq" className="link-arrow inline-block pt-2 text-sm">
              Toutes les questions →
            </Link>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
