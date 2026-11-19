import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, eq, gte, inArray, isNull, lt, lte, sql } from "drizzle-orm";
import {
  rangesForDate,
  slotsForDate,
  sortRanges,
  type BookingRules,
  type DateOverride,
  type Range,
  type WeeklyHour,
} from "./availability";
import { getService } from "./content";
import { getDb, type DB } from "./db";
import { appointments, dateOverrides, settings, weeklyHours, type Appointment, type Settings } from "./db/schema";
import {
  mailBookingAdmin,
  mailBookingConfirmed,
  mailBookingDeclined,
  mailBookingReceived,
  mailCancelledByAdmin,
  mailCancelledByClient,
  mailReminder,
} from "./emails";
import { addDays, daysOfMonth, parisDateStr, parisToUtc } from "./time";

const ACTIVE = ["pending", "confirmed"] as const;
const DEFAULT_SETTINGS: Settings = {
  id: 1,
  slotStepMinutes: 30,
  bufferMinutes: 15,
  minNoticeHours: 24,
  maxDaysAhead: 60,
  autoConfirm: false,
  bookingEnabled: true,
  bookingNotice: "",
};

export async function getSettings(db?: DB): Promise<Settings> {
  const d = db ?? (await getDb());
  const [row] = await d.select().from(settings).where(eq(settings.id, 1));
  return row ?? DEFAULT_SETTINGS;
}

export async function getWeeklyHours(db?: DB): Promise<WeeklyHour[]> {
  const d = db ?? (await getDb());
  return d
    .select({ weekday: weeklyHours.weekday, start: weeklyHours.start, end: weeklyHours.end })
    .from(weeklyHours)
    .orderBy(asc(weeklyHours.weekday), asc(weeklyHours.start));
}

export async function getOverrides(from: string, to: string, db?: DB) {
  const d = db ?? (await getDb());
  const rows = await d
    .select()
    .from(dateOverrides)
    .where(and(gte(dateOverrides.date, from), lte(dateOverrides.date, to)))
    .orderBy(asc(dateOverrides.date));
  return rows;
}

async function getBusy(from: Date, to: Date, db: DB) {
  return db
    .select({ startsAt: appointments.startsAt, endsAt: appointments.endsAt })
    .from(appointments)
    .where(and(inArray(appointments.status, [...ACTIVE]), lt(appointments.startsAt, to), gte(appointments.endsAt, from)));
}

function rulesOf(s: Settings): BookingRules {
  return {
    slotStepMinutes: s.slotStepMinutes,
    bufferMinutes: s.bufferMinutes,
    minNoticeHours: s.minNoticeHours,
    maxDaysAhead: s.maxDaysAhead,
  };
}

/** Créneaux libres de chaque jour d'un mois, pour un soin donné. */
export async function getMonthAvailability(serviceId: string, month: string) {
  const service = getService(serviceId);
  const db = await getDb();
  const s = await getSettings(db);
  const days = daysOfMonth(month);
  const result: Record<string, string[]> = {};
  if (!service?.durationMinutes || !s.bookingEnabled) {
    return { days: result, settings: s };
  }
  const [weekly, overrides] = await Promise.all([
    getWeeklyHours(db),
    getOverrides(days[0], days[days.length - 1], db),
  ]);
  const overrideMap = new Map<string, DateOverride>(overrides.map((o) => [o.date, o]));
  const busy = await getBusy(parisToUtc(addDays(days[0], -1), "00:00"), parisToUtc(addDays(days.at(-1)!, 2), "00:00"), db);
  const now = new Date();
  for (const date of days) {
    const slots = slotsForDate({
      date,
      duration: service.durationMinutes,
      ranges: rangesForDate(date, weekly, overrideMap),
      busy,
      rules: rulesOf(s),
      now,
    });
    if (slots.length) result[date] = slots.map((x) => x.time);
  }
  return { days: result, settings: s };
}

export type BookingInput = {
  serviceId: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  message: string;
};

export class BookingError extends Error {}

const newToken = () => randomBytes(24).toString("base64url");

/** Crée une demande de rendez-vous en ligne (vérifie à nouveau le créneau, sous verrou). */
export async function createBooking(input: BookingInput): Promise<Appointment> {
  const service = getService(input.serviceId);
  if (!service?.durationMinutes) throw new BookingError("Ce soin se réserve sur demande : contactez-moi directement.");
  const duration = service.durationMinutes;
  const db = await getDb();

  const appt = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(424242)`);
    const s = await getSettings(tx as unknown as DB);
    if (!s.bookingEnabled) throw new BookingError("La réservation en ligne est momentanément suspendue.");
    const weekly = await getWeeklyHours(tx as unknown as DB);
    const overrides = await getOverrides(input.date, input.date, tx as unknown as DB);
    const startsAt = parisToUtc(input.date, input.time);
    const endsAt = new Date(startsAt.getTime() + duration * 60_000);
    const busy = await getBusy(
      new Date(startsAt.getTime() - 24 * 3600_000),
      new Date(endsAt.getTime() + 24 * 3600_000),
      tx as unknown as DB,
    );
    const slots = slotsForDate({
      date: input.date,
      duration,
      ranges: rangesForDate(input.date, weekly, new Map(overrides.map((o) => [o.date, o]))),
      busy,
      rules: rulesOf(s),
      now: new Date(),
    });
    if (!slots.some((x) => x.time === input.time)) {
      throw new BookingError("Ce créneau vient d'être réservé ou n'est plus disponible. Merci d'en choisir un autre.");
    }
    const [row] = await tx
      .insert(appointments)
      .values({
        serviceId: service.id,
        serviceName: service.name,
        durationMinutes: duration,
        startsAt,
        endsAt,
        status: s.autoConfirm ? "confirmed" : "pending",
        clientName: input.name,
        clientEmail: input.email,
        clientPhone: input.phone,
        message: input.message,
        source: "online",
        cancelToken: newToken(),
      })
      .returning();
    return row;
  });

  await Promise.allSettled([mailBookingReceived(appt), mailBookingAdmin(appt)]);
  return appt;
}

// ——— Espace admin ———

export async function listAppointments(from: Date, to: Date) {
  const db = await getDb();
  return db
    .select()
    .from(appointments)
    .where(and(gte(appointments.startsAt, from), lt(appointments.startsAt, to)))
    .orderBy(asc(appointments.startsAt));
}

export async function listPending() {
  const db = await getDb();
  return db
    .select()
    .from(appointments)
    .where(and(eq(appointments.status, "pending"), gte(appointments.endsAt, new Date())))
    .orderBy(asc(appointments.startsAt));
}

export async function listUpcoming(limit = 8) {
  const db = await getDb();
  return db
    .select()
    .from(appointments)
    .where(and(eq(appointments.status, "confirmed"), gte(appointments.endsAt, new Date())))
    .orderBy(asc(appointments.startsAt))
    .limit(limit);
}

async function updateStatus(id: string, status: Appointment["status"], extra: Partial<Appointment> = {}) {
  const db = await getDb();
  const [row] = await db
    .update(appointments)
    .set({ status, updatedAt: new Date(), ...extra })
    .where(eq(appointments.id, id))
    .returning();
  return row;
}

export async function confirmAppointment(id: string) {
  const row = await updateStatus(id, "confirmed");
  if (row) await mailBookingConfirmed(row);
  return row;
}

export async function declineAppointment(id: string, reason: string) {
  const row = await updateStatus(id, "declined", reason ? { adminNote: reason } : {});
  if (row) await mailBookingDeclined(row, reason);
  return row;
}

export async function cancelAppointmentByAdmin(id: string, reason: string, notify: boolean) {
  const row = await updateStatus(id, "cancelled", reason ? { adminNote: reason } : {});
  if (row && notify) await mailCancelledByAdmin(row, reason);
  return row;
}

/** Rendez-vous ou créneau bloqué ajouté manuellement par Béa (pris par téléphone, etc.). */
export async function createManualAppointment(input: {
  date: string;
  time: string;
  durationMinutes: number;
  serviceId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  note: string;
  notify: boolean;
}) {
  const service = getService(input.serviceId);
  const startsAt = parisToUtc(input.date, input.time);
  const db = await getDb();
  const [row] = await db
    .insert(appointments)
    .values({
      serviceId: service?.id ?? "blocage",
      serviceName: service?.name ?? "Créneau bloqué",
      durationMinutes: input.durationMinutes,
      startsAt,
      endsAt: new Date(startsAt.getTime() + input.durationMinutes * 60_000),
      status: "confirmed",
      clientName: input.clientName || (service ? "Client" : "Indisponible"),
      clientEmail: input.clientEmail,
      clientPhone: input.clientPhone,
      adminNote: input.note,
      source: "admin",
      cancelToken: newToken(),
    })
    .returning();
  if (row && input.notify && row.clientEmail) await mailBookingConfirmed(row);
  return row;
}

export async function getByToken(token: string) {
  if (!token || token.length < 20) return undefined;
  const db = await getDb();
  const [row] = await db.select().from(appointments).where(eq(appointments.cancelToken, token));
  return row;
}

export const CLIENT_CANCEL_LIMIT_HOURS = 24;

export function canClientCancel(a: Appointment) {
  return ACTIVE.includes(a.status as (typeof ACTIVE)[number]) &&
    a.startsAt.getTime() - Date.now() > CLIENT_CANCEL_LIMIT_HOURS * 3600_000;
}

export async function cancelByClient(token: string) {
  const a = await getByToken(token);
  if (!a) throw new BookingError("Rendez-vous introuvable.");
  if (!canClientCancel(a)) {
    throw new BookingError("Ce rendez-vous ne peut plus être annulé en ligne. Merci d'appeler directement.");
  }
  const row = await updateStatus(a.id, "cancelled", { adminNote: "Annulé par le client en ligne" });
  if (row) await mailCancelledByClient(row);
  return row;
}

// ——— Disponibilités ———

export async function replaceWeeklyHours(rows: WeeklyHour[]) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.delete(weeklyHours);
    const clean = rows.flatMap((r) => sortRanges([r]).map((x) => ({ weekday: r.weekday, ...x })));
    if (clean.length) await tx.insert(weeklyHours).values(clean);
  });
}

export async function setOverride(date: string, closed: boolean, ranges: Range[], note: string) {
  const db = await getDb();
  const values = { date, closed, ranges: closed ? [] : sortRanges(ranges), note };
  await db.insert(dateOverrides).values(values).onConflictDoUpdate({ target: dateOverrides.date, set: values });
}

export async function deleteOverride(date: string) {
  const db = await getDb();
  await db.delete(dateOverrides).where(eq(dateOverrides.date, date));
}

export async function closePeriod(from: string, to: string, note: string) {
  const db = await getDb();
  const values: { date: string; closed: boolean; ranges: Range[]; note: string }[] = [];
  for (let d = from; d <= to && values.length < 370; d = addDays(d, 1)) {
    values.push({ date: d, closed: true, ranges: [], note });
  }
  if (!values.length) return 0;
  await db
    .insert(dateOverrides)
    .values(values)
    .onConflictDoUpdate({
      target: dateOverrides.date,
      set: { closed: true, ranges: [], note: sql`excluded.note` },
    });
  return values.length;
}

export async function updateSettings(values: Omit<Settings, "id">) {
  const db = await getDb();
  await db
    .insert(settings)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: settings.id, set: values });
}

// ——— Rappels (tâche planifiée quotidienne) ———

export async function sendReminders() {
  const db = await getDb();
  const tomorrow = addDays(parisDateStr(new Date()), 1);
  const from = parisToUtc(tomorrow, "00:00");
  const to = parisToUtc(addDays(tomorrow, 1), "00:00");
  const rows = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.status, "confirmed"),
        gte(appointments.startsAt, from),
        lt(appointments.startsAt, to),
        isNull(appointments.reminderSentAt),
      ),
    );
  let sent = 0;
  for (const a of rows) {
    if (!a.clientEmail) continue;
    if (await mailReminder(a)) {
      sent++;
      await db.update(appointments).set({ reminderSentAt: new Date() }).where(eq(appointments.id, a.id));
    }
  }
  return { candidates: rows.length, sent };
}
