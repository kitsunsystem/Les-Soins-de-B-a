import { describe, expect, it } from "vitest";
import { rangesForDate, slotsForDate, type BookingRules } from "./availability";
import { parisToUtc, parisTimeStr } from "./time";

const rules: BookingRules = { slotStepMinutes: 30, bufferMinutes: 15, minNoticeHours: 24, maxDaysAhead: 60 };
const now = new Date("2026-11-19T08:00:00Z");

describe("parisToUtc", () => {
  it("gère l'heure d'hiver et d'été", () => {
    expect(parisToUtc("2026-01-15", "10:00").toISOString()).toBe("2026-01-15T09:00:00.000Z");
    expect(parisToUtc("2026-07-15", "10:00").toISOString()).toBe("2026-07-15T08:00:00.000Z");
    // Lendemain du passage à l'heure d'été (29 mars 2026)
    expect(parisToUtc("2026-03-30", "09:00").toISOString()).toBe("2026-03-30T07:00:00.000Z");
    expect(parisTimeStr(parisToUtc("2026-10-26", "14:30"))).toBe("14:30");
  });
});

describe("rangesForDate", () => {
  const weekly = [
    { weekday: 5, start: "14:00", end: "19:00" },
    { weekday: 5, start: "09:00", end: "12:00" },
  ];
  it("utilise les horaires habituels triés", () => {
    expect(rangesForDate("2026-11-20", weekly, new Map())).toEqual([
      { start: "09:00", end: "12:00" },
      { start: "14:00", end: "19:00" },
    ]);
  });
  it("donne la priorité aux exceptions", () => {
    const o = new Map([["2026-11-20", { date: "2026-11-20", closed: true, ranges: [] }]]);
    expect(rangesForDate("2026-11-20", weekly, o)).toEqual([]);
    const o2 = new Map([
      ["2026-11-20", { date: "2026-11-20", closed: false, ranges: [{ start: "10:00", end: "11:00" }] }],
    ]);
    expect(rangesForDate("2026-11-20", weekly, o2)).toEqual([{ start: "10:00", end: "11:00" }]);
  });
});

describe("slotsForDate", () => {
  const ranges = [{ start: "09:00", end: "12:00" }];
  it("découpe les plages selon la durée du soin", () => {
    const s = slotsForDate({ date: "2026-11-25", duration: 60, ranges, busy: [], rules, now });
    expect(s.map((x) => x.time)).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);
  });
  it("respecte le délai de prévenance", () => {
    // now = 19/11 9h Paris ; délai 24 h → le 20/11 avant 9h00 est exclu
    const s = slotsForDate({ date: "2026-11-20", duration: 30, ranges: [{ start: "08:00", end: "10:00" }], busy: [], rules, now });
    expect(s.map((x) => x.time)).toEqual(["09:00", "09:30"]);
  });
  it("exclut les créneaux qui chevauchent un rendez-vous (avec battement)", () => {
    const busy = [{ startsAt: parisToUtc("2026-11-25", "10:00"), endsAt: parisToUtc("2026-11-25", "11:00") }];
    const s = slotsForDate({ date: "2026-11-25", duration: 30, ranges, busy, rules, now });
    // 09:30-10:00 touche le battement de 15 min → exclu ; 11:00 aussi
    expect(s.map((x) => x.time)).toEqual(["09:00", "11:30"]);
  });
  it("refuse les dates passées ou trop lointaines", () => {
    expect(slotsForDate({ date: "2026-11-18", duration: 30, ranges, busy: [], rules, now })).toEqual([]);
    expect(slotsForDate({ date: "2027-03-01", duration: 30, ranges, busy: [], rules, now })).toEqual([]);
  });
});
