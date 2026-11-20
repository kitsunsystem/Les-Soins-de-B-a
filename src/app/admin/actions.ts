"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Range, WeeklyHour } from "@/lib/availability";
import { checkPassword, createSession, destroySession, requireAdmin } from "@/lib/auth";
import {
  createClient,
  deleteClient,
  deleteSessionNote,
  importWorkbook,
  saveSessionNote,
  sendAdmissionLink,
  updateClient,
} from "@/lib/clients";
import { prestationsJournal } from "@/lib/content";
import type { ImportedClient, ImportedSession } from "@/lib/import-excel";
import { admissionPath, getBaseUrl } from "@/lib/urls";
import {
  cancelAppointmentByAdmin,
  closePeriod,
  confirmAppointment,
  createManualAppointment,
  declineAppointment,
  deleteOverride,
  markAttended,
  markNoShow,
  replaceWeeklyHours,
  setOverride,
  updateSettings,
} from "@/lib/bookings";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isDateStr, isTimeStr, toMinutes } from "@/lib/time";

export type ActionState = { ok?: string; error?: string } | null;

// ——— Connexion ———

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const ip = clientIp(await headers());
  if (!rateLimit(`login:${ip}`, 8, 15 * 60_000)) {
    return { error: "Trop de tentatives. Réessayez dans 15 minutes." };
  }
  const password = String(formData.get("password") ?? "");
  await new Promise((r) => setTimeout(r, 400));
  if (!checkPassword(password)) return { error: "Mot de passe incorrect." };
  await createSession();
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/connexion");
}

// ——— Rendez-vous ———

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function confirmAction(formData: FormData) {
  await requireAdmin();
  await confirmAppointment(str(formData, "id"));
  revalidatePath("/admin", "layout");
}

export async function declineAction(formData: FormData) {
  await requireAdmin();
  await declineAppointment(str(formData, "id"), str(formData, "reason").slice(0, 1000));
  revalidatePath("/admin", "layout");
}

export async function cancelAction(formData: FormData) {
  await requireAdmin();
  await cancelAppointmentByAdmin(
    str(formData, "id"),
    str(formData, "reason").slice(0, 1000),
    formData.get("notify") === "on",
    str(formData, "by") === "client" ? "client" : "admin",
  );
  revalidatePath("/admin", "layout");
}

export async function noShowAction(formData: FormData) {
  await requireAdmin();
  await markNoShow(str(formData, "id"));
  revalidatePath("/admin", "layout");
}

export async function attendedAction(formData: FormData) {
  await requireAdmin();
  await markAttended(str(formData, "id"));
  revalidatePath("/admin", "layout");
}

const manualSchema = z.object({
  date: z.string().refine(isDateStr),
  time: z.string().refine(isTimeStr, "Heure invalide"),
  durationMinutes: z.coerce.number().int().min(5).max(600),
  serviceId: z.string().max(80),
  clientName: z.string().trim().max(120),
  clientEmail: z.union([z.literal(""), z.email("Email invalide")]),
  clientPhone: z.string().trim().max(30),
  note: z.string().trim().max(1000),
  notify: z.boolean(),
  clientId: z.string().max(64).optional(),
  mode: z.enum(["cabinet", "visio", "telephone"]).default("cabinet"),
});

export async function addAppointmentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = manualSchema.safeParse({
    date: str(formData, "date"),
    time: str(formData, "time"),
    durationMinutes: str(formData, "duration"),
    serviceId: str(formData, "serviceId"),
    clientName: str(formData, "clientName"),
    clientEmail: str(formData, "clientEmail"),
    clientPhone: str(formData, "clientPhone"),
    note: str(formData, "note"),
    notify: formData.get("notify") === "on",
    clientId: str(formData, "clientId") || undefined,
    mode: str(formData, "mode") || "cabinet",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  await createManualAppointment(parsed.data);
  revalidatePath("/admin", "layout");
  return { ok: "Ajouté à l'agenda." };
}

// ——— Disponibilités ———

const rangeSchema = z
  .object({ start: z.string().refine(isTimeStr), end: z.string().refine(isTimeStr) })
  .refine((r) => toMinutes(r.end) > toMinutes(r.start), "Une plage horaire se termine avant de commencer.");

function overlaps(ranges: Range[]) {
  const sorted = [...ranges].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  return sorted.some((r, i) => i > 0 && toMinutes(r.start) < toMinutes(sorted[i - 1].end));
}

export async function saveDayAction(input: {
  date: string;
  closed: boolean;
  ranges: Range[];
  note: string;
}): Promise<ActionState> {
  await requireAdmin();
  if (!isDateStr(input.date)) return { error: "Date invalide" };
  const ranges = z.array(rangeSchema).max(6).safeParse(input.ranges);
  if (!ranges.success) return { error: ranges.error.issues[0]?.message ?? "Plages invalides" };
  if (overlaps(ranges.data)) return { error: "Deux plages horaires se chevauchent." };
  if (!input.closed && ranges.data.length === 0) return { error: "Ajoutez au moins une plage, ou fermez le jour." };
  await setOverride(input.date, input.closed, ranges.data, input.note.slice(0, 200));
  revalidatePath("/admin", "layout");
  return { ok: "Disponibilités du jour enregistrées." };
}

export async function resetDayAction(date: string): Promise<ActionState> {
  await requireAdmin();
  if (!isDateStr(date)) return { error: "Date invalide" };
  await deleteOverride(date);
  revalidatePath("/admin", "layout");
  return { ok: "Le jour reprend les horaires habituels." };
}

export async function saveWeeklyAction(rows: WeeklyHour[]): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .array(z.object({ weekday: z.number().int().min(0).max(6), start: z.string(), end: z.string() }))
    .max(50)
    .safeParse(rows);
  if (!parsed.success) return { error: "Horaires invalides" };
  for (let wd = 0; wd < 7; wd++) {
    const day = parsed.data.filter((r) => r.weekday === wd);
    for (const r of day) {
      const ok = rangeSchema.safeParse(r);
      if (!ok.success) return { error: ok.error.issues[0]?.message ?? "Horaire invalide" };
    }
    if (overlaps(day)) return { error: "Deux plages horaires se chevauchent le même jour." };
  }
  await replaceWeeklyHours(parsed.data);
  revalidatePath("/admin", "layout");
  return { ok: "Horaires habituels enregistrés." };
}

export async function closePeriodAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const from = str(formData, "from");
  const to = str(formData, "to");
  if (!isDateStr(from) || !isDateStr(to) || to < from) return { error: "Période invalide." };
  const n = await closePeriod(from, to, str(formData, "note").slice(0, 200) || "Congés");
  revalidatePath("/admin", "layout");
  return { ok: `${n} jour${n > 1 ? "s" : ""} fermé${n > 1 ? "s" : ""}.` };
}

export async function deleteOverrideAction(formData: FormData) {
  await requireAdmin();
  const date = str(formData, "date");
  if (isDateStr(date)) await deleteOverride(date);
  revalidatePath("/admin", "layout");
}

const settingsSchema = z.object({
  slotStepMinutes: z.coerce.number().int().min(5).max(120),
  bufferMinutes: z.coerce.number().int().min(0).max(120),
  minNoticeHours: z.coerce.number().int().min(0).max(24 * 14),
  maxDaysAhead: z.coerce.number().int().min(1).max(365),
  autoConfirm: z.boolean(),
  bookingEnabled: z.boolean(),
  bookingNotice: z.string().trim().max(500),
  depositEnabled: z.boolean(),
  depositAmount: z.coerce.number().int().min(1, "Montant d'acompte invalide").max(500),
  depositThreshold: z.coerce.number().int().min(1).max(20),
});

export async function saveSettingsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse({
    slotStepMinutes: str(formData, "slotStepMinutes"),
    bufferMinutes: str(formData, "bufferMinutes"),
    minNoticeHours: str(formData, "minNoticeHours"),
    maxDaysAhead: str(formData, "maxDaysAhead"),
    autoConfirm: formData.get("autoConfirm") === "on",
    bookingEnabled: formData.get("bookingEnabled") === "on",
    bookingNotice: str(formData, "bookingNotice"),
    depositEnabled: formData.get("depositEnabled") === "on",
    depositAmount: str(formData, "depositAmount") || "20",
    depositThreshold: str(formData, "depositThreshold") || "2",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Réglages invalides." };
  await updateSettings(parsed.data);
  revalidatePath("/admin", "layout");
  return { ok: "Réglages enregistrés." };
}

// ——— Fiches clients (CRM) ———

const optDate = (label: string) => z.union([z.literal(""), z.string().refine(isDateStr, `${label} invalide`)]);

const clientSchema = z
  .object({
    lastName: z.string().trim().max(80),
    firstName: z.string().trim().max(80),
    email: z.union([z.literal(""), z.email("Email invalide")]),
    phone: z.string().trim().max(30),
    birthdate: optDate("Date de naissance"),
    address: z.string().trim().max(300),
    profession: z.string().trim().max(120),
    howFound: z.string().trim().max(200),
    motive: z.string().trim().max(1000),
    vigilance: z.string().trim().max(2000),
    firstVisit: optDate("Date de 1ère venue"),
    notes: z.string().max(5000),
    depositPolicy: z.enum(["auto", "always", "never"]).default("auto"),
  })
  .refine((c) => (c.lastName + c.firstName).length >= 2, "Indiquez au moins le nom.")
  .transform((c) => ({ ...c, name: `${c.firstName} ${c.lastName}`.trim() }));

function clientFields(formData: FormData) {
  return clientSchema.safeParse({
    lastName: str(formData, "lastName"),
    firstName: str(formData, "firstName"),
    email: str(formData, "email").toLowerCase(),
    phone: str(formData, "phone"),
    birthdate: str(formData, "birthdate"),
    address: str(formData, "address"),
    profession: str(formData, "profession"),
    howFound: str(formData, "howFound"),
    motive: String(formData.get("motive") ?? "").trim(),
    vigilance: String(formData.get("vigilance") ?? "").trim(),
    firstVisit: str(formData, "firstVisit"),
    notes: String(formData.get("notes") ?? "").trim(),
    depositPolicy: str(formData, "depositPolicy") || "auto",
  });
}

export async function createClientAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = clientFields(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const id = await createClient(parsed.data);
  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${id}`);
}

export async function updateClientAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(formData, "id");
  const parsed = clientFields(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  await updateClient(id, parsed.data);
  revalidatePath("/admin", "layout");
  return { ok: "Fiche enregistrée." };
}

export async function deleteClientAction(formData: FormData) {
  await requireAdmin();
  if (formData.get("confirm") !== "on") return;
  await deleteClient(str(formData, "id"));
  revalidatePath("/admin", "layout");
  redirect("/admin/clients");
}

// ——— Journal des séances ———

const noteSchema = z.object({
  id: z.string().max(64).optional(),
  clientId: z.string().min(1).max(64),
  appointmentId: z.string().max(64).optional(),
  date: z.string().refine(isDateStr, "Date de séance invalide"),
  prestation: z.enum(prestationsJournal),
  durationMinutes: z.union([z.literal(""), z.coerce.number().int().min(5).max(600)]),
  motive: z.string().trim().max(1000),
  changeReported: z.boolean(),
  observations: z.string().trim().max(5000),
  feeling: z.string().trim().max(2000),
  advice: z.string().trim().max(2000),
  nextSession: optDate("Date de prochaine séance"),
});

export async function saveSessionNoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = noteSchema.safeParse({
    id: str(formData, "id") || undefined,
    clientId: str(formData, "clientId"),
    appointmentId: str(formData, "appointmentId") || undefined,
    date: str(formData, "date"),
    prestation: str(formData, "prestation"),
    durationMinutes: str(formData, "durationMinutes"),
    motive: String(formData.get("motive") ?? ""),
    changeReported: str(formData, "changeReported") === "oui",
    observations: String(formData.get("observations") ?? ""),
    feeling: String(formData.get("feeling") ?? ""),
    advice: String(formData.get("advice") ?? ""),
    nextSession: str(formData, "nextSession"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const d = parsed.data;
  await saveSessionNote({ ...d, durationMinutes: d.durationMinutes === "" ? null : d.durationMinutes });
  revalidatePath("/admin", "layout");
  return { ok: d.id ? "Séance mise à jour." : "Séance ajoutée au journal." };
}

export async function deleteSessionNoteAction(formData: FormData) {
  await requireAdmin();
  await deleteSessionNote(str(formData, "id"), str(formData, "clientId"));
  revalidatePath("/admin", "layout");
}

// ——— Fiche d'admission ———

export async function sendAdmissionLinkAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const token = str(formData, "token");
  if (!/^[a-f0-9]{24,64}$/.test(token)) return { error: "Lien introuvable." };
  const sent = await sendAdmissionLink(str(formData, "clientId"), `${await getBaseUrl()}${admissionPath(token)}`);
  return sent ? { ok: "Lien envoyé par email." } : { error: "Envoi impossible : pas d'email sur la fiche, ou emails non configurés." };
}

// ——— Import du classeur Excel ———

const cell = (max: number) => z.string().max(max).catch("");
const dateCell = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).catch("");
const importSchema = z.object({
  clients: z
    .array(
      z.object({
        key: z.string().min(1).max(200),
        lastName: cell(80),
        firstName: cell(80),
        birthdate: dateCell,
        phone: cell(30),
        email: z.union([z.literal(""), z.email()]).catch(""),
        address: cell(300),
        firstVisit: dateCell,
        howFound: cell(200),
        motive: cell(1000),
        vigilance: cell(1000),
        admissionReceived: z.boolean().catch(false),
        consentDate: dateCell,
        notes: cell(5000),
      }),
    )
    .max(2000),
  sessions: z
    .array(
      z.object({
        clientKey: z.string().min(1).max(200),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        prestation: cell(80),
        durationMinutes: z.number().int().min(1).max(1440).nullable().catch(null),
        motive: cell(1000),
        changeReported: z.boolean().catch(false),
        observations: cell(5000),
        feeling: cell(2000),
        advice: cell(2000),
        nextSession: dateCell,
      }),
    )
    .max(5000),
});

/** Import du classeur Excel (envoyé par paquets depuis le navigateur). */
export async function importWorkbookAction(data: {
  clients: ImportedClient[];
  sessions: ImportedSession[];
}): Promise<ActionState & { summary?: { created: number; updated: number; sessionsAdded: number } }> {
  await requireAdmin();
  const parsed = importSchema.safeParse(data);
  if (!parsed.success) return { error: "Fichier illisible : certaines lignes ne sont pas au format attendu." };
  const summary = await importWorkbook(parsed.data);
  revalidatePath("/admin", "layout");
  return {
    ok: `${summary.created} fiche(s) créée(s), ${summary.updated} complétée(s), ${summary.sessionsAdded} séance(s) ajoutée(s) au journal.`,
    summary,
  };
}
