import Link from "next/link";
import { AlertTriangle, FileWarning, Mail, MapPin, MessageSquare, NotebookPen, Phone, UserRound, Video } from "lucide-react";
import type { Appointment, Client } from "@/lib/db/schema";
import { formatDateStr, parisDateStr, parisTimeStr } from "@/lib/time";
import { attendedAction, cancelAction, confirmAction, declineAction, noShowAction } from "../actions";

const STATUS: Record<Appointment["status"], { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-gold/15 text-[#7a5d22]" },
  confirmed: { label: "Confirmé", cls: "bg-sage/20 text-forest" },
  declined: { label: "Refusé", cls: "bg-line text-ink-soft" },
  cancelled: { label: "Annulé", cls: "bg-line text-ink-soft" },
  no_show: { label: "Absent(e)", cls: "bg-clay-soft text-clay-dark" },
  awaiting_payment: { label: "Paiement de l'acompte en cours", cls: "bg-lavender-soft text-lavender" },
  expired: { label: "Acompte non réglé — libéré", cls: "bg-line text-ink-soft" },
};

const MODE = {
  cabinet: { label: "Cabinet", icon: MapPin },
  visio: { label: "Visio", icon: Video },
  telephone: { label: "Téléphone", icon: Phone },
} as const;

function DepositBadge({ a }: { a: Appointment }) {
  if (!a.depositStatus) return null;
  const amount = `${a.depositCents / 100} €`;
  const map: Record<string, [string, string]> = {
    paid: [`Acompte payé ${amount}`, "bg-forest-soft text-forest"],
    awaiting: [`Acompte ${amount} en attente`, "bg-lavender-soft text-lavender"],
    manual: [`Acompte ${amount} à demander`, "bg-gold/15 text-[#7a5d22]"],
    refunded: [`Acompte ${amount} remboursé`, "bg-line text-ink-soft"],
  };
  const [label, cls] = map[a.depositStatus] ?? [a.depositStatus, "bg-line text-ink-soft"];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

export function AppointmentCard({
  appt: a,
  showDate = false,
  client,
  hasNote = false,
}: {
  appt: Appointment;
  showDate?: boolean;
  /** Fiche du client, pour signaler les points de vigilance et la fiche d'admission manquante. */
  client?: Pick<Client, "id" | "vigilance" | "admissionReceivedAt">;
  /** Un compte-rendu existe déjà dans le journal pour ce rendez-vous. */
  hasNote?: boolean;
}) {
  const past = a.endsAt < new Date();
  const s = a.status === "confirmed" && past ? { label: "Honoré", cls: "bg-forest-soft text-forest" } : STATUS[a.status];
  const inactive = ["declined", "cancelled", "no_show", "expired"].includes(a.status);
  const blocked = a.serviceId === "blocage";
  const day = parisDateStr(a.startsAt);
  const mode = MODE[a.mode] ?? MODE.cabinet;
  const vigilance =
    client?.vigilance && !/^aucune/i.test(client.vigilance.trim()) ? client.vigilance : "";
  const active = !inactive && !blocked;

  return (
    <article className={`rounded-2xl border border-line bg-white p-4 text-sm ${inactive ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            {showDate && (
              <Link href={`/admin?jour=${day}`} className="text-forest underline-offset-2 hover:underline">
                {formatDateStr(day)} ·{" "}
              </Link>
            )}
            {parisTimeStr(a.startsAt).replace(":", "h")} – {parisTimeStr(a.endsAt).replace(":", "h")}
          </p>
          <p className="font-serif text-xl leading-tight">{a.serviceName}</p>
          {!blocked &&
            (a.clientId ? (
              <Link href={`/admin/clients/${a.clientId}`} className="flex items-center gap-1 font-semibold text-forest hover:underline">
                <UserRound className="size-3.5" aria-hidden />
                {a.clientName}
              </Link>
            ) : (
              <p className="text-ink">{a.clientName}</p>
            ))}
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {!blocked && (
            <span className="flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-ink-soft">
              <mode.icon className="size-3" aria-hidden />
              {mode.label}
            </span>
          )}
          <DepositBadge a={a} />
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>
            {s.label}
            {a.source === "admin" && !blocked ? " · ajouté par vous" : ""}
          </span>
        </div>
      </div>

      {active && (vigilance || (client && !client.admissionReceivedAt)) && (
        <div className="mt-2 space-y-1">
          {vigilance && (
            <p className="flex gap-2 rounded-xl bg-clay-soft p-2.5 text-clay-dark">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                <strong>Points de vigilance :</strong> {vigilance}
              </span>
            </p>
          )}
          {client && !client.admissionReceivedAt && (
            <p className="flex items-center gap-2 text-xs font-semibold text-[#7a5d22]">
              <FileWarning className="size-3.5" aria-hidden />
              Fiche d&apos;admission pas encore reçue
            </p>
          )}
        </div>
      )}

      {(a.clientPhone || a.clientEmail) && (
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-ink-soft">
          {a.clientPhone && (
            <a href={`tel:${a.clientPhone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-1 hover:text-forest">
              <Phone className="size-3.5" aria-hidden />
              {a.clientPhone}
            </a>
          )}
          {a.clientEmail && (
            <a href={`mailto:${a.clientEmail}`} className="flex items-center gap-1 break-all hover:text-forest">
              <Mail className="size-3.5" aria-hidden />
              {a.clientEmail}
            </a>
          )}
        </p>
      )}
      {a.message && (
        <p className="mt-2 flex gap-2 rounded-xl bg-sand/70 p-2.5 text-ink-soft">
          <MessageSquare className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="whitespace-pre-line">{a.message}</span>
        </p>
      )}
      {a.adminNote && <p className="mt-2 text-xs text-ink-soft">Note : {a.adminNote}</p>}
      {a.status === "cancelled" && a.cancelledBy && (
        <p className="mt-1 text-xs text-ink-soft">
          Annulé {a.cancelledBy === "client" ? "par le client (compté pour l'acompte)" : "par vous"}
        </p>
      )}

      {a.status === "pending" && (
        <div className="mt-3 flex flex-wrap items-start gap-2">
          <form action={confirmAction}>
            <input type="hidden" name="id" value={a.id} />
            <button type="submit" className="btn btn-primary !px-4 !py-1.5 text-xs">
              Confirmer
            </button>
          </form>
          <details className="group">
            <summary className="btn btn-outline cursor-pointer list-none !px-4 !py-1.5 text-xs">Refuser…</summary>
            <form action={declineAction} className="mt-2 space-y-2 rounded-xl border border-line p-3">
              <input type="hidden" name="id" value={a.id} />
              <label className="label text-xs" htmlFor={`r-${a.id}`}>
                Message pour le client (facultatif)
              </label>
              <textarea id={`r-${a.id}`} name="reason" rows={2} className="field text-sm" placeholder="Je vous propose plutôt…" />
              {a.depositStatus === "paid" && (
                <p className="text-xs text-ink-soft">L&apos;acompte payé en ligne sera remboursé automatiquement.</p>
              )}
              <button type="submit" className="btn btn-outline !px-4 !py-1.5 text-xs">
                Refuser et prévenir par email
              </button>
            </form>
          </details>
        </div>
      )}

      {a.status === "confirmed" && past && !blocked && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {a.clientId && (
            <Link
              href={`/admin/clients/${a.clientId}?compte-rendu=${a.id}#journal`}
              className="btn btn-outline !px-3 !py-1.5 text-xs"
            >
              <NotebookPen className="size-3.5" aria-hidden />
              {hasNote ? "Voir le compte-rendu" : "Compte-rendu de séance"}
            </Link>
          )}
          <form action={noShowAction}>
            <input type="hidden" name="id" value={a.id} />
            <button type="submit" className="text-xs text-ink-soft underline-offset-2 hover:text-clay-dark hover:underline">
              Marquer absent(e)
            </button>
          </form>
        </div>
      )}
      {a.status === "no_show" && (
        <form action={attendedAction} className="mt-3">
          <input type="hidden" name="id" value={a.id} />
          <button type="submit" className="text-xs text-ink-soft underline-offset-2 hover:text-forest hover:underline">
            Annuler l&apos;absence (séance honorée)
          </button>
        </form>
      )}

      {(a.status === "confirmed" || a.status === "pending") && !past && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-ink-soft underline-offset-2 hover:text-forest hover:underline">
            {blocked ? "Débloquer ce créneau" : "Annuler ce rendez-vous…"}
          </summary>
          <form action={cancelAction} className="mt-2 space-y-2 rounded-xl border border-line p-3">
            <input type="hidden" name="id" value={a.id} />
            {!blocked && (
              <fieldset className="space-y-1 text-xs">
                <legend className="font-semibold">Qui annule ?</legend>
                <label className="flex items-center gap-2">
                  <input type="radio" name="by" value="client" defaultChecked className="accent-forest" />
                  Le client me l&apos;a demandé (compte pour l&apos;acompte{a.depositStatus === "paid" ? ", acompte conservé" : ""})
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="by" value="admin" className="accent-forest" />
                  C&apos;est moi qui annule{a.depositStatus === "paid" ? " (acompte remboursé)" : ""}
                </label>
              </fieldset>
            )}
            {!blocked && a.clientEmail && (
              <>
                <textarea name="reason" rows={2} className="field text-sm" placeholder="Message pour le client (facultatif)" />
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" name="notify" defaultChecked className="accent-forest" />
                  Prévenir le client par email
                </label>
              </>
            )}
            <button type="submit" className="btn btn-outline !px-4 !py-1.5 text-xs">
              {blocked ? "Débloquer" : "Confirmer l'annulation"}
            </button>
          </form>
        </details>
      )}
    </article>
  );
}
