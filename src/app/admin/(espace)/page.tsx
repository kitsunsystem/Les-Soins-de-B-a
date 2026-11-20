import Link from "next/link";
import { AlertCircle, ChevronLeft, ChevronRight, Clock, Inbox } from "lucide-react";
import { rangesForDate, type DateOverride } from "@/lib/availability";
import { requireAdmin } from "@/lib/auth";
import { expireHolds, getOverrides, getWeeklyHours, listAppointments, listPending } from "@/lib/bookings";
import { brevoConfigured } from "@/lib/brevo";
import { appointmentsWithNotes, clientOptions, getClientsByIds } from "@/lib/clients";
import {
  addDays,
  daysOfMonth,
  formatDateStr,
  formatMonth,
  isDateStr,
  isMonthStr,
  parisDateStr,
  parisTimeStr,
  parisToUtc,
  shiftMonth,
  weekdayNames,
  weekdayOf,
} from "@/lib/time";
import { AddAppointmentForm } from "./AddAppointmentForm";
import { AppointmentCard } from "./AppointmentCard";
import { DayHoursEditor } from "./DayHoursEditor";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const short = (t: string) => t.replace(":00", "h").replace(":", "h");

export default async function AgendaPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const sp = await searchParams;
  const today = parisDateStr(new Date());
  const jour = isDateStr(sp.jour) ? sp.jour : today;
  const mois = isMonthStr(sp.mois) ? sp.mois : jour.slice(0, 7);

  const days = daysOfMonth(mois);
  await expireHolds();
  const [weekly, overrides, appts, pending, clients] = await Promise.all([
    getWeeklyHours(),
    getOverrides(days[0], days.at(-1)!),
    listAppointments(parisToUtc(days[0], "00:00"), parisToUtc(addDays(days.at(-1)!, 1), "00:00")),
    listPending(),
    clientOptions(),
  ]);
  const overrideMap = new Map<string, DateOverride>(overrides.map((o) => [o.date, o]));
  const byDay = new Map<string, typeof appts>();
  for (const a of appts) {
    const d = parisDateStr(a.startsAt);
    byDay.set(d, [...(byDay.get(d) ?? []), a]);
  }

  // Jour sélectionné (peut être hors du mois affiché)
  const dayOverride = (await getOverrides(jour, jour))[0];
  const dayAppts =
    jour.slice(0, 7) === mois
      ? (byDay.get(jour) ?? [])
      : await listAppointments(parisToUtc(jour, "00:00"), parisToUtc(addDays(jour, 1), "00:00"));
  // Fiches clients (vigilance, fiche d'admission) et comptes-rendus des rendez-vous affichés.
  const shown = [...pending, ...dayAppts];
  const [clientMap, noted] = await Promise.all([
    getClientsByIds(shown.map((a) => a.clientId ?? "")),
    appointmentsWithNotes(dayAppts.map((a) => a.id)),
  ]);
  const weeklyRanges = weekly
    .filter((w) => w.weekday === weekdayOf(jour))
    .map(({ start, end }) => ({ start, end }));
  const offset = (weekdayOf(days[0]) + 6) % 7;
  const link = (m: string, j?: string) => `/admin?mois=${m}${j ? `&jour=${j}` : ""}`;

  return (
    <div className="space-y-6">
      {!brevoConfigured() && (
        <p className="flex items-start gap-3 rounded-2xl border border-gold/50 bg-card p-4 text-sm">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
          <span>
            Les emails ne partent pas encore : Brevo n&apos;est pas configuré (variables <code>BREVO_API_KEY</code>{" "}
            et <code>BREVO_SENDER_EMAIL</code>). Les réservations sont bien enregistrées ici.
          </span>
        </p>
      )}

      {pending.length > 0 && (
        <section className="card p-5 md:p-6" aria-labelledby="titre-attente">
          <h2 id="titre-attente" className="flex items-center gap-2 text-2xl">
            <Inbox className="size-5 text-forest" aria-hidden />
            Demandes en attente
            <span className="rounded-full bg-forest px-2.5 py-0.5 font-sans text-xs text-white">{pending.length}</span>
          </h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {pending.map((a) => (
              <AppointmentCard key={a.id} appt={a} showDate client={a.clientId ? clientMap.get(a.clientId) : undefined} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Calendrier du mois */}
        <section className="card p-4 md:p-6" aria-label="Calendrier">
          <div className="flex items-center justify-between gap-2">
            <Link href={link(shiftMonth(mois, -1))} className="grid size-10 place-items-center rounded-full hover:bg-sand" aria-label="Mois précédent">
              <ChevronLeft className="size-5" />
            </Link>
            <div className="text-center">
              <h1 className="text-3xl">{formatMonth(mois)}</h1>
              {mois !== today.slice(0, 7) && (
                <Link href={link(today.slice(0, 7), today)} className="text-xs text-forest underline">
                  Revenir à aujourd&apos;hui
                </Link>
              )}
            </div>
            <Link href={link(shiftMonth(mois, 1))} className="grid size-10 place-items-center rounded-full hover:bg-sand" aria-label="Mois suivant">
              <ChevronRight className="size-5" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[0.7rem] uppercase tracking-wider text-ink-soft">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: offset }, (_, i) => (
              <span key={`e${i}`} />
            ))}
            {days.map((d) => {
              const ranges = rangesForDate(d, weekly, overrideMap);
              const closed = ranges.length === 0;
              const o = overrideMap.get(d);
              const list = (byDay.get(d) ?? []).filter((a) => ["pending", "confirmed", "awaiting_payment"].includes(a.status));
              const nPending = list.filter((a) => a.status !== "confirmed").length;
              const nConfirmed = list.length - nPending;
              const selected = d === jour;
              const past = d < today;
              return (
                <Link
                  key={d}
                  href={link(mois, d)}
                  scroll={false}
                  aria-current={selected ? "date" : undefined}
                  className={`flex min-h-20 flex-col rounded-xl border p-1.5 text-left text-xs transition-colors md:min-h-24 md:p-2 ${
                    selected
                      ? "border-forest bg-sage-soft"
                      : closed
                        ? "border-transparent bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgb(232_220_207/0.5)_6px_7px)] hover:border-line"
                        : "border-line bg-white hover:border-sage"
                  } ${past ? "opacity-55" : ""}`}
                >
                  <span className="flex items-center justify-between">
                    <span className={`font-medium ${d === today ? "grid size-6 place-items-center rounded-full bg-ink text-white" : ""}`}>
                      {Number(d.slice(8))}
                    </span>
                    {o && <span className="size-1.5 rounded-full bg-gold" title={o.note || "Horaires modifiés"} />}
                  </span>
                  <span className="mt-1 hidden leading-tight text-ink-soft md:block">
                    {closed ? (o?.note || "Fermé") : ranges.map((r) => `${short(r.start)}–${short(r.end)}`).join(" ")}
                  </span>
                  <span className="mt-auto flex flex-wrap gap-1 pt-1">
                    {nConfirmed > 0 && (
                      <span className="rounded-full bg-sage px-1.5 py-px text-[0.65rem] font-medium text-white">{nConfirmed} RDV</span>
                    )}
                    {nPending > 0 && (
                      <span className="rounded-full bg-gold px-1.5 py-px text-[0.65rem] font-medium text-white">{nPending} ?</span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-sage" /> confirmé</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-gold" /> en attente</span>
            <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-gold" /> horaires modifiés</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded bg-[repeating-linear-gradient(135deg,transparent_0_3px,rgb(200_180_160)_3px_4px)]" /> fermé</span>
          </p>
        </section>

        {/* Détail du jour */}
        <section className="space-y-5" aria-labelledby="titre-jour">
          <div className="card p-5 md:p-6">
            <h2 id="titre-jour" className="text-3xl first-letter:uppercase">
              {formatDateStr(jour, { year: "numeric" })}
            </h2>
            <DayHoursEditor
              key={`${jour}-${dayOverride ? JSON.stringify(dayOverride) : "w"}-${JSON.stringify(weeklyRanges)}`}
              date={jour}
              weekdayLabel={weekdayNames[weekdayOf(jour)].toLowerCase()}
              weeklyRanges={weeklyRanges}
              override={dayOverride ? { closed: dayOverride.closed, ranges: dayOverride.ranges, note: dayOverride.note } : null}
            />
          </div>

          <div className="card p-5 md:p-6">
            <h3 className="flex items-center gap-2 text-2xl">
              <Clock className="size-5 text-forest" aria-hidden />
              Rendez-vous du jour
            </h3>
            {dayAppts.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">Aucun rendez-vous ce jour-là.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {dayAppts.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appt={a}
                    client={a.clientId ? clientMap.get(a.clientId) : undefined}
                    hasNote={noted.has(a.id)}
                  />
                ))}
              </div>
            )}
            <AddAppointmentForm date={jour} clients={clients} defaultTime={dayAppts.length ? parisTimeStr(dayAppts.at(-1)!.endsAt) : "09:00"} />
          </div>
        </section>
      </div>
    </div>
  );
}
