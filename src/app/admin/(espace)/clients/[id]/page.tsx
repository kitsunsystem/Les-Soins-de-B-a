import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  FileWarning,
  Mail,
  MessageSquareText,
  NotebookPen,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { healthQuestions, type AdmissionData } from "@/lib/admission";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/bookings";
import { getClientDetail } from "@/lib/clients";
import { prestationOf } from "@/lib/content";
import type { Admission, SessionNote } from "@/lib/db/schema";
import { formatDateStr, formatDateTime, isDateStr, parisDateStr } from "@/lib/time";
import { admissionPath, getBaseUrl } from "@/lib/urls";
import { deleteClientAction, deleteSessionNoteAction } from "../../../actions";
import { AddAppointmentForm } from "../../AddAppointmentForm";
import { AppointmentCard } from "../../AppointmentCard";
import { AdmissionLink, EditClientForm, SessionNoteForm } from "../forms";

const short = (d: Date) => formatDateStr(parisDateStr(d), { weekday: undefined, day: "numeric", month: "long", year: "numeric" });
const shortStr = (d: string) => (isDateStr(d) ? formatDateStr(d, { weekday: undefined, day: "numeric", month: "long", year: "numeric" }) : d);

function age(birthdate: string): number | null {
  if (!birthdate) return null;
  const [y, m, d] = birthdate.split("-").map(Number);
  const now = new Date();
  let a = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) a--;
  return a >= 0 && a < 130 ? a : null;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid gap-0.5 sm:grid-cols-[11rem_1fr] sm:gap-3">
      <dt className="text-xs font-semibold text-ink-soft">{label}</dt>
      <dd className="whitespace-pre-line">{value}</dd>
    </div>
  );
}

/** Réponses de la dernière fiche d'admission remplie en ligne. */
function AdmissionAnswers({ admission }: { admission: Admission }) {
  const d = admission.data as AdmissionData;
  return (
    <div className="space-y-4 text-sm">
      <dl className="space-y-2">
        <Row label="Soins qui l'intéressent" value={d.interests?.join(", ")} />
        <Row label="Ce qui l'amène" value={d.reason} />
        <Row label="Depuis quand" value={d.since} />
        <Row label="Déjà consulté pour cela" value={d.consultedBefore} />
        <Row label="Attentes" value={d.expectations} />
        <Row label="Hygiène de vie" value={d.lifestyle} />
      </dl>
      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">Santé</h4>
        <dl className="space-y-2">
          {healthQuestions.map((q) => {
            const a = d.health?.[q.key];
            if (!a) return null;
            return (
              <div key={q.key} className="grid gap-0.5 sm:grid-cols-[1fr_auto] sm:gap-3">
                <dt className="text-ink-soft">{q.question}</dt>
                <dd className={a.answer === "oui" ? "font-semibold text-clay-dark" : ""}>
                  {a.answer === "oui" ? "Oui" : "Non"}
                  {a.detail && a.answer === "oui" && <span className="block font-normal text-ink">{a.detail}</span>}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">Contre-indications cochées</h4>
        {d.vigilance?.length ? (
          <ul className="list-disc space-y-0.5 pl-5 text-clay-dark">
            {d.vigilance.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        ) : (
          <p>Aucune de ces situations.</p>
        )}
      </div>
      <dl className="space-y-2">
        <Row label="Autres informations" value={d.otherInfo} />
      </dl>
      <p className="border-t border-line pt-3 text-xs text-ink-soft">
        Remplie et validée en ligne {d.place ? `à ${d.place} ` : ""}le {formatDateTime(admission.createdAt)}, avec les trois
        consentements (exactitude, bien-être sans visée médicale, conservation des données de santé).
      </p>
    </div>
  );
}

function NoteView({ n }: { n: SessionNote }) {
  return (
    <div className="space-y-2 text-sm">
      {n.motive && (
        <p>
          <span className="font-semibold">Motif : </span>
          {n.motive}
        </p>
      )}
      {n.observations && <p className="whitespace-pre-line">{n.observations}</p>}
      <dl className="space-y-1.5">
        <Row label="Ressenti du client" value={n.feeling} />
        <Row label="Conseils donnés" value={n.advice} />
        <Row label="Prochaine séance conseillée" value={n.nextSession ? shortStr(n.nextSession) : ""} />
      </dl>
    </div>
  );
}

export default async function ClientPage({ params, searchParams }: PageProps<"/admin/clients/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const [detail, settings, base] = await Promise.all([getClientDetail(id), getSettings(), getBaseUrl()]);
  if (!detail) notFound();
  const { client: c, appointments, messages, notes, admissions, stats } = detail;
  const years = age(c.birthdate);
  const noted = new Set(notes.map((n) => n.appointmentId).filter(Boolean));
  const vigilance = c.vigilance && !/^aucune/i.test(c.vigilance.trim()) ? c.vigilance : "";

  // Compte-rendu demandé depuis l'agenda (?compte-rendu=<rendez-vous>) : on ouvre le formulaire pré-rempli,
  // ou le compte-rendu existant.
  const crId = typeof sp["compte-rendu"] === "string" ? sp["compte-rendu"] : "";
  const crAppt = appointments.find((a) => a.id === crId);
  const crNote = crAppt ? notes.find((n) => n.appointmentId === crAppt.id) : undefined;
  const crDefaults =
    crAppt && !crNote
      ? {
          appointmentId: crAppt.id,
          date: parisDateStr(crAppt.startsAt),
          prestation: prestationOf(crAppt.serviceId),
          durationMinutes: Math.round((crAppt.endsAt.getTime() - crAppt.startsAt.getTime()) / 60000),
        }
      : undefined;

  // Historique : rendez-vous et messages, du plus récent au plus ancien.
  const timeline = [
    ...appointments.map((a) => ({ kind: "rdv" as const, at: a.startsAt, a })),
    ...messages.map((m) => ({ kind: "msg" as const, at: m.createdAt, m })),
  ].sort((x, y) => y.at.getTime() - x.at.getTime());

  const kpis = [
    { label: "Séances", value: stats.visits },
    { label: "À venir", value: stats.upcoming },
    { label: "Annulations", value: stats.cancelled },
    { label: "Absences", value: stats.noShow },
    { label: "Montant estimé", value: `${stats.estimatedTotal} €` },
  ];

  const deposit =
    c.depositPolicy === "always"
      ? "Acompte demandé à chaque réservation en ligne (réglage de la fiche)."
      : c.depositPolicy === "never"
        ? "Jamais d'acompte pour cette personne (réglage de la fiche)."
        : !settings.depositEnabled
          ? "Acompte automatique désactivé dans les réglages."
          : stats.incidents >= settings.depositThreshold
            ? `Acompte de ${settings.depositAmount} € demandé à sa prochaine réservation en ligne (${stats.incidents} annulation(s)/absence(s)).`
            : `${stats.incidents} annulation(s)/absence(s) sur ${settings.depositThreshold} avant de demander un acompte.`;
  const depositWarn = c.depositPolicy === "always" || (c.depositPolicy === "auto" && settings.depositEnabled && stats.incidents >= settings.depositThreshold);

  return (
    <div className="space-y-6">
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        Tous les clients
      </Link>

      <section className="card flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-clay-soft font-serif text-3xl text-clay-dark">
            {(c.lastName || c.name).charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-4xl">
              {c.lastName ? (
                <>
                  <span className="uppercase">{c.lastName}</span> {c.firstName}
                </>
              ) : (
                c.name
              )}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {stats.firstVisit ? `1re venue le ${short(stats.firstVisit)}` : `Fiche créée le ${short(c.createdAt)}`}
              {years !== null && ` · ${years} ans`}
              {c.profession && ` · ${c.profession}`}
              {c.howFound && ` · m'a connue par ${c.howFound}`}
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

      {vigilance && (
        <p className="flex gap-3 rounded-2xl border border-clay/30 bg-clay-soft p-4 text-sm text-clay-dark">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span>
            <strong>Points de vigilance :</strong> {vigilance}
          </span>
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <li key={k.label} className="card p-4">
            <span className="block font-serif text-3xl leading-none">{k.value}</span>
            <span className="text-xs text-ink-soft">{k.label}</span>
          </li>
        ))}
      </ul>
      <p className={`-mt-3 text-xs ${depositWarn ? "font-semibold text-clay-dark" : "text-ink-soft"}`}>
        {deposit}
        {stats.estimatedTotal > 0 && !depositWarn && " Montant estimé d'après les tarifs affichés des séances honorées."}
      </p>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
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
          {c.motive && (
            <p className="text-sm">
              <span className="font-bold">Motif initial / objectif :</span> <span className="text-ink-soft">{c.motive}</span>
            </p>
          )}
          {stats.favorites.length > 0 && (
            <p className="text-sm text-ink-soft">
              <span className="font-bold text-ink">Soins préférés :</span>{" "}
              {stats.favorites.map((f) => `${f.name} (${f.count})`).join(" · ")}
            </p>
          )}

          {/* Journal des séances (feuille « Séances » du classeur) */}
          <section id="journal" className="card scroll-mt-24 p-5 md:p-6" aria-labelledby="t-journal">
            <h2 id="t-journal" className="flex items-center gap-2 text-2xl">
              <NotebookPen className="size-5 text-forest" aria-hidden />
              Journal des séances
              <span className="font-sans text-sm font-normal text-ink-soft">({notes.length})</span>
            </h2>
            <details className="mt-4 rounded-xl border border-line bg-white p-4" open={Boolean(crDefaults)}>
              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-bold text-forest">
                <Plus className="size-4" aria-hidden />
                {crDefaults ? `Compte-rendu de la séance du ${shortStr(crDefaults.date)}` : "Ajouter un compte-rendu de séance"}
              </summary>
              <div className="mt-4">
                <SessionNoteForm key={crDefaults?.appointmentId ?? "new"} clientId={c.id} defaults={crDefaults} />
              </div>
            </details>

            {notes.length === 0 ? (
              <p className="mt-4 text-sm text-ink-soft">
                Aucun compte-rendu pour l&apos;instant. Après une séance, ajoutez vos observations ici (ou depuis l&apos;agenda).
              </p>
            ) : (
              <ol className="mt-5 space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-2xl border border-line bg-white p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold">
                        <span className="first-letter:uppercase">{shortStr(n.date)}</span>
                        <span className="font-normal text-ink-soft">
                          {" "}
                          · {n.prestation}
                          {n.durationMinutes ? ` · ${n.durationMinutes} min` : ""}
                        </span>
                      </p>
                      {n.changeReported && (
                        <span className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-[#7a5d22]">
                          Changement signalé
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <NoteView n={n} />
                    </div>
                    <details className="mt-3" open={crNote?.id === n.id}>
                      <summary className="cursor-pointer text-xs font-semibold text-forest">Modifier</summary>
                      <div className="mt-3 border-t border-line pt-3">
                        <SessionNoteForm clientId={c.id} note={n} submitLabel="Enregistrer" />
                        <form action={deleteSessionNoteAction} className="mt-3">
                          <input type="hidden" name="id" value={n.id} />
                          <input type="hidden" name="clientId" value={c.id} />
                          <button type="submit" className="text-xs text-ink-soft underline-offset-2 hover:text-clay-dark hover:underline">
                            Supprimer ce compte-rendu
                          </button>
                        </form>
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="card p-5 md:p-6" aria-labelledby="t-historique">
            <h2 id="t-historique" className="text-2xl">
              Rendez-vous et messages
            </h2>
            {timeline.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">Aucun rendez-vous ni message pour le moment.</p>
            ) : (
              <ol className="mt-5 space-y-3 border-l-2 border-line pl-5">
                {timeline.map((item) =>
                  item.kind === "rdv" ? (
                    <li key={`a-${item.a.id}`} className="relative">
                      <span className="absolute -left-[27px] top-5 size-3 rounded-full border-2 border-card bg-forest" aria-hidden />
                      <AppointmentCard appt={item.a} showDate hasNote={noted.has(item.a.id)} />
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
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5 md:p-6" aria-labelledby="t-admission">
            <h2 id="t-admission" className="flex items-center gap-2 text-2xl">
              {c.admissionReceivedAt ? (
                <ClipboardCheck className="size-5 text-forest" aria-hidden />
              ) : (
                <FileWarning className="size-5 text-gold" aria-hidden />
              )}
              Fiche d&apos;admission
            </h2>
            {c.admissionReceivedAt ? (
              <p className="mt-2 text-sm text-ink-soft">
                Reçue le {short(c.admissionReceivedAt)}
                {admissions.length > 1 && ` (${admissions.length} versions, la plus récente ci-dessous)`}.
              </p>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">
                Pas encore remplie. Le lien est envoyé automatiquement à la première réservation en ligne ; vous pouvez aussi
                le lui transmettre :
              </p>
            )}
            {admissions[0] && (
              <details className="mt-3 rounded-xl border border-line bg-white p-4">
                <summary className="cursor-pointer text-sm font-bold text-forest">Voir ses réponses</summary>
                <div className="mt-4">
                  <AdmissionAnswers admission={admissions[0]} />
                </div>
              </details>
            )}
            {c.admissionToken && (
              <div className="mt-4">
                {c.admissionReceivedAt && (
                  <p className="mb-2 text-xs text-ink-soft">Pour une mise à jour (changement de santé…), renvoyez-lui le lien :</p>
                )}
                <AdmissionLink clientId={c.id} token={c.admissionToken} url={`${base}${admissionPath(c.admissionToken)}`} hasEmail={Boolean(c.email)} />
              </div>
            )}
          </section>

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
                La fiche, l&apos;historique des rendez-vous ({appointments.length}), le journal ({notes.length}), les fiches
                d&apos;admission ({admissions.length}) et les messages ({messages.length}) seront définitivement supprimés. Les
                créneaux à venir seront libérés.
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
