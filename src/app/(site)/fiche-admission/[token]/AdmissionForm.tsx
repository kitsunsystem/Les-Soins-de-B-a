"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import {
  beforeSigning,
  consentStatements,
  healthQuestions,
  interestOptions,
  vigilanceOptions,
} from "@/lib/admission";
import { submitAdmission } from "./actions";

type Prefill = {
  lastName: string;
  firstName: string;
  birthdate: string;
  phone: string;
  email: string;
  address: string;
  profession: string;
  howFound: string;
};

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="card space-y-5 p-6 md:p-8">
      <legend className="sr-only">{title}</legend>
      <h2 aria-hidden className="flex items-center gap-3 text-[1.7rem]">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-forest font-sans text-base font-bold text-white">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </fieldset>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
  required,
  autoComplete,
  className = "",
  max,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  max?: number;
}) {
  return (
    <div className={className}>
      <label htmlFor={`a-${name}`} className="label">
        {label} {required && <span className="text-forest">*</span>}
      </label>
      <input
        id={`a-${name}`}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        maxLength={max}
        className="field"
      />
    </div>
  );
}

function Area({ name, label, hint, rows = 3 }: { name: string; label: string; hint?: string; rows?: number }) {
  return (
    <div>
      <label htmlFor={`a-${name}`} className="label">
        {label}
      </label>
      {hint && <p className="-mt-1 mb-1.5 text-xs text-ink-soft">{hint}</p>}
      <textarea id={`a-${name}`} name={name} rows={rows} maxLength={3000} className="field resize-y" />
    </div>
  );
}

export function AdmissionForm({ token, prefill, update }: { token: string; prefill: Prefill; update: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [yes, setYes] = useState<Record<string, boolean>>({});
  const [none, setNone] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      lastName: str(fd, "lastName"),
      firstName: str(fd, "firstName"),
      birthdate: str(fd, "birthdate"),
      phone: str(fd, "phone"),
      email: str(fd, "email"),
      address: str(fd, "address"),
      profession: str(fd, "profession"),
      howFound: str(fd, "howFound"),
      interests: fd.getAll("interests").map(String),
      reason: str(fd, "reason"),
      since: str(fd, "since"),
      consultedBefore: str(fd, "consultedBefore"),
      expectations: str(fd, "expectations"),
      lifestyle: str(fd, "lifestyle"),
      health: Object.fromEntries(
        healthQuestions.map((q) => [q.key, { answer: str(fd, `h-${q.key}`), detail: str(fd, `h-${q.key}-detail`) }]),
      ),
      vigilance: fd.getAll("vigilance").map(String),
      noVigilance: fd.get("noVigilance") === "on",
      otherInfo: str(fd, "otherInfo"),
      place: str(fd, "place"),
      consents: Object.fromEntries(consentStatements.map((c) => [c.key, fd.get(`c-${c.key}`) === "on"])),
    };
    setError(null);
    setPending(true);
    try {
      const res = await submitAdmission(token, data);
      if (res.error) setError(res.error);
      else setDone(true);
    } catch {
      setError("L'envoi n'a pas abouti. Vérifiez votre connexion et réessayez.");
    } finally {
      setPending(false);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (done) {
    return (
      <div ref={topRef} className="card mt-10 scroll-mt-28 p-8 text-center md:p-12" role="status">
        <CheckCircle2 className="mx-auto size-14 text-sage" aria-hidden strokeWidth={1.5} />
        <h2 className="mt-5 text-4xl">Merci, votre fiche est enregistrée</h2>
        <p className="mx-auto mt-4 max-w-md text-ink-soft">
          Béatrice en prendra connaissance avant votre séance. Si votre état de santé change d&apos;ici là, pensez à le
          lui signaler.
        </p>
        <Link href="/" className="link-arrow mt-8 inline-block">
          Retour au site
        </Link>
      </div>
    );
  }

  return (
    <div ref={topRef} className="scroll-mt-28">
      {error && (
        <p role="alert" className="alert-error mt-8">
          {error}
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <Section n={1} title="Vos coordonnées">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="lastName" label="Nom" defaultValue={prefill.lastName} required autoComplete="family-name" max={80} />
            <Field name="firstName" label="Prénom" defaultValue={prefill.firstName} required autoComplete="given-name" max={80} />
            <Field name="birthdate" label="Date de naissance" type="date" defaultValue={prefill.birthdate} autoComplete="bday" />
            <Field name="phone" label="Téléphone" type="tel" defaultValue={prefill.phone} autoComplete="tel" max={30} />
            <Field name="email" label="Email" type="email" defaultValue={prefill.email} autoComplete="email" className="sm:col-span-2" />
            <Field name="address" label="Adresse" defaultValue={prefill.address} autoComplete="street-address" className="sm:col-span-2" max={300} />
            <Field name="profession" label="Profession" defaultValue={prefill.profession} autoComplete="organization-title" max={120} />
            <Field name="howFound" label="Comment m'avez-vous connue ?" defaultValue={prefill.howFound} max={200} />
          </div>
        </Section>

        <Section n={2} title="Motif de consultation">
          <div>
            <p className="label">Soin(s) qui vous intéresse(nt)</p>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((o) => (
                <label
                  key={o}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm has-[:checked]:border-forest has-[:checked]:bg-sage-soft/60"
                >
                  <input type="checkbox" name="interests" value={o} className="size-4 accent-forest" />
                  {o}
                </label>
              ))}
            </div>
          </div>
          <Area name="reason" label="Qu'est-ce qui vous amène ?" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="since" label="Depuis quand ?" max={200} />
            <Field name="consultedBefore" label="Avez-vous déjà consulté pour cela ?" max={300} />
          </div>
          <Area name="expectations" label="Qu'attendez-vous de ces séances ?" rows={2} />
          <Area name="lifestyle" label="Hygiène de vie" hint="Sommeil, alimentation, activité physique, niveau de stress…" rows={2} />
        </Section>

        <Section n={3} title="Votre santé">
          <div className="space-y-4">
            {healthQuestions.map((q) => (
              <div key={q.key} className="rounded-2xl border border-line bg-white p-4">
                <p id={`hq-${q.key}`} className="font-semibold">
                  {q.question} <span className="text-forest">*</span>
                </p>
                <div role="radiogroup" aria-labelledby={`hq-${q.key}`} className="mt-2 flex gap-5 text-sm">
                  {(["non", "oui"] as const).map((v) => (
                    <label key={v} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name={`h-${q.key}`}
                        value={v}
                        required
                        onChange={() => setYes((y) => ({ ...y, [q.key]: v === "oui" }))}
                        className="size-4 accent-forest"
                      />
                      {v === "oui" ? "Oui" : "Non"}
                    </label>
                  ))}
                </div>
                {yes[q.key] && (
                  <div className="mt-3">
                    <label htmlFor={`a-h-${q.key}`} className="label text-xs">
                      {q.detail}
                    </label>
                    <input id={`a-h-${q.key}`} name={`h-${q.key}-detail`} maxLength={500} className="field !py-2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section n={4} title="Points de vigilance">
          <p className="text-sm text-ink-soft">
            Cochez les situations qui vous concernent (actuelles ou passées). Certaines contre-indiquent la
            pressothérapie, le massage ou la réflexologie : Béatrice adaptera la séance.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {vigilanceOptions.map((o) => (
              <label key={o} className={`flex items-start gap-3 rounded-xl border border-line bg-white p-3 text-sm ${none ? "opacity-50" : ""}`}>
                <input type="checkbox" name="vigilance" value={o} disabled={none} className="mt-0.5 size-4 accent-forest" />
                {o}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-forest/40 bg-forest-soft/50 p-3 text-sm font-semibold">
            <input type="checkbox" name="noVigilance" checked={none} onChange={(e) => setNone(e.target.checked)} className="size-4 accent-forest" />
            Aucune de ces situations ne me concerne
          </label>
          <Area name="otherInfo" label="Autres informations utiles" hint="Douleurs, sensibilités, peurs, préférences…" rows={2} />
        </Section>

        <Section n={5} title="À lire avant de valider">
          <ul className="space-y-2 text-sm text-ink-soft">
            {beforeSigning.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-forest" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
          <div className="space-y-3">
            {consentStatements.map((c) => (
              <label key={c.key} className="flex items-start gap-3 text-sm font-semibold">
                <input type="checkbox" name={`c-${c.key}`} required className="mt-0.5 size-4 accent-forest" />
                {c.text}
              </label>
            ))}
          </div>
          <p className="text-xs text-ink-soft">
            Vos données sont conservées de façon sécurisée pendant 3 ans après votre dernière séance, puis supprimées.
            Vous pouvez à tout moment demander à les consulter, les corriger ou les effacer (
            <a href="/confidentialite" target="_blank" className="underline hover:text-forest">
              politique de confidentialité
            </a>
            ).
          </p>
          <Field name="place" label="Fait à" max={120} className="sm:max-w-xs" autoComplete="address-level2" />
        </Section>

        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
            {update ? "Mettre à jour ma fiche" : "Envoyer ma fiche"}
          </button>
        </div>
      </form>
    </div>
  );
}
