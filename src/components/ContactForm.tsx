"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { contactSubjects } from "@/lib/content";


export function ContactForm({ defaultSubject, defaultMessage }: { defaultSubject: string; defaultMessage: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      subject: fd.get("subject"),
      message: fd.get("message"),
      consent: fd.get("consent") === "on",
      website: fd.get("website") ?? "",
    };
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Une erreur est survenue.");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="card p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto size-12 text-sage" aria-hidden strokeWidth={1.5} />
        <h2 className="mt-4 text-3xl">Merci pour votre message !</h2>
        <p className="mt-3 text-ink-soft">Je vous réponds dans les meilleurs délais.</p>
        <Link href="/" className="link-arrow mt-6 inline-block">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6 md:p-8" noValidate={false}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="label">
            Nom / Prénom <span className="text-forest">*</span>
          </label>
          <input id="c-name" name="name" required minLength={2} maxLength={120} autoComplete="name" className="field" />
        </div>
        <div>
          <label htmlFor="c-email" className="label">
            Email <span className="text-forest">*</span>
          </label>
          <input id="c-email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
        <div>
          <label htmlFor="c-phone" className="label">
            Téléphone
          </label>
          <input id="c-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} className="field" />
        </div>
        <div>
          <label htmlFor="c-subject" className="label">
            Objet
          </label>
          <select id="c-subject" name="subject" defaultValue={defaultSubject} className="field">
            {Object.values(contactSubjects).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="c-message" className="label">
          Message <span className="text-forest">*</span>
        </label>
        <textarea
          id="c-message"
          name="message"
          required
          minLength={5}
          maxLength={5000}
          rows={6}
          defaultValue={defaultMessage}
          className="field resize-y"
        />
      </div>
      <div className="hidden" aria-hidden>
        <label htmlFor="c-website">Ne pas remplir</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input type="checkbox" name="consent" required className="mt-1 size-4 accent-forest" />
        <span>
          J&apos;accepte que mes informations soient utilisées uniquement pour me recontacter (
          <Link href="/confidentialite" className="underline hover:text-forest">
            politique de confidentialité
          </Link>
          ).
        </span>
      </label>
      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={state === "sending"}>
        {state === "sending" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        Envoyer mon message
      </button>
    </form>
  );
}
