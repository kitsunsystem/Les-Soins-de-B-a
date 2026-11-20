import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Réglages de la réservation (une seule ligne, id = 1). */
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey().default(1),
  slotStepMinutes: integer("slot_step_minutes").notNull().default(30),
  bufferMinutes: integer("buffer_minutes").notNull().default(15),
  minNoticeHours: integer("min_notice_hours").notNull().default(24),
  maxDaysAhead: integer("max_days_ahead").notNull().default(60),
  autoConfirm: integer("auto_confirm", { mode: "boolean" }).notNull().default(false),
  bookingEnabled: integer("booking_enabled", { mode: "boolean" }).notNull().default(true),
  bookingNotice: text("booking_notice").notNull().default(""),
  /** Acompte exigé après un certain nombre d'annulations / absences. */
  depositEnabled: integer("deposit_enabled", { mode: "boolean" }).notNull().default(false),
  /** Montant de l'acompte, en euros. */
  depositAmount: integer("deposit_amount").notNull().default(20),
  /** Nombre d'annulations ou d'absences à partir duquel l'acompte est demandé. */
  depositThreshold: integer("deposit_threshold").notNull().default(2),
});

/** Horaires habituels : plusieurs plages possibles par jour (0 = dimanche … 6 = samedi). */
export const weeklyHours = sqliteTable("weekly_hours", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekday: integer("weekday").notNull(),
  start: text("start").notNull(),
  end: text("end").notNull(),
});

/** Exceptions datées : jour fermé (congés…) ou horaires spécifiques. */
export const dateOverrides = sqliteTable("date_overrides", {
  date: text("date").primaryKey(),
  closed: integer("closed", { mode: "boolean" }).notNull().default(false),
  ranges: text("ranges", { mode: "json" })
    .$type<{ start: string; end: string }[]>()
    .notNull()
    .default(sql`'[]'`),
  note: text("note").notNull().default(""),
});

/** Fiche client (CRM) : une par personne, retrouvée par email ou téléphone. */
export const clients = sqliteTable(
  "clients",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    /** Toujours en minuscules. */
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    /** Téléphone normalisé (chiffres seulement, format 0X…) pour retrouver la fiche. */
    phoneKey: text("phone_key").notNull().default(""),
    /** AAAA-MM-JJ, facultatif. */
    birthdate: text("birthdate").notNull().default(""),
    /** Notes privées de Béa (préférences, précautions…). */
    notes: text("notes").notNull().default(""),
    // Champs repris de l'annuaire Excel et de la fiche d'admission
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    address: text("address").notNull().default(""),
    profession: text("profession").notNull().default(""),
    howFound: text("how_found").notNull().default(""),
    /** Motif initial / objectif. */
    motive: text("motive").notNull().default(""),
    /** Points de vigilance (contre-indications). */
    vigilance: text("vigilance").notNull().default(""),
    /** Date de première venue (AAAA-MM-JJ), saisie ou importée. */
    firstVisit: text("first_visit").notNull().default(""),
    admissionReceivedAt: integer("admission_received_at", { mode: "timestamp_ms" }),
    consentAt: integer("consent_at", { mode: "timestamp_ms" }),
    /** Jeton du lien personnel vers la fiche d'admission en ligne. */
    admissionToken: text("admission_token").unique(),
    /** Acompte : « auto » (selon les annulations), « always » (toujours) ou « never » (dispensée). */
    depositPolicy: text("deposit_policy").$type<"auto" | "always" | "never">().notNull().default("auto"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("clients_email_idx").on(t.email), index("clients_phone_key_idx").on(t.phoneKey)],
);

/** Messages reçus via le formulaire de contact (historique de la fiche client). */
export const contactMessages = sqliteTable(
  "contact_messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text("client_id"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("contact_messages_client_idx").on(t.clientId)],
);

/**
 * « no_show » = rendez-vous confirmé mais client absent.
 * « awaiting_payment » = créneau retenu le temps de régler l'acompte ; « expired » = acompte non réglé à temps.
 */
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "no_show"
  | "awaiting_payment"
  | "expired";

/** Lieu de la séance. */
export type AppointmentMode = "cabinet" | "visio" | "telephone";

export const appointments = sqliteTable(
  "appointments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /** Fiche client liée (null pour un créneau bloqué). */
    clientId: text("client_id"),
    serviceId: text("service_id").notNull(),
    serviceName: text("service_name").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
    status: text("status").$type<AppointmentStatus>().notNull().default("pending"),
    clientName: text("client_name").notNull(),
    clientEmail: text("client_email").notNull().default(""),
    clientPhone: text("client_phone").notNull().default(""),
    message: text("message").notNull().default(""),
    /** « online » = réservé sur le site ; « admin » = ajouté par Béa. */
    source: text("source").notNull().default("online"),
    cancelToken: text("cancel_token").notNull().unique(),
    mode: text("mode").$type<AppointmentMode>().notNull().default("cabinet"),
    /** « client » ou « admin » : qui a annulé (sert au calcul de l'acompte). */
    cancelledBy: text("cancelled_by").notNull().default(""),
    /** Acompte en centimes, et son état : « » (aucun), « awaiting », « paid », « refunded », « manual » (à demander). */
    depositCents: integer("deposit_cents").notNull().default(0),
    depositStatus: text("deposit_status").notNull().default(""),
    /** Référence du paiement (session Stripe Checkout puis PaymentIntent). */
    paymentRef: text("payment_ref").notNull().default(""),
    /** Fin de la réservation temporaire du créneau, le temps de payer l'acompte. */
    holdExpiresAt: integer("hold_expires_at", { mode: "timestamp_ms" }),
    adminNote: text("admin_note").notNull().default(""),
    reminderSentAt: integer("reminder_sent_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("appointments_starts_at_idx").on(t.startsAt),
    index("appointments_status_idx").on(t.status),
    index("appointments_client_idx").on(t.clientId),
  ],
);

/** Journal des séances (comme la feuille « Séances » du classeur Excel). */
export const sessionNotes = sqliteTable(
  "session_notes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text("client_id").notNull(),
    appointmentId: text("appointment_id"),
    /** AAAA-MM-JJ */
    date: text("date").notNull(),
    prestation: text("prestation").notNull().default(""),
    durationMinutes: integer("duration_minutes"),
    motive: text("motive").notNull().default(""),
    changeReported: integer("change_reported", { mode: "boolean" }).notNull().default(false),
    observations: text("observations").notNull().default(""),
    feeling: text("feeling").notNull().default(""),
    advice: text("advice").notNull().default(""),
    /** AAAA-MM-JJ, facultatif */
    nextSession: text("next_session").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("session_notes_client_idx").on(t.clientId), index("session_notes_appointment_idx").on(t.appointmentId)],
);

/** Fiches d'admission remplies en ligne (une nouvelle version à chaque envoi). */
export const admissions = sqliteTable(
  "admissions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text("client_id").notNull(),
    data: text("data", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("admissions_client_idx").on(t.clientId)],
);

export type Client = typeof clients.$inferSelect;
export type SessionNote = typeof sessionNotes.$inferSelect;
export type Admission = typeof admissions.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Settings = typeof settings.$inferSelect;
