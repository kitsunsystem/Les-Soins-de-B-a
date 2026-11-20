"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  Globe2,
  Loader2,
  MailCheck,
  MapPin,
  Phone,
  Video,
} from "lucide-react";
import { canBeRemote, categories, getService, modesOf, services, type Service } from "@/lib/content";
import { CategoryBadge } from "./services";
import { site } from "@/lib/site";
import { addDays, daysOfMonth, formatDateStr, formatMonth, parisDateStr, shiftMonth, weekdayOf } from "@/lib/time";

type Step = 1 | 2 | 3 | 4;
type Mode = "cabinet" | "visio" | "telephone";
type Result = { status: string; deposit: number; admissionUrl: string | null };

const MODES: { id: Mode; label: string; hint: string; icon: typeof MapPin }[] = [
  { id: "cabinet", label: "Au cabinet", hint: "À Perpignan", icon: MapPin },
  { id: "visio", label: "En visio", hint: "Depuis chez vous, partout en France", icon: Video },
  { id: "telephone", label: "Par téléphone", hint: "Béatrice vous appelle", icon: Phone },
];
const onSite = (s: Service) => modesOf(s).includes("cabinet");
type Availability = { days: Record<string, string[]>; enabled: boolean; notice: string; maxDaysAhead: number };

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function BookingWizard({ initialServiceId, remote = false }: { initialServiceId?: string; remote?: boolean }) {
  const initial = getService(initialServiceId);
  const [where, setWhere] = useState<"all" | "distance">(remote ? "distance" : "all");
  const [mode, setMode] = useState<Mode>(initial && (!onSite(initial) || (remote && canBeRemote(initial))) ? "visio" : "cabinet");
  const [deposit, setDeposit] = useState<{ amount: number; online: boolean } | null>(null);
  const [step, setStep] = useState<Step>(initial?.durationMinutes ? 2 : 1);
  const [serviceId, setServiceId] = useState<string | null>(initial?.durationMinutes ? initial.id : null);
  const [today] = useState(() => parisDateStr(new Date()));
  const todayMonth = today.slice(0, 7);
  const [month, setMonth] = useState(todayMonth);
  const [nonce, setNonce] = useState(0);
  const [fetched, setFetched] = useState<{ key: string; data: Availability } | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const autoAdvanced = useRef(0);
  const topRef = useRef<HTMLDivElement>(null);

  const service = useMemo(() => (serviceId ? getService(serviceId) : undefined), [serviceId]);
  const key = serviceId ? `${serviceId}|${month}|${nonce}` : null;
  const loading = key !== null && fetched?.key !== key;
  const avail = fetched?.key === key ? fetched.data : null;

  useEffect(() => {
    if (!key || !serviceId) return;
    const ctrl = new AbortController();
    fetch(`/api/disponibilites?soin=${encodeURIComponent(serviceId)}&mois=${month}`, {
      cache: "no-store",
      signal: ctrl.signal,
    })
      .then((res) => res.json() as Promise<Availability>)
      .then((json) => {
        setFetched({ key, data: json });
        // Si le mois est complet, on passe automatiquement au mois suivant (2 fois max).
        if (json.enabled && Object.keys(json.days).length === 0 && autoAdvanced.current < 2) {
          const limit = addDays(parisDateStr(new Date()), json.maxDaysAhead).slice(0, 7);
          if (month < limit) {
            autoAdvanced.current += 1;
            setMonth((m) => shiftMonth(m, 1));
          }
        }
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setFetched({ key, data: { days: {}, enabled: true, notice: "", maxDaysAhead: 60 } });
        setError("Impossible de charger les disponibilités. Vérifiez votre connexion.");
      });
    return () => ctrl.abort();
  }, [key, serviceId, month]);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  function chooseService(s: Service) {
    setServiceId(s.id);
    setMode(!onSite(s) || (where === "distance" && canBeRemote(s)) ? "visio" : "cabinet");
    setDeposit(null);
    setDate(null);
    setTime(null);
    setError(null);
    autoAdvanced.current = 0;
    setMonth(todayMonth);
    setStep(2);
    scrollTop();
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!service || !date || !time) return;
    setError(null);
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const res = await fetch("/api/rendez-vous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          date,
          time,
          firstName: fd.get("firstName"),
          lastName: fd.get("lastName"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          message: fd.get("message") ?? "",
          mode: canBeRemote(service) ? mode : "cabinet",
          acceptDeposit: deposit ? fd.get("acceptDeposit") === "on" : undefined,
          consent: fd.get("consent") === "on",
          website: fd.get("website") ?? "",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setError(json.error);
        setTime(null);
        setStep(2);
        setNonce((n) => n + 1);
        scrollTop();
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "Une erreur est survenue.");
      if (json.depositRequired) {
        // Acompte demandé (annulations répétées) : on l'explique, la personne valide puis renvoie.
        setDeposit({ amount: json.amount, online: json.online });
        requestAnimationFrame(() => document.getElementById("acompte")?.scrollIntoView({ behavior: "smooth", block: "center" }));
        return;
      }
      if (json.paymentUrl) {
        window.location.assign(json.paymentUrl);
        return;
      }
      setResult({ status: json.status, deposit: json.deposit ?? 0, admissionUrl: json.admissionUrl ?? null });
      setStep(4);
      scrollTop();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  const onRequest = services.filter((s) => s.durationMinutes === null);

  return (
    <div ref={topRef} className="scroll-mt-28">
      {step < 4 && <Steps step={step} />}

      {error && step !== 3 && (
        <p role="alert" className="alert-error mx-auto mt-6 max-w-3xl text-center">
          {error}
        </p>
      )}

      {/* Étape 1 : choix du soin */}
      {step === 1 && (
        <div className="mt-10 space-y-10">
          <div className="flex flex-col items-center gap-3">
            <div role="radiogroup" aria-label="Où souhaitez-vous faire la séance ?" className="inline-flex rounded-full bg-card p-1 ring-1 ring-line">
              {(
                [
                  ["all", "Tous les soins", MapPin],
                  ["distance", "À distance (visio / téléphone)", Globe2],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={where === id}
                  onClick={() => setWhere(id)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    where === id ? "bg-forest text-white" : "text-ink-soft hover:text-forest"
                  }`}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
            <p className="max-w-xl text-center text-sm text-ink-soft">
              {where === "distance"
                ? "Guidance, tarot et médiumnité se font aussi bien à distance : depuis chez vous, partout en France."
                : `Soins au cabinet à ${site.city}. Les consultations marquées « aussi à distance » se font en visio ou par téléphone, partout en France.`}
            </p>
          </div>
          {categories.map((c) => {
            const list = services.filter(
              (s) => s.category === c.id && s.durationMinutes !== null && (where === "all" || canBeRemote(s)),
            );
            if (!list.length) return null;
            return (
              <fieldset key={c.id}>
                <legend className="flex items-center gap-3 font-serif text-[1.8rem]">
                  <CategoryBadge category={c} className="size-11" />
                  {c.name}
                </legend>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => chooseService(s)}
                      className={`card flex flex-col items-start p-5 text-left transition-all hover:-translate-y-0.5 hover:border-forest hover:shadow-soft ${
                        serviceId === s.id ? "border-forest ring-2 ring-forest/20" : ""
                      }`}
                    >
                      <span className="font-serif text-xl leading-snug">{s.name}</span>
                      {canBeRemote(s) && (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-lavender-soft px-2.5 py-0.5 text-xs font-semibold text-lavender">
                          <Globe2 className="size-3" aria-hidden />
                          {onSite(s) ? "Aussi à distance" : "À distance"}
                        </span>
                      )}
                      <span className="mt-2 flex w-full items-center justify-between text-sm text-ink-soft">
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5" aria-hidden />
                          {s.durationLabel}
                        </span>
                        <span className="font-serif text-lg text-clay">{s.price}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            );
          })}
          <div className="rounded-2xl border border-dashed border-line bg-card/60 p-6 text-sm text-ink-soft">
            <p className="font-medium text-ink">Sur demande uniquement</p>
            <p className="mt-1">
              {onRequest
                .filter((s) => where === "all" || canBeRemote(s))
                .map((s) => s.name)
                .join(" · ")}{" "}
              : ces prestations se préparent ensemble.{" "}
              <Link href="/contact?objet=rdv" className="text-forest underline">
                Contactez-moi
              </Link>{" "}
              ou appelez le{" "}
              <a href={site.phoneHref} className="text-forest underline">
                {site.phone}
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {/* Étape 2 : date et heure */}
      {step === 2 && service && (
        <div className="mt-10">
          <ServiceSummary service={service} onChange={() => setStep(1)} />
          {avail && !avail.enabled ? (
            <div className="card mt-6 p-8 text-center">
              <p className="font-serif text-2xl">La réservation en ligne est momentanément suspendue.</p>
              {avail.notice && <p className="mt-3 text-ink-soft">{avail.notice}</p>}
              <a href={site.phoneHref} className="btn btn-primary mt-6">
                Appeler le {site.phone}
              </a>
            </div>
          ) : (
            <>
              {avail?.notice && (
                <p className="mt-6 rounded-xl border border-gold/40 bg-card px-4 py-3 text-center text-sm">{avail.notice}</p>
              )}
              <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                <MonthCalendar
                  month={month}
                  today={today}
                  maxDaysAhead={avail?.maxDaysAhead ?? 60}
                  days={avail?.days ?? {}}
                  loading={loading}
                  selected={date}
                  onMonth={(m) => {
                    autoAdvanced.current = 2;
                    setDate(null);
                    setTime(null);
                    setMonth(m);
                  }}
                  onSelect={(d) => {
                    setDate(d);
                    setTime(null);
                  }}
                />
                <TimePicker
                  date={date}
                  times={date ? (avail?.days[date] ?? []) : []}
                  selected={time}
                  onSelect={setTime}
                />
              </div>
              <div className="mt-8 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
                <button type="button" onClick={() => setStep(1)} className="btn btn-outline">
                  <ArrowLeft className="size-4" aria-hidden />
                  Changer de soin
                </button>
                <button
                  type="button"
                  disabled={!date || !time}
                  onClick={() => {
                    setError(null);
                    setStep(3);
                    scrollTop();
                  }}
                  className="btn btn-primary"
                >
                  Continuer
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Étape 3 : coordonnées */}
      {step === 3 && service && date && time && (
        <form onSubmit={submit} className="mx-auto mt-10 grid max-w-4xl gap-6 lg:grid-cols-[1fr_18rem]">
          <div className="card space-y-5 p-6 md:p-8">
            {canBeRemote(service) && (
              <fieldset>
                <legend className="text-3xl">Où se déroule la séance ?</legend>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {MODES.filter((m) => m.id !== "cabinet" || onSite(service)).map((m) => (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer flex-col gap-1 rounded-2xl border p-4 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest/30 ${
                        mode === m.id ? "border-forest bg-sage-soft/60" : "border-line bg-white hover:border-sage"
                      }`}
                    >
                      <input
                        type="radio"
                        name="mode"
                        value={m.id}
                        checked={mode === m.id}
                        onChange={() => setMode(m.id)}
                        className="sr-only"
                      />
                      <m.icon className={`size-5 ${mode === m.id ? "text-forest" : "text-ink-soft"}`} aria-hidden />
                      <span className="font-semibold">{m.label}</span>
                      <span className="text-xs text-ink-soft">{m.hint}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <h2 className="text-3xl">Vos coordonnées</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="b-first" className="label">
                  Prénom <span className="text-forest">*</span>
                </label>
                <input id="b-first" name="firstName" required maxLength={80} autoComplete="given-name" className="field" />
              </div>
              <div>
                <label htmlFor="b-last" className="label">
                  Nom <span className="text-forest">*</span>
                </label>
                <input id="b-last" name="lastName" required maxLength={80} autoComplete="family-name" className="field" />
              </div>
              <div>
                <label htmlFor="b-email" className="label">
                  Email <span className="text-forest">*</span>
                </label>
                <input id="b-email" name="email" type="email" required autoComplete="email" className="field" />
              </div>
              <div>
                <label htmlFor="b-phone" className="label">
                  Téléphone <span className="text-forest">*</span>
                </label>
                <input
                  id="b-phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  pattern="[+0-9][0-9 .\-]{7,}"
                  className="field"
                />
              </div>
            </div>
            <div>
              <label htmlFor="b-message" className="label">
                Message <span className="font-normal text-ink-soft">(facultatif)</span>
              </label>
              <textarea
                id="b-message"
                name="message"
                rows={4}
                maxLength={2000}
                placeholder={
                  mode === "cabinet"
                    ? "Vos attentes, une grossesse en cours, un point de santé à signaler…"
                    : "Vos questions, les thèmes que vous souhaitez aborder…"
                }
                className="field resize-y"
              />
            </div>
            <div className="hidden" aria-hidden>
              <label htmlFor="b-website">Ne pas remplir</label>
              <input id="b-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <label className="flex items-start gap-3 text-sm text-ink-soft">
              <input type="checkbox" name="consent" required className="mt-1 size-4 accent-forest" />
              <span>
                J&apos;accepte que mes informations soient utilisées uniquement pour gérer ce rendez-vous (
                <Link href="/confidentialite" target="_blank" className="underline hover:text-forest">
                  confidentialité
                </Link>
                ) et j&apos;ai pris connaissance des{" "}
                <Link href="/cgv" target="_blank" className="underline hover:text-forest">
                  conditions générales
                </Link>
                .
              </span>
            </label>
            {deposit && (
              <div id="acompte" className="space-y-3 rounded-2xl border border-gold/50 bg-amber-soft/50 p-5 text-sm" role="alert">
                <p className="flex items-center gap-2 font-serif text-xl">
                  <CreditCard className="size-5 text-gold" aria-hidden />
                  Un acompte de {deposit.amount} € est demandé
                </p>
                <p className="text-ink-soft">
                  Plusieurs rendez-vous précédents ayant été annulés ou manqués, un acompte de {deposit.amount} € est
                  demandé pour réserver ce créneau. Il est <strong>déduit du prix de la séance</strong>, et{" "}
                  <strong>n&apos;est pas remboursé en cas d&apos;annulation de votre part</strong> (il l&apos;est si
                  Béatrice annule ou ne peut pas vous recevoir).
                </p>
                <p className="text-ink-soft">
                  {deposit.online
                    ? "Le paiement se fait par carte bancaire sur une page sécurisée (Stripe). Le créneau vous est réservé 30 minutes, le temps du paiement."
                    : "Béatrice vous indiquera comment régler l'acompte : le rendez-vous est validé à sa réception."}
                </p>
                <label className="flex items-start gap-3 font-semibold">
                  <input type="checkbox" name="acceptDeposit" required className="mt-1 size-4 accent-forest" />
                  J&apos;accepte de verser un acompte de {deposit.amount} €, non remboursable si j&apos;annule.
                </label>
              </div>
            )}
            {error && (
              <p role="alert" className="alert-error">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setStep(2)} className="btn btn-outline">
                <ArrowLeft className="size-4" aria-hidden />
                Modifier le créneau
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : deposit?.online ? (
                  <CreditCard className="size-4" aria-hidden />
                ) : (
                  <CalendarCheck className="size-4" aria-hidden />
                )}
                {deposit?.online ? `Payer l'acompte (${deposit.amount} €)` : deposit ? "Réserver avec acompte" : "Envoyer ma demande"}
              </button>
            </div>
          </div>
          <Recap service={service} date={date} time={time} mode={canBeRemote(service) ? mode : "cabinet"} />
        </form>
      )}

      {/* Étape 4 : confirmation */}
      {step === 4 && service && date && time && (
        <div className="card mx-auto mt-4 max-w-2xl p-8 text-center md:p-12" role="status">
          {result?.status === "confirmed" ? (
            <CheckCircle2 className="mx-auto size-14 text-sage" aria-hidden strokeWidth={1.5} />
          ) : (
            <MailCheck className="mx-auto size-14 text-sage" aria-hidden strokeWidth={1.5} />
          )}
          <h2 className="mt-5 text-4xl">
            {result?.status === "confirmed" ? "Votre rendez-vous est confirmé !" : "Demande envoyée, merci !"}
          </h2>
          <p className="mt-4 text-ink-soft">
            {result?.status === "confirmed"
              ? "Vous allez recevoir un email de confirmation avec le rendez-vous à ajouter à votre agenda."
              : "Le créneau est réservé pour vous. Vous allez recevoir un email récapitulatif, puis la confirmation de Béatrice très rapidement."}
          </p>
          <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-sand p-5 text-left text-sm">
            <p className="font-serif text-xl">{service.name}</p>
            <p className="mt-1 first-letter:uppercase">{formatDateStr(date, { year: "numeric" })}</p>
            <p>à {time.replace(":", "h")}</p>
            <p className="mt-1 text-ink-soft">{MODES.find((m) => m.id === (canBeRemote(service) ? mode : "cabinet"))?.label}</p>
          </div>
          {result && result.deposit > 0 && (
            <p className="mx-auto mt-4 max-w-md rounded-2xl bg-amber-soft/60 p-4 text-sm">
              Acompte de {result.deposit} € : Béatrice vous indique comment le régler. Le rendez-vous est validé à sa
              réception.
            </p>
          )}
          {result?.admissionUrl && <AdmissionCta url={result.admissionUrl} />}
          <p className="mt-6 text-xs text-ink-soft">
            Pensez à vérifier vos courriers indésirables. Un empêchement ? Le lien d&apos;annulation figure dans
            l&apos;email.
          </p>
          <Link href="/" className="link-arrow mt-8 inline-block">
            Retour à l&apos;accueil
          </Link>
        </div>
      )}
    </div>
  );
}

function Steps({ step }: { step: Step }) {
  const labels = ["Soin", "Date & heure", "Coordonnées"];
  return (
    <ol className="mx-auto flex max-w-xl items-center justify-between gap-2" aria-label="Étapes de la réservation">
      {labels.map((l, i) => {
        const n = (i + 1) as Step;
        const done = step > n;
        const current = step === n;
        return (
          <li key={l} className="flex flex-1 items-center gap-2" aria-current={current ? "step" : undefined}>
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-medium ${
                current ? "bg-forest text-white" : done ? "bg-sage text-white" : "bg-card text-ink-soft ring-1 ring-line"
              }`}
            >
              {done ? "✓" : n}
            </span>
            <span className={`text-sm ${current ? "font-medium text-ink" : "text-ink-soft"} max-sm:sr-only`}>{l}</span>
            {i < labels.length - 1 && <span className="mx-1 h-px flex-1 bg-line" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function ServiceSummary({ service, onChange }: { service: Service; onChange: () => void }) {
  return (
    <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p className="text-xs uppercase tracking-widest text-ink-soft">Soin choisi</p>
        <p className="font-serif text-2xl">{service.name}</p>
        <p className="text-sm text-ink-soft">
          {service.durationLabel} · {service.price}
        </p>
      </div>
      <button type="button" onClick={onChange} className="link-arrow text-sm">
        Changer
      </button>
    </div>
  );
}

function MonthCalendar({
  month,
  today,
  maxDaysAhead,
  days,
  loading,
  selected,
  onMonth,
  onSelect,
}: {
  month: string;
  today: string;
  maxDaysAhead: number;
  days: Record<string, string[]>;
  loading: boolean;
  selected: string | null;
  onMonth: (m: string) => void;
  onSelect: (d: string) => void;
}) {
  const list = daysOfMonth(month);
  const offset = (weekdayOf(list[0]) + 6) % 7; // lundi en premier
  const todayMonth = today.slice(0, 7);
  const lastMonth = addDays(today, maxDaysAhead).slice(0, 7);
  const count = Object.keys(days).length;

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonth(shiftMonth(month, -1))}
          disabled={month <= todayMonth}
          className="grid size-10 place-items-center rounded-full hover:bg-sand disabled:opacity-30"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p className="font-serif text-2xl" aria-live="polite">
          {formatMonth(month)}
        </p>
        <button
          type="button"
          onClick={() => onMonth(shiftMonth(month, 1))}
          disabled={month >= lastMonth}
          className="grid size-10 place-items-center rounded-full hover:bg-sand disabled:opacity-30"
          aria-label="Mois suivant"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="relative mt-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-wider text-ink-soft" aria-hidden>
          {WEEKDAYS.map((w) => (
            <span key={w} className="py-1">
              {w}
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: offset }, (_, i) => (
            <span key={`e${i}`} />
          ))}
          {list.map((d) => {
            const available = Boolean(days[d]?.length);
            const isSel = selected === d;
            return (
              <button
                key={d}
                type="button"
                disabled={!available}
                onClick={() => onSelect(d)}
                aria-pressed={isSel}
                aria-label={`${formatDateStr(d)}${available ? `, ${days[d].length} créneaux` : ", complet ou fermé"}`}
                className={`relative aspect-square rounded-xl text-sm transition-colors ${
                  isSel
                    ? "bg-forest font-medium text-white"
                    : available
                      ? "bg-sage-soft/70 font-medium text-ink hover:bg-sage hover:text-white"
                      : "text-ink-soft/40"
                } ${d === today && !isSel ? "ring-1 ring-gold" : ""}`}
              >
                {Number(d.slice(8))}
              </button>
            );
          })}
        </div>
        {loading && (
          <div className="absolute inset-0 grid place-items-center rounded-xl bg-card/70">
            <Loader2 className="size-6 animate-spin text-forest" aria-label="Chargement des disponibilités" />
          </div>
        )}
      </div>
      {!loading && count === 0 && (
        <p className="mt-4 text-center text-sm text-ink-soft">
          Aucun créneau disponible ce mois-ci pour ce soin.
          {month < lastMonth && (
            <>
              {" "}
              <button type="button" onClick={() => onMonth(shiftMonth(month, 1))} className="text-forest underline">
                Voir le mois suivant
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function TimePicker({
  date,
  times,
  selected,
  onSelect,
}: {
  date: string | null;
  times: string[];
  selected: string | null;
  onSelect: (t: string) => void;
}) {
  if (!date) {
    return (
      <div className="card grid place-items-center p-8 text-center text-ink-soft">
        <div>
          <CalendarCheck className="mx-auto size-10 text-sage" aria-hidden strokeWidth={1.25} />
          <p className="mt-3">Choisissez un jour en vert dans le calendrier pour voir les horaires disponibles.</p>
        </div>
      </div>
    );
  }
  const groups = [
    { label: "Matin", list: times.filter((t) => t < "12:00") },
    { label: "Après-midi", list: times.filter((t) => t >= "12:00" && t < "18:00") },
    { label: "Soir", list: times.filter((t) => t >= "18:00") },
  ].filter((g) => g.list.length);

  return (
    <div className="card p-5 md:p-6">
      <p className="font-serif text-2xl first-letter:uppercase">{formatDateStr(date)}</p>
      <div className="mt-4 space-y-5">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="text-xs uppercase tracking-widest text-ink-soft">{g.label}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {g.list.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onSelect(t)}
                  aria-pressed={selected === t}
                  className={`rounded-xl border px-2 py-2.5 text-sm transition-colors ${
                    selected === t
                      ? "border-forest bg-forest font-medium text-white"
                      : "border-line bg-white hover:border-forest hover:text-forest"
                  }`}
                >
                  {t.replace(":", "h")}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdmissionCta({ url }: { url: string }) {
  return (
    <div className="mx-auto mt-6 max-w-md rounded-2xl border border-forest/30 bg-forest-soft/60 p-5 text-left">
      <p className="flex items-center gap-2 font-serif text-xl">
        <ClipboardList className="size-5 text-forest" aria-hidden />
        Dernière étape : votre fiche d&apos;admission
      </p>
      <p className="mt-2 text-sm text-ink-soft">
        Quelques questions sur vous et votre santé, pour que la séance soit adaptée et sans risque. 5 minutes, strictement
        confidentiel. Le lien vous est aussi envoyé par email.
      </p>
      <a href={url} className="btn btn-primary mt-4 w-full justify-center">
        Remplir ma fiche maintenant
      </a>
    </div>
  );
}

function Recap({ service, date, time, mode }: { service: Service; date: string; time: string; mode: Mode }) {
  return (
    <aside className="h-fit rounded-[1.25rem] bg-sage-soft p-6 text-sm lg:sticky lg:top-28">
      <p className="text-xs uppercase tracking-widest text-ink-soft">Récapitulatif</p>
      <p className="mt-2 font-serif text-2xl">{service.name}</p>
      <p className="mt-3 first-letter:uppercase">{formatDateStr(date, { year: "numeric" })}</p>
      <p>
        à {time.replace(":", "h")} · {service.durationLabel}
      </p>
      <p className="mt-3 font-serif text-2xl text-clay">{service.price}</p>
      <p className="mt-4 border-t border-sage/40 pt-4 text-xs text-ink-soft">
        {mode === "cabinet" ? (
          <>
            Cabinet à {site.city} — l&apos;adresse exacte vous est communiquée à la confirmation. Règlement sur place :{" "}
            {site.payment.toLowerCase()}.
          </>
        ) : mode === "visio" ? (
          <>En visio, depuis chez vous : Béatrice vous envoie le lien de connexion avant la séance. Les modalités de règlement vous sont précisées lors de la confirmation.</>
        ) : (
          <>Par téléphone : Béatrice vous appelle à l&apos;heure du rendez-vous. Les modalités de règlement vous sont précisées lors de la confirmation.</>
        )}
      </p>
    </aside>
  );
}
