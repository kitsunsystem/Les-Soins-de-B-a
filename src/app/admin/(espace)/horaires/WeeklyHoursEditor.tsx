"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { Range, WeeklyHour } from "@/lib/availability";
import { weekdayNames } from "@/lib/time";
import { saveWeeklyAction, type ActionState } from "../../actions";
import { RangesEditor } from "../RangesEditor";

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // lundi → dimanche

export function WeeklyHoursEditor({ initial }: { initial: WeeklyHour[] }) {
  const router = useRouter();
  const [days, setDays] = useState<Record<number, Range[]>>(() => {
    const d: Record<number, Range[]> = {};
    for (const wd of ORDER) d[wd] = initial.filter((w) => w.weekday === wd).map(({ start, end }) => ({ start, end }));
    return d;
  });
  const [msg, setMsg] = useState<ActionState>(null);
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      const rows = ORDER.flatMap((wd) => days[wd].map((r) => ({ weekday: wd, ...r })));
      const res = await saveWeeklyAction(rows);
      setMsg(res);
      if (res?.ok) router.refresh();
    });

  return (
    <div className="mt-5">
      <ul className="divide-y divide-line">
        {ORDER.map((wd) => {
          const open = days[wd].length > 0;
          return (
            <li key={wd} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
              <label className="flex w-36 shrink-0 items-center gap-2 pt-1.5 font-medium">
                <input
                  type="checkbox"
                  checked={open}
                  onChange={(e) =>
                    setDays((d) => ({
                      ...d,
                      [wd]: e.target.checked ? [{ start: "09:00", end: "12:30" }, { start: "14:00", end: "19:00" }] : [],
                    }))
                  }
                  className="size-4 accent-forest"
                />
                {weekdayNames[wd]}
              </label>
              {open ? (
                <RangesEditor ranges={days[wd]} onChange={(r) => setDays((d) => ({ ...d, [wd]: r }))} idPrefix={`wd${wd}`} />
              ) : (
                <span className="pt-1.5 text-sm text-ink-soft">Fermé</span>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className="btn btn-primary !py-2 text-sm">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Enregistrer les horaires
        </button>
        {msg?.ok && <span className="text-sm text-forest">{msg.ok}</span>}
        {msg?.error && (
          <span role="alert" className="text-sm text-clay-dark">
            {msg.error}
          </span>
        )}
      </div>
    </div>
  );
}
