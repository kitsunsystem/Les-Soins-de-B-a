"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Range } from "@/lib/availability";

/** Liste éditable de plages horaires (ex. 09:00–12:30, 14:00–19:00). */
export function RangesEditor({
  ranges,
  onChange,
  idPrefix,
}: {
  ranges: Range[];
  onChange: (r: Range[]) => void;
  idPrefix: string;
}) {
  const update = (i: number, key: keyof Range, value: string) =>
    onChange(ranges.map((r, j) => (j === i ? { ...r, [key]: value } : r)));

  return (
    <div className="space-y-2">
      {ranges.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`${idPrefix}-s${i}`}>
            Début
          </label>
          <input
            id={`${idPrefix}-s${i}`}
            type="time"
            step={300}
            value={r.start}
            onChange={(e) => update(i, "start", e.target.value)}
            className="field !w-auto !py-1.5"
          />
          <span className="text-ink-soft">→</span>
          <label className="sr-only" htmlFor={`${idPrefix}-e${i}`}>
            Fin
          </label>
          <input
            id={`${idPrefix}-e${i}`}
            type="time"
            step={300}
            value={r.end}
            onChange={(e) => update(i, "end", e.target.value)}
            className="field !w-auto !py-1.5"
          />
          <button
            type="button"
            onClick={() => onChange(ranges.filter((_, j) => j !== i))}
            className="grid size-9 place-items-center rounded-full text-ink-soft hover:bg-rose-soft hover:text-rose-darker"
            aria-label="Supprimer cette plage"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          const last = ranges.at(-1);
          onChange([...ranges, last ? { start: last.end, end: last.end < "18:00" ? "19:00" : "21:00" } : { start: "09:00", end: "12:00" }]);
        }}
        className="flex items-center gap-1.5 text-xs font-medium text-rose-deep hover:underline"
      >
        <Plus className="size-3.5" aria-hidden />
        Ajouter une plage
      </button>
    </div>
  );
}
