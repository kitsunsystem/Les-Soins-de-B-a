// Outils de dates « Europe/Paris », sans dépendance.
// Les créneaux sont saisis en heure locale du cabinet et stockés en UTC.

export const TZ = "Europe/Paris";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function zonedParts(date: Date) {
  const p: Record<string, number> = {};
  for (const { type, value } of partsFormatter.formatToParts(date)) {
    if (type !== "literal") p[type] = Number(value);
  }
  return p as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** Décalage (en ms) entre l'heure de Paris et l'UTC à un instant donné. */
function offsetAt(date: Date) {
  const p = zonedParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** « 2026-11-20 » + « 14:30 » (heure de Paris) → instant UTC. */
export function parisToUtc(dateStr: string, time: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let ts = guess - offsetAt(new Date(guess));
  // Second passage pour les changements d'heure.
  ts = guess - offsetAt(new Date(ts));
  return new Date(ts);
}

/** Date du jour à Paris au format AAAA-MM-JJ. */
export function parisDateStr(date: Date): string {
  const p = zonedParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Heure à Paris au format HH:MM. */
export function parisTimeStr(date: Date): string {
  const p = zonedParts(date);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Jour de la semaine d'une date AAAA-MM-JJ (0 = dimanche … 6 = samedi). */
export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** Liste des jours (AAAA-MM-JJ) d'un mois « AAAA-MM ». */
export function daysOfMonth(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => `${y}-${pad(m)}-${pad(i + 1)}`);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}`;
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export const isDateStr = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
export const isMonthStr = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}$/.test(s);
export const isTimeStr = (s: unknown): s is string =>
  typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

const longDate = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** « vendredi 20 novembre 2026 » */
export function formatLongDate(date: Date): string {
  return longDate.format(date);
}

/** « vendredi 20 novembre 2026 à 14h30 » */
export function formatDateTime(date: Date): string {
  return `${formatLongDate(date)} à ${parisTimeStr(date).replace(":", "h")}`;
}

/** Libellé d'une date AAAA-MM-JJ, sans ambiguïté de fuseau. */
export function formatDateStr(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    ...opts,
  }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

export function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const s = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", month: "long", year: "numeric" }).format(
    new Date(Date.UTC(y, m - 1, 15)),
  );
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const weekdayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
