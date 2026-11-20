import { CheckCircle2, XCircle } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getOverrides, getSettings, getWeeklyHours } from "@/lib/bookings";
import { brevoConfigured } from "@/lib/brevo";
import { stripeConfigured } from "@/lib/stripe";
import { addDays, formatDateStr, parisDateStr } from "@/lib/time";
import { deleteOverrideAction } from "../../actions";
import { ClosePeriodForm, SettingsForm } from "./forms";
import { WeeklyHoursEditor } from "./WeeklyHoursEditor";

export default async function HorairesPage() {
  await requireAdmin();
  const today = parisDateStr(new Date());
  const [weekly, settings, overrides] = await Promise.all([
    getWeeklyHours(),
    getSettings(),
    getOverrides(today, addDays(today, 400)),
  ]);

  const checks = [
    { ok: brevoConfigured(), label: "Envoi des emails (Brevo)", hint: "BREVO_API_KEY et BREVO_SENDER_EMAIL" },
    { ok: Boolean(process.env.ADMIN_EMAIL), label: "Adresse de notification", hint: "ADMIN_EMAIL" },
    { ok: Boolean(process.env.SITE_URL), label: "Adresse du site dans les emails", hint: "SITE_URL" },
    { ok: Boolean(process.env.CRON_SECRET), label: "Rappels automatiques la veille", hint: "CRON_SECRET" },
    { ok: stripeConfigured(), label: "Paiement des acomptes par carte (Stripe)", hint: "STRIPE_SECRET_KEY" },
    {
      ok: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      label: "Notifications de paiement Stripe",
      hint: "STRIPE_WEBHOOK_SECRET (webhook vers /api/stripe/webhook)",
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <section className="card p-5 md:p-6" aria-labelledby="t-semaine">
          <h1 id="t-semaine" className="text-3xl">Horaires habituels</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Ces plages s&apos;appliquent chaque semaine. Les créneaux proposés en ligne sont calculés à partir
            d&apos;elles, en tenant compte des rendez-vous déjà pris.
          </p>
          <WeeklyHoursEditor initial={weekly} />
        </section>

        <section className="card p-5 md:p-6" aria-labelledby="t-conges">
          <h2 id="t-conges" className="text-3xl">Congés & fermetures</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Fermez une période entière en une fois. Pour un seul jour, utilisez directement l&apos;agenda.
          </p>
          <ClosePeriodForm today={today} />

          <h3 className="mt-8 text-xl">Jours modifiés à venir</h3>
          {overrides.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Aucune exception : les horaires habituels s&apos;appliquent.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-white text-sm">
              {overrides.map((o) => (
                <li key={o.date} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span>
                    <a href={`/admin?jour=${o.date}`} className="font-medium first-letter:uppercase hover:text-forest">
                      {formatDateStr(o.date, { year: "numeric" })}
                    </a>
                    <span className="block text-xs text-ink-soft">
                      {o.closed ? "Fermé" : o.ranges.map((r) => `${r.start}–${r.end}`).join(", ")}
                      {o.note ? ` · ${o.note}` : ""}
                    </span>
                  </span>
                  <form action={deleteOverrideAction}>
                    <input type="hidden" name="date" value={o.date} />
                    <button type="submit" className="text-xs text-ink-soft underline hover:text-forest">
                      Retirer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="space-y-6">
        <section className="card p-5 md:p-6" aria-labelledby="t-reglages">
          <h2 id="t-reglages" className="text-3xl">Réglages de la réservation</h2>
          <SettingsForm settings={settings} stripeReady={stripeConfigured()} />
        </section>

        <section className="card p-5 md:p-6" aria-labelledby="t-config">
          <h2 id="t-config" className="text-2xl">État de la configuration</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-2">
                {c.ok ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage" aria-label="OK" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-forest" aria-label="À configurer" />
                )}
                <span>
                  {c.label}
                  {!c.ok && <span className="block text-xs text-ink-soft">Variable à définir : {c.hint}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
