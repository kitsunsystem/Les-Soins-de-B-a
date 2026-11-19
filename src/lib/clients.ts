import "server-only";
import { and, desc, eq, gte, inArray, lt, or, sql } from "drizzle-orm";
import { getService } from "./content";
import { getDb, type DB } from "./db";
import { appointments, clients, contactMessages, type Appointment, type Client, type ContactMessage } from "./db/schema";
import { phoneKey } from "./phone";
import { parisDateStr, parisToUtc } from "./time";

export { phoneKey };

// ——— Identification des clients ———

export type ClientInput = { name: string; email?: string; phone?: string };

/**
 * Retrouve la fiche d'une personne (par email, sinon par téléphone) ou la crée.
 * Complète les coordonnées manquantes sans écraser celles déjà connues.
 */
export async function findOrCreateClient(input: ClientInput, db?: DB): Promise<string | null> {
  const d = db ?? (await getDb());
  const name = input.name.trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const phone = (input.phone ?? "").trim();
  const key = phoneKey(phone);
  if (!name && !email && !key) return null;

  let existing: Client | undefined;
  if (email) [existing] = await d.select().from(clients).where(eq(clients.email, email)).limit(1);
  if (!existing && key) [existing] = await d.select().from(clients).where(eq(clients.phoneKey, key)).limit(1);

  if (existing) {
    const patch: Partial<Client> = {};
    if (!existing.email && email) patch.email = email;
    if (!existing.phone && phone) Object.assign(patch, { phone, phoneKey: key });
    if (!existing.name && name) patch.name = name;
    if (Object.keys(patch).length) {
      await d.update(clients).set({ ...patch, updatedAt: new Date() }).where(eq(clients.id, existing.id));
    }
    return existing.id;
  }

  const [row] = await d
    .insert(clients)
    .values({ name: name || email || phone, email, phone, phoneKey: key })
    .returning({ id: clients.id });
  return row.id;
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
  const rows = await db
    .select({
      client: clients,
      visits: sql<number>`(select count(*) from appointments a where a.client_id = "clients"."id" and a.status = 'confirmed' and a.ends_at < ${now})`,
      lastVisit: sql<number | null>`(select max(a.starts_at) from appointments a where a.client_id = "clients"."id" and a.status = 'confirmed' and a.starts_at < ${now})`,
      nextVisit: sql<number | null>`(select min(a.starts_at) from appointments a where a.client_id = "clients"."id" and a.status in ('pending', 'confirmed') and a.starts_at >= ${now})`,
      cancellations: sql<number>`(select count(*) from appointments a where a.client_id = "clients"."id" and a.status in ('cancelled', 'no_show'))`,
    })
    .from(clients)
    .where(
      q
        ? or(
            sql`lower(${clients.name}) like ${like}`,
            sql`${clients.email} like ${like}`,
            digits ? sql`${clients.phoneKey} like ${`%${digits}%`}` : undefined,
          )
        : undefined,
    );

  return rows
    .map((r) => ({
      ...r.client,
      visits: Number(r.visits),
      lastVisit: ms(r.lastVisit),
      nextVisit: ms(r.nextVisit),
      cancellations: Number(r.cancellations),
    }))
    .sort((a, b) => activity(b) - activity(a));
}

const activity = (c: ClientRow) => Math.max(c.nextVisit?.getTime() ?? 0, c.lastVisit?.getTime() ?? 0, c.createdAt.getTime());

export async function crmStats() {
  const db = await getDb();
  const now = new Date();
  const monthStart = parisToUtc(`${parisDateStr(now).slice(0, 7)}-01`, "00:00");
  const [[total], [newClients], [sessions], [upcoming]] = await Promise.all([
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
  ]);
  return {
    total: Number(total.n),
    newLast30: Number(newClients.n),
    sessionsThisMonth: Number(sessions.n),
    upcoming: Number(upcoming.n),
  };
}

// ——— Fiche détaillée ———

export type ClientDetail = {
  client: Client;
  appointments: Appointment[];
  messages: ContactMessage[];
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
  const [appts, messages] = await Promise.all([
    db.select().from(appointments).where(eq(appointments.clientId, id)).orderBy(desc(appointments.startsAt)),
    db.select().from(contactMessages).where(eq(contactMessages.clientId, id)).orderBy(desc(contactMessages.createdAt)),
  ]);
  const now = Date.now();
  const done = appts.filter((a) => a.status === "confirmed" && a.endsAt.getTime() < now);
  const future = appts
    .filter((a) => (a.status === "confirmed" || a.status === "pending") && a.startsAt.getTime() >= now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const counts = new Map<string, number>();
  for (const a of done) counts.set(a.serviceName, (counts.get(a.serviceName) ?? 0) + 1);

  return {
    client,
    appointments: appts,
    messages,
    stats: {
      visits: done.length,
      upcoming: future.length,
      cancelled: appts.filter((a) => a.status === "cancelled").length,
      noShow: appts.filter((a) => a.status === "no_show").length,
      firstVisit: done.at(-1)?.startsAt ?? null,
      lastVisit: done[0]?.startsAt ?? null,
      nextVisit: future[0] ?? null,
      favorites: [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
      estimatedTotal: done.reduce((sum, a) => sum + priceOf(a.serviceId), 0),
    },
  };
}

export type ClientFields = { name: string; email: string; phone: string; birthdate: string; notes: string };

export async function createClient(fields: ClientFields) {
  const db = await getDb();
  const [row] = await db
    .insert(clients)
    .values({ ...fields, email: fields.email.toLowerCase(), phoneKey: phoneKey(fields.phone) })
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

/** Droit à l'effacement (RGPD) : supprime la fiche, ses rendez-vous et ses messages. */
export async function deleteClient(id: string) {
  const db = await getDb();
  await db.batch([
    db.delete(appointments).where(eq(appointments.clientId, id)),
    db.delete(contactMessages).where(eq(contactMessages.clientId, id)),
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

export async function exportClientsCsv(): Promise<string> {
  const rows = await listClients();
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const date = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
  const header = ["Nom", "Email", "Téléphone", "Date de naissance", "Cliente depuis", "Séances", "Dernière séance", "Prochain rendez-vous", "Annulations/absences", "Notes"];
  const lines = rows.map((c) =>
    [c.name, c.email, c.phone, c.birthdate, date(c.createdAt), c.visits, date(c.lastVisit), date(c.nextVisit), c.cancellations, c.notes]
      .map(esc)
      .join(";"),
  );
  // BOM pour qu'Excel affiche correctement les accents.
  return "﻿" + [header.join(";"), ...lines].join("\r\n");
}
