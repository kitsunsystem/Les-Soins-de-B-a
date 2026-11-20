// Lecture du classeur « Suivi_clientes_Soins_de_Bea.xlsx » (feuilles Annuaire et Séances).
// Fonction pure : reçoit les feuilles déjà lues (read-excel-file) et renvoie les données à importer.

export type Sheet = { sheet: string; data: unknown[][] };

export type ImportedClient = {
  key: string; // « Nom Prénom », comme la colonne Identifiant du classeur
  lastName: string;
  firstName: string;
  birthdate: string;
  phone: string;
  email: string;
  address: string;
  firstVisit: string;
  howFound: string;
  motive: string;
  vigilance: string;
  admissionReceived: boolean;
  consentDate: string;
  notes: string;
};

export type ImportedSession = {
  clientKey: string;
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

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const str = (v: unknown) => (v === null || v === undefined ? "" : v instanceof Date ? dateStr(v) : String(v).trim());

/** Date du classeur (objet Date, numéro de série Excel ou texte JJ/MM/AAAA) → AAAA-MM-JJ. */
export function dateStr(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    // Les dates Excel sont lues à minuit UTC : on ajoute 12 h pour éviter tout décalage de fuseau.
    return new Date(v.getTime() + 12 * 3600_000).toISOString().slice(0, 10);
  }
  if (typeof v === "number" && v > 20000 && v < 80000) {
    return new Date(Date.UTC(1899, 11, 30) + v * 86400_000).toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return "";
}

/** Trouve la ligne d'en-tête (celle qui contient les libellés attendus) et renvoie l'index des colonnes. */
function locate(data: unknown[][], expected: Record<string, string>) {
  for (let r = 0; r < Math.min(data.length, 15); r++) {
    const row = data[r].map((c) => norm(str(c)));
    const cols: Record<string, number> = {};
    for (const [key, label] of Object.entries(expected)) {
      const i = row.findIndex((c) => c === norm(label) || c.startsWith(norm(label)));
      if (i >= 0) cols[key] = i;
    }
    if (Object.keys(cols).length >= Math.ceil(Object.keys(expected).length * 0.6)) return { header: r, cols };
  }
  return null;
}

const isExample = (name: string) => norm(name).startsWith("exemple");

export function parseWorkbook(sheets: Sheet[]) {
  const warnings: string[] = [];
  const find = (name: string) => sheets.find((s) => norm(s.sheet) === norm(name));

  const clients: ImportedClient[] = [];
  const annuaire = find("Annuaire");
  if (!annuaire) warnings.push("Feuille « Annuaire » introuvable.");
  else {
    const loc = locate(annuaire.data, {
      lastName: "Nom",
      firstName: "Prénom",
      birthdate: "Date de naissance",
      phone: "Téléphone",
      email: "Email",
      address: "Adresse",
      firstVisit: "Date 1ère venue",
      howFound: "Comment m'a connue",
      motive: "Motif initial",
      vigilance: "Points de vigilance",
      admission: "Fiche d'admission reçue",
      consent: "Consentement daté du",
      notes: "Notes générales",
    });
    if (!loc) warnings.push("Annuaire : ligne d'en-tête introuvable.");
    else {
      const get = (row: unknown[], k: string) => (loc.cols[k] === undefined ? "" : str(row[loc.cols[k]]));
      for (const row of annuaire.data.slice(loc.header + 1)) {
        const lastName = get(row, "lastName");
        const firstName = get(row, "firstName");
        if (!lastName && !firstName) continue;
        if (isExample(lastName)) continue;
        clients.push({
          key: `${lastName} ${firstName}`.trim(),
          lastName,
          firstName,
          birthdate: dateStr(row[loc.cols.birthdate]),
          phone: get(row, "phone"),
          email: get(row, "email").toLowerCase(),
          address: get(row, "address"),
          firstVisit: dateStr(row[loc.cols.firstVisit]),
          howFound: get(row, "howFound"),
          motive: get(row, "motive"),
          vigilance: get(row, "vigilance"),
          admissionReceived: norm(get(row, "admission")) === "oui",
          consentDate: dateStr(row[loc.cols.consent]),
          notes: get(row, "notes"),
        });
      }
    }
  }

  const sessions: ImportedSession[] = [];
  const seances = find("Séances");
  if (!seances) warnings.push("Feuille « Séances » introuvable.");
  else {
    const loc = locate(seances.data, {
      date: "Date",
      client: "Cliente",
      prestation: "Prestation",
      duration: "Durée",
      motive: "Motif du jour",
      change: "Changement signalé",
      observations: "Observations",
      feeling: "Ressenti",
      advice: "Conseils donnés",
      next: "Prochaine séance",
    });
    if (!loc) warnings.push("Séances : ligne d'en-tête introuvable.");
    else {
      const get = (row: unknown[], k: string) => (loc.cols[k] === undefined ? "" : str(row[loc.cols[k]]));
      const known = new Set(clients.map((c) => norm(c.key)));
      for (const row of seances.data.slice(loc.header + 1)) {
        const clientKey = get(row, "client");
        const date = dateStr(row[loc.cols.date]);
        if (!clientKey || !date || isExample(clientKey)) continue;
        if (!known.has(norm(clientKey))) {
          warnings.push(`Séance du ${date} : cliente « ${clientKey} » absente de l'annuaire, ligne ignorée.`);
          continue;
        }
        const duration = Number(row[loc.cols.duration]);
        sessions.push({
          clientKey,
          date,
          prestation: get(row, "prestation") || "Autre",
          durationMinutes: Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null,
          motive: get(row, "motive"),
          changeReported: norm(get(row, "change")).startsWith("oui"),
          observations: get(row, "observations"),
          feeling: get(row, "feeling"),
          advice: get(row, "advice"),
          nextSession: dateStr(row[loc.cols.next]),
        });
      }
    }
  }

  return { clients, sessions, warnings };
}

export const normalizeKey = norm;
