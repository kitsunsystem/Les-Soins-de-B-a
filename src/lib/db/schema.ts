import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Réglages de la réservation (une seule ligne, id = 1). */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  slotStepMinutes: integer("slot_step_minutes").notNull().default(30),
  bufferMinutes: integer("buffer_minutes").notNull().default(15),
  minNoticeHours: integer("min_notice_hours").notNull().default(24),
  maxDaysAhead: integer("max_days_ahead").notNull().default(60),
  autoConfirm: boolean("auto_confirm").notNull().default(false),
  bookingEnabled: boolean("booking_enabled").notNull().default(true),
  bookingNotice: text("booking_notice").notNull().default(""),
});

/** Horaires habituels : plusieurs plages possibles par jour (0 = dimanche … 6 = samedi). */
export const weeklyHours = pgTable("weekly_hours", {
  id: serial("id").primaryKey(),
  weekday: integer("weekday").notNull(),
  start: text("start").notNull(),
  end: text("end").notNull(),
});

/** Exceptions datées : jour fermé (congés…) ou horaires spécifiques. */
export const dateOverrides = pgTable("date_overrides", {
  date: text("date").primaryKey(),
  closed: boolean("closed").notNull().default(false),
  ranges: jsonb("ranges").$type<{ start: string; end: string }[]>().notNull().default([]),
  note: text("note").notNull().default(""),
});

export type AppointmentStatus = "pending" | "confirmed" | "declined" | "cancelled";

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceId: text("service_id").notNull(),
    serviceName: text("service_name").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: text("status").$type<AppointmentStatus>().notNull().default("pending"),
    clientName: text("client_name").notNull(),
    clientEmail: text("client_email").notNull().default(""),
    clientPhone: text("client_phone").notNull().default(""),
    message: text("message").notNull().default(""),
    /** « online » = réservé sur le site ; « admin » = ajouté par Béa. */
    source: text("source").notNull().default("online"),
    cancelToken: text("cancel_token").notNull().unique(),
    adminNote: text("admin_note").notNull().default(""),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("appointments_starts_at_idx").on(t.startsAt), index("appointments_status_idx").on(t.status)],
);

export type Appointment = typeof appointments.$inferSelect;
export type Settings = typeof settings.$inferSelect;
