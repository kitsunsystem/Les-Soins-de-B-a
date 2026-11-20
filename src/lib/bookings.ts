import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, eq, gt, gte, inArray, isNull, lt, lte, ne, or, sql } from "drizzle-orm";
import {
  rangesForDate,
  slotsForDate,
  sortRanges,
  type BookingRules,
  type DateOverride,
  type Range,
  type WeeklyHour,
} from "./availability";
import { countIncidents, findClient, findOrCreateClient, upsertClient } from "./clients";
import { getService, modesOf } from "./content";
import { getDb, type DB } from "./db";
import {
  appointments,
  clients,
  dateOverrides,
  settings,
  weeklyHours,
  type Appointment,
  type AppointmentMode,
  type Client,
  type Settings,
} from "./db/schema";
import {
  mailBookingAdmin,
  mailBookingConfirmed,
  mailBookingDeclined,
  mailBookingReceived,
  mailCancelledByAdmin,
  mailCancelledByClient,
  mailReminder,
} from "./emails";
import { createDepositCheckout, expireCheckout, refundPayment, retrieveCheckout, stripeConfigured } from "./stripe";
import { addDays, daysOfMonth, parisDateStr, parisToUtc } from "./time";
import { admissionPath, getBaseUrl } from "./urls";

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
  depositEnabled: false,
  depositAmount: 20,
  depositThreshold: 2,
};

/** Durée pendant laquelle le créneau est retenu le temps de payer l'acompte (Stripe exige au moins 30 min). */
const HOLD_MINUTES = 32;

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

/** Rendez-vous qui occupent le créneau : en attente de confirmation, confirmés, ou retenus le temps du paiement. */
const occupying = () =>
  or(
    inArray(appointments.status, [...ACTIVE]),
    and(eq(appointments.status, "awaiting_payment"), gt(appointments.holdExpiresAt, new Date())),
  );

async function getBusy(from: Date, to: Date, db: DB) {
  return db
    .select({ startsAt: appointments.startsAt, endsAt: appointments.endsAt })
    .from(appointments)
    .where(and(occupying(), lt(appointments.startsAt, to), gte(appointments.endsAt, from)));
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
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  mode: AppointmentMode;
  /** La personne a accepté de payer l'acompte demandé. */
  acceptDeposit?: boolean;
};

export type BookingResult =
  | { kind: "booked"; appt: Appointment; admissionUrl: string | null }
  | { kind: "deposit_required"; amount: number; online: boolean }
  | { kind: "payment"; url: string };

export class BookingError extends Error {}

const newToken = () => randomBytes(24).toString("base64url");

/** Acompte demandé à cette personne ? (selon ses annulations/absences et le réglage de sa fiche) */
export async function depositFor(s: Settings, client: Client | undefined, db?: DB) {
  const amount = s.depositAmount;
  if (!client || client.depositPolicy === "never" || amount <= 0) return { required: false, amount };
  if (client.depositPolicy === "always") return { required: true, amount };
  if (!s.depositEnabled) return { required: false, amount };
  const incidents = await countIncidents(client.id, db);
  return { required: incidents >= s.depositThreshold, amount };
}

async function admissionUrlFor(client: Client | undefined) {
  if (!client?.admissionToken || client.admissionReceivedAt) return null;
  return `${await getBaseUrl()}${admissionPath(client.admissionToken)}`;
}

/**
 * Crée une demande de rendez-vous en ligne.
 * Le créneau est vérifié, puis inséré par une requête unique et atomique qui échoue si un autre
 * rendez-vous chevauche entre-temps (D1 exécute les écritures une par une) : pas de double réservation.
 * Une demande en attente de confirmation — ou en cours de paiement d'acompte — bloque déjà le créneau.
 */
export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const service = getService(input.serviceId);
  if (!service?.durationMinutes) throw new BookingError("Ce soin se réserve sur demande : contactez-moi directement.");
  const modes = modesOf(service);
  const remote = input.mode !== "cabinet";
  if (remote && !modes.includes("distance")) throw new BookingError("Ce soin se pratique uniquement au cabinet.");
  if (!remote && !modes.includes("cabinet")) throw new BookingError("Ce soin se pratique uniquement à distance.");
  const duration = service.durationMinutes;
  const db = await getDb();

  const s = await getSettings(db);
  if (!s.bookingEnabled) throw new BookingError("La réservation en ligne est momentanément suspendue.");
  const [weekly, overrides] = await Promise.all([getWeeklyHours(db), getOverrides(input.date, input.date, db)]);
  const startsAt = parisToUtc(input.date, input.time);
  const endsAt = new Date(startsAt.getTime() + duration * 60_000);
  const busy = await getBusy(
    new Date(startsAt.getTime() - 24 * 3600_000),
    new Date(endsAt.getTime() + 24 * 3600_000),
    db,
  );
  const slots = slotsForDate({
    date: input.date,
    duration,
    ranges: rangesForDate(input.date, weekly, new Map(overrides.map((o) => [o.date, o]))),
    busy,
    rules: rulesOf(s),
    now: new Date(),
  });
  const taken = "Ce créneau vient d'être réservé ou n'est plus disponible. Merci d'en choisir un autre.";
  if (!slots.some((x) => x.time === input.time)) throw new BookingError(taken);

  // Acompte : demandé selon l'historique (annulations, absences) de la personne.
  const known = await findClient(input.email, input.phone, db, `${input.firstName} ${input.lastName}`);
  const deposit = await depositFor(s, known, db);
  if (deposit.required && !input.acceptDeposit) {
    return { kind: "deposit_required", amount: deposit.amount, online: stripeConfigured() };
  }
  const online = deposit.required && stripeConfigured();

  const id = crypto.randomUUID();
  const now = Date.now();
  const buffer = s.bufferMinutes * 60_000;
  const status = online ? "awaiting_payment" : deposit.required || !s.autoConfirm ? "pending" : "confirmed";
  const holdUntil = online ? now + HOLD_MINUTES * 60_000 : null;
  const name = `${input.firstName} ${input.lastName}`.trim();
  const result = await db.run(sql`
    INSERT INTO appointments (id, service_id, service_name, duration_minutes, starts_at, ends_at, status,
      client_name, client_email, client_phone, message, source, cancel_token, admin_note, created_at, updated_at,
      mode, deposit_cents, deposit_status, hold_expires_at)
    SELECT ${id}, ${service.id}, ${service.name}, ${duration}, ${startsAt.getTime()}, ${endsAt.getTime()},
      ${status}, ${name}, ${input.email}, ${input.phone}, ${input.message},
      'online', ${newToken()}, '', ${now}, ${now},
      ${input.mode}, ${deposit.required ? deposit.amount * 100 : 0},
      ${deposit.required ? (online ? "awaiting" : "manual") : ""}, ${holdUntil}
    WHERE NOT EXISTS (
      SELECT 1 FROM appointments
      WHERE (status IN ('pending', 'confirmed') OR (status = 'awaiting_payment' AND hold_expires_at > ${now}))
        AND starts_at < ${endsAt.getTime() + buffer}
        AND ends_at > ${startsAt.getTime() - buffer}
    )`);
  if (!result.meta.changes) throw new BookingError(taken);

  // Rattache le rendez-vous à la fiche client (créée si nécessaire).
  let client: Client | undefined;
  let created = false;
  try {
    const r = await upsertClient(
      { name, firstName: input.firstName, lastName: input.lastName, email: input.email, phone: input.phone },
      db,
    );
    if (r) {
      client = r.client;
      created = r.created;
      await db.update(appointments).set({ clientId: r.client.id }).where(eq(appointments.id, id));
    }
  } catch (e) {
    console.error("[crm] rattachement client impossible", e);
  }

  if (online) {
    try {
      const base = await getBaseUrl();
      const checkout = await createDepositCheckout({
        appointmentId: id,
        amountCents: deposit.amount * 100,
        email: input.email,
        label: `${service.name}, ${parisDateStr(startsAt).split("-").reverse().join("/")}`,
        successUrl: `${base}/rendez-vous/acompte?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${base}/rendez-vous/acompte?annule=${id}`,
        expiresAt: new Date(now + 30.5 * 60_000),
      });
      await db.update(appointments).set({ paymentRef: checkout.id }).where(eq(appointments.id, id));
      return { kind: "payment", url: checkout.url };
    } catch (e) {
      console.error("[acompte] création du paiement impossible", e);
      await db.update(appointments).set({ status: "expired", depositStatus: "" }).where(eq(appointments.id, id));
      throw new BookingError("Le paiement en ligne de l'acompte est momentanément indisponible. Merci d'appeler directement.");
    }
  }

  const [appt] = await db.select().from(appointments).where(eq(appointments.id, id));
  const admissionUrl = await admissionUrlFor(client);
  await Promise.allSettled([mailBookingReceived(appt, { admissionUrl }), mailBookingAdmin(appt)]);
  return { kind: "booked", appt, admissionUrl: created ? admissionUrl : null };
}

/**
 * Retour de paiement Stripe (page de retour ou notification) : l'acompte est payé,
 * la demande de rendez-vous est enregistrée et les emails partent. Sans effet si déjà traité.
 */
export async function confirmDepositPayment(sessionId: string) {
  const session = await retrieveCheckout(sessionId);
  const db = await getDb();
  const apptId = session.metadata?.appointment_id;
  const [appt] = apptId ? await db.select().from(appointments).where(eq(appointments.id, apptId)) : [];
  if (!appt) return { ok: false as const, appt: undefined, admissionUrl: null };
  if (session.payment_status !== "paid") return { ok: false as const, appt, admissionUrl: null };
  if (appt.depositStatus === "refunded") return { ok: false as const, appt, admissionUrl: null, conflict: true };
  if (appt.depositStatus === "paid") return { ok: true as const, appt, admissionUrl: await newClientAdmissionUrl(appt, db) };

  const s = await getSettings(db);
  if (appt.status === "expired") {
    // Paiement arrivé après la libération du créneau : on ne le reprend que s'il est encore libre.
    const buffer = s.bufferMinutes * 60_000;
    const [clash] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          ne(appointments.id, appt.id),
          occupying(),
          lt(appointments.startsAt, new Date(appt.endsAt.getTime() + buffer)),
          gt(appointments.endsAt, new Date(appt.startsAt.getTime() - buffer)),
        ),
      )
      .limit(1);
    if (clash) {
      if (session.payment_intent) await refundPayment(session.payment_intent).catch((e) => console.error("[acompte] remboursement", e));
      await db
        .update(appointments)
        .set({ depositStatus: "refunded", paymentRef: session.payment_intent ?? session.id, updatedAt: new Date() })
        .where(eq(appointments.id, appt.id));
      return { ok: false as const, appt, admissionUrl: null, conflict: true };
    }
  }
  const [row] = await db
    .update(appointments)
    .set({
      status: s.autoConfirm ? "confirmed" : "pending",
      depositStatus: "paid",
      paymentRef: session.payment_intent ?? session.id,
      holdExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(and(eq(appointments.id, appt.id), inArray(appointments.status, ["awaiting_payment", "expired"])))
    .returning();
  if (!row) return { ok: true as const, appt, admissionUrl: await newClientAdmissionUrl(appt, db) };

  const [client] = row.clientId ? await db.select().from(clients).where(eq(clients.id, row.clientId)) : [];
  const admissionUrl = await admissionUrlFor(client);
  await Promise.allSettled([mailBookingReceived(row, { admissionUrl }), mailBookingAdmin(row)]);
  return { ok: true as const, appt: row, admissionUrl: await newClientAdmissionUrl(row, db) };
}

/** Lien de la fiche d'admission, affiché après paiement seulement pour une fiche créée par cette réservation. */
async function newClientAdmissionUrl(appt: Appointment, db: DB) {
  if (!appt.clientId) return null;
  const [client] = await db.select().from(clients).where(eq(clients.id, appt.clientId));
  // La fiche est créée juste après l'insertion du rendez-vous (quelques millisecondes plus tard).
  const delta = client ? client.createdAt.getTime() - appt.createdAt.getTime() : -1;
  if (!client || delta < -1000 || delta > 15_000) return null;
  return admissionUrlFor(client);
}

/** Paiement abandonné (bouton « retour » de Stripe) : le créneau est libéré tout de suite. */
export async function releaseHold(appointmentId: string) {
  const db = await getDb();
  const [row] = await db
    .update(appointments)
    .set({ status: "expired", depositStatus: "", holdExpiresAt: null, updatedAt: new Date() })
    .where(and(eq(appointments.id, appointmentId), eq(appointments.status, "awaiting_payment")))
    .returning({ paymentRef: appointments.paymentRef });
  // La page de paiement est fermée aussi : plus de paiement possible pour un créneau libéré.
  if (row?.paymentRef.startsWith("cs_") && stripeConfigured()) {
    await expireCheckout(row.paymentRef).catch(() => {});
  }
  return Boolean(row);
}

/** Libère les créneaux retenus dont l'acompte n'a pas été payé à temps. */
export async function expireHolds() {
  const db = await getDb();
  const rows = await db
    .update(appointments)
    .set({ status: "expired", depositStatus: "", updatedAt: new Date() })
    .where(and(eq(appointments.status, "awaiting_payment"), lt(appointments.holdExpiresAt, new Date())))
    .returning({ id: appointments.id });
  return rows.length;
}

/** Rembourse l'acompte payé en ligne (annulation ou refus de la part de la praticienne). */
async function refundDeposit(a: Appointment) {
  if (a.depositStatus !== "paid" || !a.paymentRef.startsWith("pi_") || !stripeConfigured()) return a;
  try {
    await refundPayment(a.paymentRef);
    const db = await getDb();
    const [row] = await db
      .update(appointments)
      .set({ depositStatus: "refunded", updatedAt: new Date() })
      .where(eq(appointments.id, a.id))
      .returning();
    return row ?? a;
  } catch (e) {
    console.error("[acompte] remboursement impossible", e);
    return a;
  }
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
  let row = await updateStatus(id, "declined", reason ? { adminNote: reason } : {});
  if (row) row = await refundDeposit(row);
  if (row) await mailBookingDeclined(row, reason);
  return row;
}

/**
 * Annulation depuis l'espace admin.
 * `by` = « client » si la personne a demandé l'annulation (comptée pour l'acompte, acompte conservé),
 * « admin » si l'annulation vient de la praticienne (acompte remboursé).
 */
export async function cancelAppointmentByAdmin(id: string, reason: string, notify: boolean, by: "client" | "admin" = "admin") {
  let row = await updateStatus(id, "cancelled", { cancelledBy: by, ...(reason ? { adminNote: reason } : {}) });
  if (row && by === "admin") row = await refundDeposit(row);
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
  clientId?: string;
  mode?: AppointmentMode;
}) {
  const service = getService(input.serviceId);
  const startsAt = parisToUtc(input.date, input.time);
  const db = await getDb();
  const clientId = service
    ? (input.clientId ??
      (await findOrCreateClient({ name: input.clientName, email: input.clientEmail, phone: input.clientPhone }, db)))
    : null;
  const [row] = await db
    .insert(appointments)
    .values({
      clientId,
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
      mode: service ? (input.mode ?? "cabinet") : "cabinet",
      cancelToken: newToken(),
    })
    .returning();
  if (row && input.notify && row.clientEmail) await mailBookingConfirmed(row);
  return row;
}

/** Rendez-vous passé auquel le client ne s'est pas présenté. */
export async function markNoShow(id: string) {
  return updateStatus(id, "no_show");
}

/** Annule un « absent » posé par erreur. */
export async function markAttended(id: string) {
  return updateStatus(id, "confirmed");
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
  const row = await updateStatus(a.id, "cancelled", { adminNote: "Annulé par le client en ligne", cancelledBy: "client" });
  if (row) await mailCancelledByClient(row);
  return row;
}

// ——— Disponibilités ———

/** D1 limite le nombre de paramètres par requête : on découpe les insertions multiples. */
function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export async function replaceWeeklyHours(rows: WeeklyHour[]) {
  const db = await getDb();
  const clean = rows.flatMap((r) => sortRanges([r]).map((x) => ({ weekday: r.weekday, ...x })));
  // Un batch D1 est transactionnel : suppression et réinsertion ensemble.
  await db.batch([
    db.delete(weeklyHours),
    ...chunk(clean, 25).map((c) => db.insert(weeklyHours).values(c)),
  ]);
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
  const [first, ...rest] = chunk(values, 20).map((c) =>
    db
      .insert(dateOverrides)
      .values(c)
      .onConflictDoUpdate({
        target: dateOverrides.date,
        set: { closed: true, ranges: sql`'[]'`, note: sql`excluded.note` },
      }),
  );
  await db.batch([first, ...rest]);
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
    const [client] = a.clientId ? await db.select().from(clients).where(eq(clients.id, a.clientId)) : [];
    if (await mailReminder(a, { admissionUrl: await admissionUrlFor(client) })) {
      sent++;
      await db.update(appointments).set({ reminderSentAt: new Date() }).where(eq(appointments.id, a.id));
    }
  }
  const expired = await expireHolds();
  return { candidates: rows.length, sent, expiredHolds: expired };
}
