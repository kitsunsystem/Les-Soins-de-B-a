"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { Range } from "@/lib/availability";
import { resetDayAction, saveDayAction, type ActionState } from "../actions";
import { RangesEditor } from "./RangesEditor";

const fmt = (r: Range[]) => r.map((x) => `${x.start.replace(":", "h")}–${x.end.replace(":", "h")}`).join(", ");

export function DayHoursEditor({
  date,
  weekdayLabel,
  weeklyRanges,
  override,
}: {
  date: string;
  weekdayLabel: string;
  weeklyRanges: Range[];
  override: { closed: boolean; ranges: Range[]; note: string } | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const base = override ?? { closed: weeklyRanges.length === 0, ranges: weeklyRanges, note: "" };
  const [closed, setClosed] = useState(base.closed);
  const [ranges, setRanges] = useState<Range[]>(base.ranges.length ? base.ranges : [{ start: "09:00", end: "12:00" }]);
  const [note, setNote] = useState(base.note);
  const [msg, setMsg] = useState<ActionState>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<ActionState>) =>
    start(async () => {
      const res = await fn();
      setMsg(res);
      if (res?.ok) {
        setEditing(false);
        router.refresh();
      }
    });

  const current = override
    ? override.closed
      ? `Fermé${override.note ? ` — ${override.note}` : ""}`
      : fmt(override.ranges)
    : weeklyRanges.length
      ? fmt(weeklyRanges)
      : "Fermé";

  return (
    <div className="mt-3 text-sm">
      <p>
        <span className="text-ink-soft">Disponibilités : </span>
        <strong className="font-medium">{current}</strong>
      </p>
      <p className="mt-0.5 text-xs text-ink-soft">
        {override ? "Horaires spécifiques à ce jour." : `Horaires habituels du ${weekdayLabel}.`}
      </p>

      {msg?.ok && !editing && <p className="mt-2 text-xs text-forest">{msg.ok}</p>}

      {!editing ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setEditing(true)} className="btn btn-outline !px-3 !py-1.5 text-xs">
            Modifier ce jour
          </button>
          {!base.closed && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => saveDayAction({ date, closed: true, ranges: [], note: "Fermé" }))}
              className="btn btn-outline !px-3 !py-1.5 text-xs"
            >
              Fermer ce jour
            </button>
          )}
          {override && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => resetDayAction(date))}
              className="btn btn-outline !px-3 !py-1.5 text-xs"
            >
              Revenir aux horaires habituels
            </button>
          )}
          {pending && <Loader2 className="size-4 animate-spin self-center text-forest" aria-label="Enregistrement" />}
        </div>
      ) : (
        <div className="mt-4 space-y-4 rounded-xl border border-line bg-sand/40 p-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={closed} onChange={(e) => setClosed(e.target.checked)} className="size-4 accent-forest" />
            Jour fermé (congés, indisponibilité…)
          </label>
          {!closed && <RangesEditor ranges={ranges} onChange={setRanges} idPrefix={`day-${date}`} />}
          <div>
            <label htmlFor="day-note" className="label text-xs">
              Note interne (facultatif)
            </label>
            <input id="day-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className="field !py-1.5 text-sm" placeholder="Ex. formation, congés…" />
          </div>
          {msg?.error && (
            <p role="alert" className="text-xs text-clay-dark">
              {msg.error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => saveDayAction({ date, closed, ranges: closed ? [] : ranges, note }))}
              className="btn btn-primary !px-4 !py-1.5 text-xs"
            >
              {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              Enregistrer pour ce jour
            </button>
            <button type="button" onClick={() => setEditing(false)} className="btn btn-outline !px-4 !py-1.5 text-xs">
              Annuler
            </button>
          </div>
          <p className="text-xs text-ink-soft">
            Les rendez-vous déjà pris ne sont pas modifiés : seuls les nouveaux créneaux proposés en ligne changent.
          </p>
        </div>
      )}
    </div>
  );
}
