"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MailCheck,
} from "lucide-react";
import { categories, getService, services, type Service } from "@/lib/content";
import { CategoryBadge } from "./services";
import { site } from "@/lib/site";
import { addDays, daysOfMonth, formatDateStr, formatMonth, parisDateStr, shiftMonth, weekdayOf } from "@/lib/time";

type Step = 1 | 2 | 3 | 4;
type Availability = { days: Record<string, string[]>; enabled: boolean; notice: string; maxDaysAhead: number };

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function BookingWizard({ initialServiceId }: { initialServiceId?: string }) {
  const initial = getService(initialServiceId);
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
  const [result, setResult] = useState<{ status: string } | null>(null);
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
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          message: fd.get("message") ?? "",
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
      setResult({ status: json.status });
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
          {categories.map((c) => {
            const list = services.filter((s) => s.category === c.id && s.durationMinutes !== null);
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
              {onRequest.map((s) => s.name).join(" · ")} : ces prestations se préparent ensemble.{" "}
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
            <h2 className="text-3xl">Vos coordonnées</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="b-name" className="label">
                  Nom et prénom <span className="text-forest">*</span>
                </label>
                <input id="b-name" name="name" required minLength={2} maxLength={120} autoComplete="name" className="field" />
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
                placeholder="Vos attentes, une grossesse en cours, un point de santé à signaler…"
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
                {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <CalendarCheck className="size-4" aria-hidden />}
                Envoyer ma demande
              </button>
            </div>
          </div>
          <Recap service={service} date={date} time={time} />
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
          </div>
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

function Recap({ service, date, time }: { service: Service; date: string; time: string }) {
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
        Cabinet à {site.city} — l&apos;adresse exacte vous est communiquée à la confirmation. Règlement sur place :{" "}
        {site.payment.toLowerCase()}.
      </p>
    </aside>
  );
}
