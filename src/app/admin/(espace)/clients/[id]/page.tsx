import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Mail, MessageSquareText, Phone, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getClientDetail } from "@/lib/clients";
import { formatDateStr, formatDateTime, parisDateStr } from "@/lib/time";
import { deleteClientAction } from "../../../actions";
import { AddAppointmentForm } from "../../AddAppointmentForm";
import { AppointmentCard } from "../../AppointmentCard";
import { EditClientForm } from "../forms";

const short = (d: Date) => formatDateStr(parisDateStr(d), { weekday: undefined, day: "numeric", month: "long", year: "numeric" });

function age(birthdate: string): number | null {
  if (!birthdate) return null;
  const [y, m, d] = birthdate.split("-").map(Number);
  const now = new Date();
  let a = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) a--;
  return a >= 0 && a < 130 ? a : null;
}

export default async function ClientPage({ params }: PageProps<"/admin/clients/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getClientDetail(id);
  if (!detail) notFound();
  const { client: c, appointments, messages, stats } = detail;
  const years = age(c.birthdate);

  // Historique : rendez-vous et messages, du plus récent au plus ancien.
  const timeline = [
    ...appointments.map((a) => ({ kind: "rdv" as const, at: a.startsAt, a })),
    ...messages.map((m) => ({ kind: "msg" as const, at: m.createdAt, m })),
  ].sort((x, y) => y.at.getTime() - x.at.getTime());

  const kpis = [
    { label: "Séances honorées", value: stats.visits },
    { label: "À venir", value: stats.upcoming },
    { label: "Annulations", value: stats.cancelled },
    { label: "Absences", value: stats.noShow },
    { label: "Montant estimé", value: `${stats.estimatedTotal} €` },
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        Tous les clients
      </Link>

      <section className="card flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-clay-soft font-serif text-3xl text-clay-dark">
            {c.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-4xl">{c.name}</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Client depuis le {short(c.createdAt)}
              {years !== null && ` · ${years} ans`}
              {stats.firstVisit && ` · 1re séance le ${short(stats.firstVisit)}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {c.phone && (
            <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="btn btn-primary !px-4 !py-2 text-sm">
              <Phone className="size-4" aria-hidden />
              {c.phone}
            </a>
          )}
          {c.email && (
            <a href={`mailto:${c.email}`} className="btn btn-outline !px-4 !py-2 text-sm">
              <Mail className="size-4" aria-hidden />
              Écrire
            </a>
          )}
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <li key={k.label} className="card p-4">
            <span className="block font-serif text-3xl leading-none">{k.value}</span>
            <span className="text-xs text-ink-soft">{k.label}</span>
          </li>
        ))}
      </ul>
      {stats.estimatedTotal > 0 && (
        <p className="-mt-3 text-xs text-ink-soft">Montant estimé d&apos;après les tarifs affichés des séances honorées.</p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="space-y-4" aria-labelledby="t-historique">
          {stats.nextVisit && (
            <div className="flex items-center gap-3 rounded-2xl bg-forest p-4 text-linen">
              <CalendarDays className="size-5 shrink-0 text-gold" aria-hidden />
              <p className="text-sm">
                <span className="font-bold">Prochain rendez-vous :</span>{" "}
                <span className="first-letter:uppercase">{formatDateTime(stats.nextVisit.startsAt)}</span> —{" "}
                {stats.nextVisit.serviceName}
              </p>
            </div>
          )}
          {stats.favorites.length > 0 && (
            <p className="text-sm text-ink-soft">
              <span className="font-bold text-ink">Soins préférés :</span>{" "}
              {stats.favorites.map((f) => `${f.name} (${f.count})`).join(" · ")}
            </p>
          )}

          <div className="card p-5 md:p-6">
            <h2 id="t-historique" className="text-2xl">
              Historique
            </h2>
            {timeline.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">Aucun rendez-vous ni message pour le moment.</p>
            ) : (
              <ol className="mt-5 space-y-3 border-l-2 border-line pl-5">
                {timeline.map((item) =>
                  item.kind === "rdv" ? (
                    <li key={`a-${item.a.id}`} className="relative">
                      <span className="absolute -left-[27px] top-5 size-3 rounded-full border-2 border-card bg-forest" aria-hidden />
                      <AppointmentCard appt={item.a} showDate />
                    </li>
                  ) : (
                    <li key={`m-${item.m.id}`} className="relative">
                      <span className="absolute -left-[27px] top-5 size-3 rounded-full border-2 border-card bg-gold" aria-hidden />
                      <article className="rounded-2xl border border-line bg-amber-soft/40 p-4 text-sm">
                        <p className="flex items-center gap-2 font-semibold">
                          <MessageSquareText className="size-4 text-gold" aria-hidden />
                          Message : {item.m.subject}
                          <span className="font-normal text-ink-soft">· {short(item.m.createdAt)}</span>
                        </p>
                        <p className="mt-2 whitespace-pre-line text-ink-soft">{item.m.message}</p>
                      </article>
                    </li>
                  ),
                )}
              </ol>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card p-5 md:p-6" aria-labelledby="t-fiche">
            <h2 id="t-fiche" className="mb-4 text-2xl">
              Fiche client
            </h2>
            <EditClientForm client={c} />
          </section>

          <section className="card p-5 md:p-6">
            <AddAppointmentForm
              client={{ id: c.id, name: c.name, email: c.email, phone: c.phone }}
              defaultTime="10:00"
            />
          </section>

          <details className="rounded-2xl border border-clay/30 p-5 text-sm">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-clay-dark">
              <Trash2 className="size-4" aria-hidden />
              Supprimer ce client (droit à l&apos;effacement)
            </summary>
            <form action={deleteClientAction} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={c.id} />
              <p className="text-ink-soft">
                La fiche, l&apos;historique des rendez-vous ({appointments.length}) et les messages ({messages.length}) seront
                définitivement supprimés. Les créneaux à venir seront libérés.
              </p>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="confirm" required className="accent-clay" />
                Je confirme la suppression définitive
              </label>
              <button type="submit" className="btn !bg-clay-dark !px-4 !py-2 text-sm text-white">
                Supprimer définitivement
              </button>
            </form>
          </details>
        </aside>
      </div>
    </div>
  );
}
