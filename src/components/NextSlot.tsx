"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { formatDateStr, parisDateStr, shiftMonth } from "@/lib/time";

type Avail = { days: Record<string, string[]>; enabled: boolean };

/** Affiche le prochain créneau libre (donnée en direct de l'agenda de Béa). */
export function NextSlot({ serviceId = "massage-relaxant", className = "" }: { serviceId?: string; className?: string }) {
  const [slot, setSlot] = useState<{ date: string; time: string } | null | undefined>(undefined);

  useEffect(() => {
    const ctrl = new AbortController();
    const month = parisDateStr(new Date()).slice(0, 7);
    (async () => {
      for (const m of [month, shiftMonth(month, 1)]) {
        const res = await fetch(`/api/disponibilites?soin=${serviceId}&mois=${m}`, { signal: ctrl.signal });
        const json = (await res.json()) as Avail;
        if (!json.enabled) return setSlot(null);
        const first = Object.keys(json.days).sort()[0];
        if (first) return setSlot({ date: first, time: json.days[first][0] });
      }
      setSlot(null);
    })().catch(() => setSlot(null));
    return () => ctrl.abort();
  }, [serviceId]);

  if (slot === null) return null;
  return (
    <Link
      href="/rendez-vous"
      className={`flex items-center gap-3 rounded-2xl bg-card/95 p-3.5 pr-5 shadow-soft backdrop-blur transition-transform hover:-translate-y-0.5 ${className}`}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-forest text-linen">
        <CalendarCheck className="size-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-clay">Prochain créneau libre</span>
        {slot ? (
          <span className="mt-1 block font-semibold text-ink first-letter:uppercase">
            {formatDateStr(slot.date)} · {slot.time.replace(":", "h")}
          </span>
        ) : (
          <span className="mt-1 block h-4 w-36 animate-pulse rounded bg-sand" aria-label="Chargement" />
        )}
      </span>
    </Link>
  );
}
