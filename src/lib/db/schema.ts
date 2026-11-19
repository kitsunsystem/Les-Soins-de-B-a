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

/** « no_show » = rendez-vous confirmé mais client absent. */
export type AppointmentStatus = "pending" | "confirmed" | "declined" | "cancelled" | "no_show";

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

export type Client = typeof clients.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Settings = typeof settings.$inferSelect;
