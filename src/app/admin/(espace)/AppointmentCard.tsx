import Link from "next/link";
import { Mail, MessageSquare, Phone, UserRound } from "lucide-react";
import type { Appointment } from "@/lib/db/schema";
import { formatDateStr, parisDateStr, parisTimeStr } from "@/lib/time";
import { attendedAction, cancelAction, confirmAction, declineAction, noShowAction } from "../actions";

const STATUS: Record<Appointment["status"], { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-gold/15 text-[#7a5d22]" },
  confirmed: { label: "Confirmé", cls: "bg-sage/20 text-forest" },
  declined: { label: "Refusé", cls: "bg-line text-ink-soft" },
  cancelled: { label: "Annulé", cls: "bg-line text-ink-soft" },
  no_show: { label: "Absent(e)", cls: "bg-clay-soft text-clay-dark" },
};

export function AppointmentCard({ appt: a, showDate = false }: { appt: Appointment; showDate?: boolean }) {
  const past = a.endsAt < new Date();
  const s = a.status === "confirmed" && past ? { label: "Honoré", cls: "bg-forest-soft text-forest" } : STATUS[a.status];
  const inactive = a.status === "declined" || a.status === "cancelled" || a.status === "no_show";
  const blocked = a.serviceId === "blocage";
  const day = parisDateStr(a.startsAt);

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
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>
          {s.label}
          {a.source === "admin" && !blocked ? " · ajouté par vous" : ""}
        </span>
      </div>

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
              <button type="submit" className="btn btn-outline !px-4 !py-1.5 text-xs">
                Refuser et prévenir par email
              </button>
            </form>
          </details>
        </div>
      )}

      {a.status === "confirmed" && past && !blocked && (
        <form action={noShowAction} className="mt-3">
          <input type="hidden" name="id" value={a.id} />
          <button type="submit" className="text-xs text-ink-soft underline-offset-2 hover:text-clay-dark hover:underline">
            Marquer absent(e)
          </button>
        </form>
      )}
      {a.status === "no_show" && (
        <form action={attendedAction} className="mt-3">
          <input type="hidden" name="id" value={a.id} />
          <button type="submit" className="text-xs text-ink-soft underline-offset-2 hover:text-forest hover:underline">
            Annuler l&apos;absence (séance honorée)
          </button>
        </form>
      )}

      {a.status === "confirmed" && !past && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-ink-soft underline-offset-2 hover:text-forest hover:underline">
            {blocked ? "Débloquer ce créneau" : "Annuler ce rendez-vous…"}
          </summary>
          <form action={cancelAction} className="mt-2 space-y-2 rounded-xl border border-line p-3">
            <input type="hidden" name="id" value={a.id} />
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
