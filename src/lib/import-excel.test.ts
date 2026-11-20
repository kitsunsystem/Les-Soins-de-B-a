import { describe, expect, it } from "vitest";
import { dateStr, parseWorkbook } from "./import-excel";

// Reproduit la structure du classeur « Suivi_clientes_Soins_de_Bea.xlsx » (titre, consigne, en-têtes, lignes).
const annuaire = [
  ["ANNUAIRE DES CLIENTES  —  une ligne par personne", null],
  ["Remplissez une ligne à la réception de la fiche d'admission.", null],
  ["Nom", "Prénom", "Date de naissance", "Téléphone", "Email", "Adresse", "Date 1ère venue", "Comment m'a connue",
    "Motif initial / objectif", "Points de vigilance (contre-indications)", "Fiche d'admission reçue",
    "Consentement daté du", "Notes générales", "Identifiant (auto)"],
  ["Exemple", "Marie", new Date("1978-03-14T00:00:00Z"), "06 12 34 56 78", "marie.exemple@mail.fr", "", null, "", "", "", "Oui", null, "", "Exemple Marie"],
  ["Durand", "Claire", new Date("1985-06-02T00:00:00Z"), "06 11 22 33 44", "Claire.D@Mail.fr", "3 rue X, Perpignan",
    new Date("2026-01-10T00:00:00Z"), "Instagram", "Stress", "Aucune contre-indication signalée", "Oui",
    new Date("2026-01-10T00:00:00Z"), "Aime la musique douce", "Durand Claire"],
  ["Martin", "Léa", "14/02/1990", "0699887766", "", "", null, "", "", "Phlébite", "Non", null, "", "Martin Léa"],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, ""],
];
const seances = [
  ["JOURNAL DES SÉANCES  —  une ligne à chaque venue", null],
  ["Une ligne par séance.", null],
  ["Date", "Cliente", "Prestation", "Durée (min)", "Motif du jour", "Changement signalé ?", "Observations",
    "Ressenti de la cliente", "Conseils donnés", "Prochaine séance", "Clé (auto)"],
  [new Date("2026-09-02T00:00:00Z"), "Exemple Marie", "Réflexologie", 60, "", "Non", "", "", "", null, "Exemple Marie#1"],
  [new Date("2026-01-10T00:00:00Z"), "Durand Claire", "Réflexologie", 45, "Cervicales", "Non", "Tensions", "Légère", "Boire", new Date("2026-02-01T00:00:00Z"), "Durand Claire#1"],
  [new Date("2026-02-01T00:00:00Z"), "Durand Claire", "Massage", "60", "", "Oui — voir observations", "Nouveau traitement", "", "", null, "Durand Claire#2"],
  [new Date("2026-03-01T00:00:00Z"), "Inconnue Zoé", "Guidance", 30, "", "Non", "", "", "", null, "Inconnue Zoé#1"],
];

describe("dateStr", () => {
  it("lit les différents formats de date", () => {
    expect(dateStr(new Date("2026-09-02T00:00:00Z"))).toBe("2026-09-02");
    expect(dateStr("14/02/1990")).toBe("1990-02-14");
    expect(dateStr(46267)).toBe("2026-09-02");
    expect(dateStr("")).toBe("");
  });
});

describe("parseWorkbook", () => {
  const r = parseWorkbook([
    { sheet: "Mode d'emploi", data: [["MODE D'EMPLOI"]] },
    { sheet: "Annuaire", data: annuaire },
    { sheet: "Séances", data: seances },
  ]);

  it("importe l'annuaire sans la ligne d'exemple", () => {
    expect(r.clients.map((c) => c.key)).toEqual(["Durand Claire", "Martin Léa"]);
    const claire = r.clients[0];
    expect(claire).toMatchObject({
      email: "claire.d@mail.fr",
      birthdate: "1985-06-02",
      firstVisit: "2026-01-10",
      admissionReceived: true,
      consentDate: "2026-01-10",
      vigilance: "Aucune contre-indication signalée",
    });
    expect(r.clients[1]).toMatchObject({ birthdate: "1990-02-14", admissionReceived: false, vigilance: "Phlébite" });
  });

  it("importe le journal des séances et signale les clientes inconnues", () => {
    expect(r.sessions).toHaveLength(2);
    expect(r.sessions[0]).toMatchObject({ clientKey: "Durand Claire", date: "2026-01-10", durationMinutes: 45, nextSession: "2026-02-01" });
    expect(r.sessions[1]).toMatchObject({ prestation: "Massage", durationMinutes: 60, changeReported: true });
    expect(r.warnings.some((w) => w.includes("Inconnue Zoé"))).toBe(true);
  });
});
