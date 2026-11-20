import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { vigilanceSummary, type AdmissionData } from "./admission";
import { getService } from "./content";
import { getDb, type DB } from "./db";
import {
  admissions,
  appointments,
  clients,
  contactMessages,
  sessionNotes,
  type Admission,
  type Appointment,
  type Client,
  type ContactMessage,
  type SessionNote,
} from "./db/schema";
import { mailAdmissionReceived, mailAdmissionRequest } from "./emails";
import type { ImportedClient, ImportedSession } from "./import-excel";
import { normalizeKey } from "./import-excel";
import { phoneKey } from "./phone";
import { parisDateStr, parisToUtc } from "./time";

export { phoneKey };

export const newAdmissionToken = () => randomBytes(18).toString("hex");

// ——— Identification des clients ———

export type ClientInput = { name: string; firstName?: string; lastName?: string; email?: string; phone?: string };

const words = (s: string) =>
  new Set(
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 2),
  );

/**
 * Un même numéro peut être partagé (famille, couple) : une fiche trouvée par le téléphone n'est retenue que
 * si le nom concorde — et, quand les deux emails sont connus et diffèrent, si nom et prénom concordent.
 */
function samePerson(c: Client, email: string, name: string) {
  const given = words(name);
  if (!given.size) return !(email && c.email && c.email !== email);
  const known = words(`${c.lastName} ${c.firstName} ${c.name}`);
  const shared = [...given].filter((w) => known.has(w)).length;
  return email && c.email && c.email !== email ? shared >= 2 : shared >= 1;
}

/** Retrouve une fiche par email, sinon par téléphone avec un nom concordant (sans la créer). */
export async function findClient(email: string, phone: string, db?: DB, name = ""): Promise<Client | undefined> {
  const d = db ?? (await getDb());
  const e = email.trim().toLowerCase();
  const key = phoneKey(phone);
  let found: Client | undefined;
  if (e) [found] = await d.select().from(clients).where(eq(clients.email, e)).limit(1);
  if (!found && key) {
    const sharing = await d.select().from(clients).where(eq(clients.phoneKey, key)).limit(20);
    found = sharing.find((c) => samePerson(c, e, name));
  }
  return found;
}

/**
 * Retrouve la fiche d'une personne (par email, sinon par téléphone) ou la crée.
 * Complète les informations manquantes sans écraser celles déjà connues.
 */
export async function upsertClient(input: ClientInput, db?: DB): Promise<{ client: Client; created: boolean } | null> {
  const d = db ?? (await getDb());
  const name = input.name.trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const phone = (input.phone ?? "").trim();
  const key = phoneKey(phone);
  if (!name && !email && !key) return null;

  const existing = await findClient(email, phone, d, name);
  if (existing) {
    const patch: Partial<Client> = {};
    if (!existing.email && email) patch.email = email;
    if (!existing.phone && phone) Object.assign(patch, { phone, phoneKey: key });
    if (!existing.name && name) patch.name = name;
    if (!existing.firstName && input.firstName) patch.firstName = input.firstName.trim();
    if (!existing.lastName && input.lastName) patch.lastName = input.lastName.trim();
    if (!existing.admissionToken) patch.admissionToken = newAdmissionToken();
    if (Object.keys(patch).length) {
      const [row] = await d
        .update(clients)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(clients.id, existing.id))
        .returning();
      return { client: row ?? existing, created: false };
    }
    return { client: existing, created: false };
  }

  const [row] = await d
    .insert(clients)
    .values({
      name: name || email || phone,
      firstName: (input.firstName ?? "").trim(),
      lastName: (input.lastName ?? "").trim(),
      email,
      phone,
      phoneKey: key,
      admissionToken: newAdmissionToken(),
    })
    .returning();
  return { client: row, created: true };
}

export async function findOrCreateClient(input: ClientInput, db?: DB): Promise<string | null> {
  return (await upsertClient(input, db))?.client.id ?? null;
}

/** Annulations faites par la personne + absences : base du calcul de l'acompte. */
export async function countIncidents(clientId: string, db?: DB): Promise<number> {
  const d = db ?? (await getDb());
  const [r] = await d
    .select({ n: sql<number>`count(*)` })
    .from(appointments)
    .where(
      and(
        eq(appointments.clientId, clientId),
        or(eq(appointments.status, "no_show"), and(eq(appointments.status, "cancelled"), eq(appointments.cancelledBy, "client"))),
      ),
    );
  return Number(r?.n ?? 0);
}

// ——— Liste & statistiques ———

export type ClientRow = Client & {
  visits: number;
  lastVisit: Date | null;
  nextVisit: Date | null;
  cancellations: number;
};

const ms = (v: unknown) => (v === null || v === undefined ? null : new Date(Number(v)));

export async function listClients(query = ""): Promise<ClientRow[]> {
  const db = await getDb();
  const now = Date.now();
  const q = query.trim().toLowerCase();
  const like = `%${q.replace(/[%_]/g, "")}%`;
  // Recherche par téléphone dès 3 chiffres (« 0611 », « 06 11 22 », « +33 6 11 »…).
  let digits = q.replace(/\D/g, "");
  if (digits.startsWith("33") && /^\s*\+|^0033/.test(q)) digits = `0${digits.replace(/^(00)?33/, "")}`;
  if (digits.length < 3) digits = "";
  // Séances : rendez-vous honorés + séances du journal saisies hors agenda (import Excel, saisie manuelle).
  const rows = await db
    .select({
      client: clients,
      visits: sql<number>`(select count(*) from appointments a where a.client_id = "clients"."id" and a.status = 'confirmed' and a.service_id <> 'blocage' and a.ends_at < ${now})
        + (select count(*) from session_notes n where n.client_id = "clients"."id" and n.appointment_id is null)`,
      lastVisit: sql<number | null>`(select max(a.starts_at) from appointments a where a.client_id = "clients"."id" and a.status = 'confirmed' and a.starts_at < ${now})`,
      lastNote: sql<string | null>`(select max(n.date) from session_notes n where n.client_id = "clients"."id")`,
      nextVisit: sql<number | null>`(select min(a.starts_at) from appointments a where a.client_id = "clients"."id" and a.status in ('pending', 'confirmed', 'awaiting_payment') and a.starts_at >= ${now})`,
      cancellations: sql<number>`(select count(*) from appointments a where a.client_id = "clients"."id" and (a.status = 'no_show' or (a.status = 'cancelled' and a.cancelled_by = 'client')))`,
    })
    .from(clients)
    .where(
      q
        ? or(
            sql`lower(${clients.name}) like ${like}`,
            sql`lower(${clients.lastName} || ' ' || ${clients.firstName}) like ${like}`,
            sql`${clients.email} like ${like}`,
            digits ? sql`${clients.phoneKey} like ${`%${digits}%`}` : undefined,
          )
        : undefined,
    );

  return rows
    .map((r) => {
      const fromAppt = ms(r.lastVisit);
      const fromNote = r.lastNote ? parisToUtc(r.lastNote, "12:00") : null;
      const lastVisit = [fromAppt, fromNote].filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0] ?? null;
      return {
        ...r.client,
        visits: Number(r.visits),
        lastVisit,
        nextVisit: ms(r.nextVisit),
        cancellations: Number(r.cancellations),
      };
    })
    .sort((a, b) => activity(b) - activity(a));
}

const activity = (c: ClientRow) => Math.max(c.nextVisit?.getTime() ?? 0, c.lastVisit?.getTime() ?? 0, c.createdAt.getTime());

export async function crmStats() {
  const db = await getDb();
  const now = new Date();
  const monthStart = parisToUtc(`${parisDateStr(now).slice(0, 7)}-01`, "00:00");
  const [[total], [newClients], [sessions], [upcoming], [missing]] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(clients),
    db.select({ n: sql<number>`count(*)` }).from(clients).where(gte(clients.createdAt, new Date(now.getTime() - 30 * 86400_000))),
    db
      .select({ n: sql<number>`count(*)` })
      .from(appointments)
      .where(and(eq(appointments.status, "confirmed"), gte(appointments.startsAt, monthStart), lt(appointments.startsAt, now))),
    db
      .select({ n: sql<number>`count(*)` })
      .from(appointments)
      .where(and(inArray(appointments.status, ["pending", "confirmed"]), gte(appointments.startsAt, now))),
    db.select({ n: sql<number>`count(*)` }).from(clients).where(isNull(clients.admissionReceivedAt)),
  ]);
  return {
    total: Number(total.n),
    newLast30: Number(newClients.n),
    sessionsThisMonth: Number(sessions.n),
    upcoming: Number(upcoming.n),
    missingAdmission: Number(missing.n),
  };
}

/** Fiches des clients d'une liste de rendez-vous (badges de l'agenda : vigilance, fiche d'admission). */
export async function getClientsByIds(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map<string, Client>();
  const db = await getDb();
  const rows = await db.select().from(clients).where(inArray(clients.id, unique.slice(0, 90)));
  return new Map(rows.map((c) => [c.id, c]));
}

/** Rendez-vous ayant déjà un compte-rendu dans le journal. */
export async function appointmentsWithNotes(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))].slice(0, 90);
  if (!unique.length) return new Set<string>();
  const db = await getDb();
  const rows = await db
    .select({ id: sessionNotes.appointmentId })
    .from(sessionNotes)
    .where(inArray(sessionNotes.appointmentId, unique));
  return new Set(rows.map((r) => r.id!).filter(Boolean));
}

// ——— Fiche détaillée ———

export type ClientDetail = {
  client: Client;
  appointments: Appointment[];
  messages: ContactMessage[];
  notes: SessionNote[];
  admissions: Admission[];
  stats: {
    visits: number;
    upcoming: number;
    cancelled: number;
    noShow: number;
    firstVisit: Date | null;
    lastVisit: Date | null;
    nextVisit: Appointment | null;
    favorites: { name: string; count: number }[];
    estimatedTotal: number;
    incidents: number;
  };
};

/** Montant indicatif d'un soin (premier nombre du tarif affiché), 0 si « sur devis ». */
function priceOf(serviceId: string): number {
  const m = getService(serviceId)?.price.match(/\d+/);
  return m ? Number(m[0]) : 0;
}

export async function getClientDetail(id: string): Promise<ClientDetail | null> {
  const db = await getDb();
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  if (!client) return null;
  const [appts, messages, notes, adm] = await Promise.all([
    db.select().from(appointments).where(eq(appointments.clientId, id)).orderBy(desc(appointments.startsAt)),
    db.select().from(contactMessages).where(eq(contactMessages.clientId, id)).orderBy(desc(contactMessages.createdAt)),
    db.select().from(sessionNotes).where(eq(sessionNotes.clientId, id)).orderBy(desc(sessionNotes.date)),
    db.select().from(admissions).where(eq(admissions.clientId, id)).orderBy(desc(admissions.createdAt)),
  ]);
  const now = Date.now();
  const done = appts.filter((a) => a.status === "confirmed" && a.endsAt.getTime() < now && a.serviceId !== "blocage");
  const future = appts
    .filter((a) => ["confirmed", "pending", "awaiting_payment"].includes(a.status) && a.startsAt.getTime() >= now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const standalone = notes.filter((n) => !n.appointmentId);
  const counts = new Map<string, number>();
  for (const a of done) counts.set(a.serviceName, (counts.get(a.serviceName) ?? 0) + 1);
  for (const n of standalone) counts.set(n.prestation || "Autre", (counts.get(n.prestation || "Autre") ?? 0) + 1);
  const visitDates = [...done.map((a) => a.startsAt), ...standalone.map((n) => parisToUtc(n.date, "12:00"))].sort(
    (a, b) => a.getTime() - b.getTime(),
  );
  const firstVisit = client.firstVisit ? parisToUtc(client.firstVisit, "12:00") : (visitDates[0] ?? null);

  return {
    client,
    appointments: appts,
    messages,
    notes,
    admissions: adm,
    stats: {
      visits: done.length + standalone.length,
      upcoming: future.length,
      cancelled: appts.filter((a) => a.status === "cancelled").length,
      noShow: appts.filter((a) => a.status === "no_show").length,
      firstVisit,
      lastVisit: visitDates.at(-1) ?? null,
      nextVisit: future[0] ?? null,
      favorites: [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
      estimatedTotal: done.reduce((sum, a) => sum + priceOf(a.serviceId), 0),
      incidents: appts.filter((a) => a.status === "no_show" || (a.status === "cancelled" && a.cancelledBy === "client")).length,
    },
  };
}

export type ClientFields = {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthdate: string;
  address: string;
  profession: string;
  howFound: string;
  motive: string;
  vigilance: string;
  firstVisit: string;
  notes: string;
  depositPolicy: "auto" | "always" | "never";
};

export async function createClient(fields: ClientFields) {
  const db = await getDb();
  const [row] = await db
    .insert(clients)
    .values({ ...fields, email: fields.email.toLowerCase(), phoneKey: phoneKey(fields.phone), admissionToken: newAdmissionToken() })
    .returning({ id: clients.id });
  return row.id;
}

export async function updateClient(id: string, fields: ClientFields) {
  const db = await getDb();
  await db
    .update(clients)
    .set({ ...fields, email: fields.email.toLowerCase(), phoneKey: phoneKey(fields.phone), updatedAt: new Date() })
    .where(eq(clients.id, id));
}

/** Droit à l'effacement (RGPD) : supprime la fiche, ses rendez-vous, son journal, ses fiches d'admission et messages. */
export async function deleteClient(id: string) {
  const db = await getDb();
  await db.batch([
    db.delete(appointments).where(eq(appointments.clientId, id)),
    db.delete(contactMessages).where(eq(contactMessages.clientId, id)),
    db.delete(sessionNotes).where(eq(sessionNotes.clientId, id)),
    db.delete(admissions).where(eq(admissions.clientId, id)),
    db.delete(clients).where(eq(clients.id, id)),
  ]);
}

export async function saveContactMessage(data: { name: string; email: string; phone: string; subject: string; message: string }) {
  const db = await getDb();
  const clientId = await findOrCreateClient(data, db);
  await db.insert(contactMessages).values({ ...data, email: data.email.toLowerCase(), clientId });
}

/** Liste légère pour les sélecteurs (ajout de rendez-vous dans l'agenda). */
export async function clientOptions() {
  const db = await getDb();
  return db
    .select({ id: clients.id, name: clients.name, email: clients.email, phone: clients.phone })
    .from(clients)
    .orderBy(clients.name);
}

// ——— Fiche d'admission en ligne ———

export async function getClientByAdmissionToken(token: string) {
  if (!/^[a-f0-9]{24,64}$/.test(token)) return undefined;
  const db = await getDb();
  const [c] = await db.select().from(clients).where(eq(clients.admissionToken, token));
  return c;
}

/** Enregistre une fiche d'admission remplie en ligne et met à jour la fiche client. */
export async function saveAdmission(token: string, data: AdmissionData) {
  const client = await getClientByAdmissionToken(token);
  if (!client) return null;
  const db = await getDb();
  const now = new Date();
  const name = `${data.firstName} ${data.lastName}`.trim();
  await db.batch([
    db.insert(admissions).values({ clientId: client.id, data: { ...data, submittedAt: now.toISOString() } }),
    db
      .update(clients)
      .set({
        name: name || client.name,
        firstName: data.firstName,
        lastName: data.lastName,
        birthdate: data.birthdate || client.birthdate,
        address: data.address || client.address,
        profession: data.profession || client.profession,
        howFound: data.howFound || client.howFound,
        motive: data.reason ? data.reason.slice(0, 500) : client.motive,
        vigilance: vigilanceSummary(data),
        phone: client.phone || data.phone,
        phoneKey: client.phone ? client.phoneKey : phoneKey(data.phone),
        email: client.email || data.email.toLowerCase(),
        admissionReceivedAt: now,
        consentAt: now,
        updatedAt: now,
      })
      .where(eq(clients.id, client.id)),
  ]);
  await mailAdmissionReceived(client.id, name || client.name);
  return client.id;
}

/** Envoie au client le lien vers sa fiche d'admission. */
export async function sendAdmissionLink(clientId: string, url: string) {
  const db = await getDb();
  const [c] = await db.select().from(clients).where(eq(clients.id, clientId));
  if (!c?.email) return false;
  return mailAdmissionRequest(c, url);
}

// ——— Journal des séances ———

export type SessionNoteInput = {
  id?: string;
  clientId: string;
  appointmentId?: string | null;
  date: string;
  prestation: string;
  durationMinutes: number | null;
  motive: string;
  changeReported: boolean;
  observations: string;
  feeling: string;
  advice: string;
  nextSession: string;
};

export async function saveSessionNote(input: SessionNoteInput) {
  const db = await getDb();
  const values = { ...input, appointmentId: input.appointmentId || null, updatedAt: new Date() };
  if (input.id) {
    await db.update(sessionNotes).set(values).where(and(eq(sessionNotes.id, input.id), eq(sessionNotes.clientId, input.clientId)));
    return input.id;
  }
  const { id: _omit, ...rest } = values;
  void _omit;
  const [row] = await db.insert(sessionNotes).values(rest).returning({ id: sessionNotes.id });
  return row.id;
}

export async function deleteSessionNote(id: string, clientId: string) {
  const db = await getDb();
  await db.delete(sessionNotes).where(and(eq(sessionNotes.id, id), eq(sessionNotes.clientId, clientId)));
}

// ——— Import du classeur Excel ———

/**
 * Importe l'annuaire et le journal des séances du classeur.
 * Une personne déjà connue (même email, téléphone ou nom) est complétée, jamais dupliquée ;
 * une séance déjà présente (même personne, date et prestation) n'est pas réimportée.
 */
/** Même nom, mais email ou téléphone différents des deux côtés : probablement un homonyme. */
function homonymSafe(c: Client | undefined, email: string, key: string) {
  if (!c) return undefined;
  if (email && c.email && c.email !== email) return undefined;
  if (key && c.phoneKey && c.phoneKey !== key) return undefined;
  return c;
}

export async function importWorkbook(data: { clients: ImportedClient[]; sessions: ImportedSession[] }) {
  const db = await getDb();
  const all = await db.select().from(clients);
  const byEmail = new Map<string, Client>();
  const byPhone = new Map<string, Client[]>();
  const byName = new Map<string, Client>();
  const remember = (c: Client) => {
    if (c.email) byEmail.set(c.email, c);
    if (c.phoneKey) byPhone.set(c.phoneKey, [...(byPhone.get(c.phoneKey) ?? []), c]);
    // « Nom Prénom » (clé du classeur), dans les deux sens.
    const parts = c.lastName || c.firstName ? [c.lastName, c.firstName] : c.name.trim().split(/\s+/);
    for (const k of [parts.join(" "), [...parts].reverse().join(" ")]) {
      const nk = normalizeKey(k);
      if (nk && !byName.has(nk)) byName.set(nk, c);
    }
  };
  all.forEach(remember);

  // Écritures regroupées (batch D1) : rapide et peu de requêtes, même pour des centaines de lignes.
  const writes: BatchItem<"sqlite">[] = [];
  const keyToId = new Map<string, string>();
  let created = 0;
  let updated = 0;

  for (const ic of data.clients.slice(0, 2000)) {
    const key = phoneKey(ic.phone);
    const fullName = `${ic.firstName} ${ic.lastName}`.trim();
    const existing =
      (ic.email && byEmail.get(ic.email)) ||
      (key && byPhone.get(key)?.find((c) => samePerson(c, ic.email, fullName))) ||
      homonymSafe(byName.get(normalizeKey(ic.key)), ic.email, key) ||
      undefined;
    const fields = {
      firstName: ic.firstName,
      lastName: ic.lastName,
      birthdate: ic.birthdate,
      address: ic.address,
      firstVisit: ic.firstVisit,
      howFound: ic.howFound,
      motive: ic.motive,
      vigilance: ic.vigilance,
    };
    const admissionAt = ic.admissionReceived ? parisToUtc(ic.consentDate || ic.firstVisit || parisDateStr(new Date()), "12:00") : null;
    const consentAt = ic.consentDate ? parisToUtc(ic.consentDate, "12:00") : null;
    if (existing) {
      // On complète sans effacer : une case vide du classeur ne vide pas la fiche.
      const patch: Partial<Client> = {};
      for (const [k, v] of Object.entries(fields)) if (v && !existing[k as keyof Client]) Object.assign(patch, { [k]: v });
      if (!existing.email && ic.email) patch.email = ic.email;
      if (!existing.phone && ic.phone) Object.assign(patch, { phone: ic.phone, phoneKey: key });
      if (ic.notes && !existing.notes.includes(ic.notes)) patch.notes = existing.notes ? `${existing.notes}\n${ic.notes}` : ic.notes;
      if (admissionAt && !existing.admissionReceivedAt) patch.admissionReceivedAt = admissionAt;
      if (consentAt && !existing.consentAt) patch.consentAt = consentAt;
      if (Object.keys(patch).length) {
        writes.push(db.update(clients).set({ ...patch, updatedAt: new Date() }).where(eq(clients.id, existing.id)));
        Object.assign(existing, patch);
        updated++;
      }
      keyToId.set(normalizeKey(ic.key), existing.id);
    } else {
      const now = new Date();
      const row = {
        ...fields,
        id: crypto.randomUUID(),
        name: fullName || ic.key,
        email: ic.email,
        phone: ic.phone,
        phoneKey: key,
        notes: ic.notes,
        admissionReceivedAt: admissionAt,
        consentAt,
        admissionToken: newAdmissionToken(),
        depositPolicy: "auto" as const,
        createdAt: ic.firstVisit ? parisToUtc(ic.firstVisit, "12:00") : now,
        updatedAt: now,
      };
      writes.push(db.insert(clients).values(row));
      created++;
      keyToId.set(normalizeKey(ic.key), row.id);
      remember(row as Client);
    }
  }

  // Journal : rattaché par « Nom Prénom » (fiches de cet envoi ou déjà en base) ; une séance déjà connue
  // (même personne, date et prestation) n'est pas réimportée.
  let sessionsAdded = 0;
  const existingNotes = await db
    .select({ clientId: sessionNotes.clientId, date: sessionNotes.date, prestation: sessionNotes.prestation })
    .from(sessionNotes);
  const seen = new Set(existingNotes.map((n) => `${n.clientId}|${n.date}|${normalizeKey(n.prestation)}`));
  for (const sn of data.sessions.slice(0, 5000)) {
    const nk = normalizeKey(sn.clientKey);
    const clientId = keyToId.get(nk) ?? byName.get(nk)?.id;
    if (!clientId) continue;
    const k = `${clientId}|${sn.date}|${normalizeKey(sn.prestation)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const { clientKey: _key, ...note } = sn;
    void _key;
    writes.push(db.insert(sessionNotes).values({ ...note, clientId, appointmentId: null }));
    sessionsAdded++;
  }

  for (let i = 0; i < writes.length; i += 50) {
    const [first, ...rest] = writes.slice(i, i + 50);
    await db.batch([first, ...rest]);
  }
  return { created, updated, sessionsAdded };
}

// ——— Exports ———

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows: unknown[][]) => "﻿" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
const day = (d: Date | null) => (d ? parisDateStr(d) : "");

/** Annuaire, dans les colonnes du classeur Excel (plus le suivi calculé par le site). */
export async function exportClientsCsv(): Promise<string> {
  const rows = await listClients();
  return csv([
    [
      "Nom", "Prénom", "Date de naissance", "Téléphone", "Email", "Adresse", "Date 1ère venue", "Comment m'a connue",
      "Motif initial / objectif", "Points de vigilance (contre-indications)", "Fiche d'admission reçue",
      "Consentement daté du", "Notes générales", "Séances", "Dernière séance", "Prochain rendez-vous", "Annulations/absences",
    ],
    ...rows.map((c) => [
      c.lastName || c.name, c.firstName, c.birthdate, c.phone, c.email, c.address, c.firstVisit, c.howFound, c.motive,
      c.vigilance, c.admissionReceivedAt ? "Oui" : "Non", day(c.consentAt), c.notes, c.visits, day(c.lastVisit),
      day(c.nextVisit), c.cancellations,
    ]),
  ]);
}

/** Journal des séances, dans les colonnes de la feuille « Séances » du classeur. */
export async function exportSessionsCsv(): Promise<string> {
  const db = await getDb();
  const rows = await db
    .select({ n: sessionNotes, lastName: clients.lastName, firstName: clients.firstName, name: clients.name })
    .from(sessionNotes)
    .innerJoin(clients, eq(clients.id, sessionNotes.clientId))
    .orderBy(sessionNotes.date);
  return csv([
    ["Date", "Cliente", "Prestation", "Durée (min)", "Motif du jour", "Changement signalé ?", "Observations",
      "Ressenti de la cliente", "Conseils donnés", "Prochaine séance"],
    ...rows.map(({ n, lastName, firstName, name }) => [
      n.date, `${lastName} ${firstName}`.trim() || name, n.prestation, n.durationMinutes ?? "", n.motive,
      n.changeReported ? "Oui — voir observations" : "Non", n.observations, n.feeling, n.advice, n.nextSession,
    ]),
  ]);
}
