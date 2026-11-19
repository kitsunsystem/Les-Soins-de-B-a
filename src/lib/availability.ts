// Calcul des créneaux disponibles — fonctions pures (testées dans availability.test.ts).
import { addDays, fromMinutes, parisDateStr, parisToUtc, toMinutes, weekdayOf } from "./time";

export type Range = { start: string; end: string };

export type BookingRules = {
  slotStepMinutes: number;
  bufferMinutes: number;
  minNoticeHours: number;
  maxDaysAhead: number;
};

export type WeeklyHour = { weekday: number; start: string; end: string };
export type DateOverride = { date: string; closed: boolean; ranges: Range[]; note?: string };
export type Busy = { startsAt: Date; endsAt: Date };

/** Plages d'ouverture d'un jour : exception datée en priorité, sinon horaires habituels. */
export function rangesForDate(date: string, weekly: WeeklyHour[], overrides: Map<string, DateOverride>): Range[] {
  const o = overrides.get(date);
  if (o) return o.closed ? [] : sortRanges(o.ranges);
  const wd = weekdayOf(date);
  return sortRanges(weekly.filter((w) => w.weekday === wd).map(({ start, end }) => ({ start, end })));
}

export function sortRanges(ranges: Range[]): Range[] {
  return [...ranges]
    .filter((r) => toMinutes(r.end) > toMinutes(r.start))
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

export type Slot = { time: string; startsAt: Date; endsAt: Date };

/** Créneaux libres pour un soin de `duration` minutes à une date donnée. */
export function slotsForDate(params: {
  date: string;
  duration: number;
  ranges: Range[];
  busy: Busy[];
  rules: BookingRules;
  now: Date;
}): Slot[] {
  const { date, duration, ranges, busy, rules, now } = params;
  const today = parisDateStr(now);
  const lastDay = addDays(today, rules.maxDaysAhead);
  if (date < today || date > lastDay) return [];

  const earliest = now.getTime() + rules.minNoticeHours * 3600_000;
  const buffer = rules.bufferMinutes * 60_000;
  const step = Math.max(5, rules.slotStepMinutes);
  const slots: Slot[] = [];

  for (const r of ranges) {
    const startMin = toMinutes(r.start);
    const endMin = toMinutes(r.end);
    for (let t = startMin; t + duration <= endMin; t += step) {
      const time = fromMinutes(t);
      const startsAt = parisToUtc(date, time);
      const endsAt = new Date(startsAt.getTime() + duration * 60_000);
      if (startsAt.getTime() < earliest) continue;
      const clash = busy.some(
        (b) => b.startsAt.getTime() - buffer < endsAt.getTime() && b.endsAt.getTime() + buffer > startsAt.getTime(),
      );
      if (!clash) slots.push({ time, startsAt, endsAt });
    }
  }
  return slots;
}

/** Vérifie qu'un créneau précis est réservable (utilisé à la création d'un rendez-vous). */
export function isSlotAvailable(params: {
  date: string;
  time: string;
  duration: number;
  ranges: Range[];
  busy: Busy[];
  rules: BookingRules;
  now: Date;
}): boolean {
  return slotsForDate(params).some((s) => s.time === params.time);
}
