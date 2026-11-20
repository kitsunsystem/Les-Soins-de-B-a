import { CalendarCheck, Check, ChevronLeft, ChevronRight, Clock, HandHeart, MailCheck } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { categories, categoryIcons, etapes, reservation, services } from "../script";
import { colors, EASE_IN_OUT, EASE_OUT, fonts, shadows, titre } from "../theme";
import { Body, Card, CategoryBadge, clamp, Eyebrow, FadeUp, FondLin, Title, typo, useAppear } from "../ui";

// Géométrie de la maquette (coordonnées internes à la carte).
const CARTE = { w: 900, h: 740 };
const OPTION = { w: 393, h: 108, gap: 18 };
const CAL = { x: 48, y: 222, w: 450, h: 400, pad: 24, cell: 52.3, cellH: 48, gap: 6, gridTop: 110 };
const HEURES = { x: 518, y: 222, w: 334, h: 400 };
const CHIPS = { x: HEURES.x + 24, w: 136, h: 50, gap: 14 };
const BOUTON = { x: 612, y: 650, w: 240, h: 60 };
const JOUR_CHOISI = 8;
const OFFSET = 1; // décembre 2026 commence un mardi (lundi en premier)
const FERMES = [6, 13, 20, 24, 25, 26, 27, 31];
const HEURE_CHOISIE = "14h00";

const etape1 = (() => {
  let y = 112;
  return reservation.groupes.map((g) => {
    const legende = y;
    const options = g.soins.map((id, i) => ({
      id,
      x: 48 + (i % 2) * (OPTION.w + OPTION.gap),
      y: legende + 58 + Math.floor(i / 2) * (OPTION.h + OPTION.gap),
    }));
    y = legende + 58 + Math.ceil(g.soins.length / 2) * (OPTION.h + OPTION.gap) + 12;
    return { ...g, legende, options };
  });
})();
const SOIN_CHOISI = reservation.groupes[0].soins[0];

const centreJour = (d: number) => {
  const i = OFFSET + d - 1;
  return {
    x: CAL.x + CAL.pad + (i % 7) * (CAL.cell + CAL.gap) + CAL.cell / 2,
    y: CAL.y + CAL.gridTop + Math.floor(i / 7) * (CAL.cellH + CAL.gap) + CAL.cellH / 2,
  };
};

const groupes = [
  { label: "Matin", heures: reservation.creneaux.filter((h) => parseInt(h) < 12), y: HEURES.y + 104 },
  { label: "Après-midi", heures: reservation.creneaux.filter((h) => parseInt(h) >= 12 && parseInt(h) < 18), y: HEURES.y + 200 },
  { label: "Soir", heures: reservation.creneaux.filter((h) => parseInt(h) >= 18), y: HEURES.y + 296 },
];

/** Pression d'un clic : 0 au repos, 1 au moment du clic. */
const pression = (frame: number, clic: number) => interpolate(frame, [clic - 4, clic, clic + 5], [0, 1, 0], clamp);

/**
 * « Votre séance en 3 étapes » et la démonstration de la prise de rendez-vous en ligne.
 * La confirmation apparaît quand la voix dit « Béatrice vous confirme votre rendez-vous » (`confirmation`).
 */
export const Reservation: React.FC<{ duration: number; confirmation: number }> = ({ confirmation }) => {
  const frame = useCurrentFrame();
  const T = {
    clicSoin: 28,
    etape2: 36,
    clicJour: 52,
    clicHeure: 68,
    clicContinuer: Math.min(84, confirmation - 18),
    confirmation: confirmation - 8,
  };
  const carte = useAppear(2, 20);
  const phase1 = interpolate(frame, [T.etape2 - 6, T.etape2 + 1], [1, 0], clamp);
  const phase2 = interpolate(frame, [T.etape2 - 1, T.etape2 + 6, T.confirmation - 4, T.confirmation + 2], [0, 1, 1, 0], clamp);
  const phase3 = interpolate(frame, [T.confirmation, T.confirmation + 12], [0, 1], { ...clamp, easing: EASE_OUT });
  const etapeActive = frame < T.confirmation ? 0 : 1;

  return (
    <AbsoluteFill>
      <FondLin rameaux={false} />
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 90 }}>
        <div style={{ width: 640 }}>
          <FadeUp delay={0} distance={14}>
            <Eyebrow>En toute simplicité</Eyebrow>
          </FadeUp>
          <FadeUp delay={3}>
            <Title size={80} style={{ marginTop: 20 }}>
              Votre séance en 3 étapes
            </Title>
          </FadeUp>
          <div style={{ marginTop: 46, display: "flex", flexDirection: "column", gap: 30 }}>
            {etapes.map((e, i) => (
              <FadeUp key={e.titre} delay={7 + i * 3} distance={18}>
                <Etape numero={i + 1} titre={e.titre} texte={e.texte} actif={etapeActive === i} fait={etapeActive > i} icone={[CalendarCheck, MailCheck, HandHeart][i]} />
              </FadeUp>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", width: CARTE.w, height: CARTE.h, opacity: carte, transform: `translateY(${(1 - carte) * 40}px)` }}>
          <Card style={{ position: "absolute", inset: 0, boxShadow: shadows.soft }}>{null}</Card>
          <div style={{ position: "absolute", left: 100, top: 40, width: 700, opacity: 1 - phase3 }}>
            <Etapes etape={frame < T.etape2 ? 1 : 2} />
          </div>
          {phase1 > 0 && <Etape1 frame={frame} opacite={phase1} clic={T.clicSoin} />}
          {phase2 > 0 && (
            <div style={{ position: "absolute", inset: 0, opacity: phase2 }}>
              <ResumeSoin />
              <Calendrier frame={frame} clic={T.clicJour} />
              <Creneaux frame={frame} clicJour={T.clicJour} clicHeure={T.clicHeure} />
              <div
                style={{
                  position: "absolute",
                  left: BOUTON.x,
                  top: BOUTON.y,
                  width: BOUTON.w,
                  height: BOUTON.h,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontFamily: fonts.sans,
                  fontWeight: 650,
                  fontSize: 23,
                  color: "#fff",
                  background: colors.forest,
                  boxShadow: shadows.soft,
                  opacity: frame >= T.clicHeure ? 1 : 0.5,
                  transform: `scale(${1 - 0.04 * pression(frame, T.clicContinuer)})`,
                }}
              >
                Continuer
                <ChevronRight size={24} strokeWidth={2.2} />
              </div>
            </div>
          )}
          {phase3 > 0 && <Confirmation progression={phase3} />}
          <Curseur frame={frame} T={T} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

function Etape({
  numero,
  titre: t,
  texte,
  actif,
  fait,
  icone: Icone,
}: {
  numero: number;
  titre: string;
  texte: string;
  actif: boolean;
  fait: boolean;
  icone: typeof CalendarCheck;
}) {
  const frame = useCurrentFrame();
  const on = actif ? 1 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, opacity: actif || fait ? 1 : 0.62 }}>
      <div
        style={{
          position: "relative",
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: interpolateColors(on, [0, 1], [colors.card, colors.forest]),
          color: actif ? colors.linen : colors.forest,
          boxShadow: shadows.card,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transform: `scale(${actif ? 1.06 + 0.02 * Math.sin(frame / 6) : 1})`,
        }}
      >
        <Icone size={38} strokeWidth={1.5} />
        <span
          style={{
            position: "absolute",
            right: -6,
            top: -6,
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: colors.clay,
            color: "#fff",
            fontFamily: fonts.sans,
            fontSize: 18,
            fontWeight: 750,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {fait ? <Check size={18} strokeWidth={3} /> : numero}
        </span>
      </div>
      <div>
        <div style={{ ...titre, fontSize: 38, color: colors.ink }}>{typo(t)}</div>
        <Body size={22} style={{ marginTop: 4 }}>
          {texte}
        </Body>
      </div>
    </div>
  );
}

function Etapes({ etape }: { etape: number }) {
  const labels = ["Soin", "Date & heure", "Coordonnées"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      {labels.map((l, i) => {
        const n = i + 1;
        const fait = etape > n;
        const actuel = etape === n;
        return (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 14, flex: i < labels.length - 1 ? 1 : undefined }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.sans,
                fontWeight: 650,
                fontSize: 19,
                background: actuel ? colors.forest : fait ? colors.sage : colors.card,
                color: actuel || fait ? "#fff" : colors.inkSoft,
                boxShadow: actuel || fait ? "none" : `inset 0 0 0 1.5px ${colors.line}`,
              }}
            >
              {fait ? <Check size={22} strokeWidth={2.6} /> : n}
            </div>
            <span style={{ fontFamily: fonts.sans, fontSize: 20, fontWeight: actuel ? 750 : 400, color: actuel ? colors.ink : colors.inkSoft, whiteSpace: "nowrap" }}>
              {l}
            </span>
            {i < labels.length - 1 && <div style={{ flex: 1, height: 1.5, background: colors.line }} />}
          </div>
        );
      })}
    </div>
  );
}

function Etape1({ frame, opacite, clic }: { frame: number; opacite: number; clic: number }) {
  return (
    <div style={{ position: "absolute", inset: 0, opacity: opacite }}>
      {etape1.map((g, gi) => {
        const categorie = categories.find((c) => c.id === g.categorie);
        if (!categorie) return null;
        return (
          <div key={g.categorie}>
            <div
              style={{
                ...titre,
                position: "absolute",
                left: 48,
                top: g.legende,
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontSize: 34,
                color: colors.ink,
                opacity: interpolate(frame, [6 + gi * 6, 18 + gi * 6], [0, 1], clamp),
              }}
            >
              <CategoryBadge category={categorie} icon={categoryIcons[categorie.icon]} size={46} />
              {categorie.name}
            </div>
            {g.options.map((o, i) => {
              const s = services.find((x) => x.id === o.id);
              if (!s) return null;
              const cible = o.id === SOIN_CHOISI;
              return (
                <Option
                  key={o.id}
                  style={{ left: o.x, top: o.y, width: OPTION.w, height: OPTION.h }}
                  choisi={cible && frame >= clic}
                  press={cible ? pression(frame, clic) : 0}
                  apparition={8 + gi * 6 + i * 2}
                >
                  <div style={{ ...titre, fontSize: 26, lineHeight: 1.1, color: colors.ink, whiteSpace: "nowrap" }}>{s.name}</div>
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: fonts.sans, fontSize: 19, color: colors.inkSoft }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Clock size={19} strokeWidth={1.75} />
                      {s.durationLabel}
                    </span>
                    <span style={{ ...titre, fontSize: 29, color: colors.clay }}>{s.price}</span>
                  </div>
                </Option>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function Option({ style, choisi, press, apparition, children }: { style: CSSProperties; choisi: boolean; press: number; apparition: number; children: ReactNode }) {
  const p = useAppear(apparition, 16);
  return (
    <div
      style={{
        position: "absolute",
        boxSizing: "border-box",
        padding: "18px 26px",
        borderRadius: 24,
        background: colors.card,
        border: `1.5px solid ${choisi ? colors.forest : "rgba(230, 221, 208, 0.95)"}`,
        boxShadow: choisi ? `0 0 0 6px rgba(52, 84, 69, 0.18), ${shadows.soft}` : shadows.card,
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px) scale(${1 - 0.02 * press})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ResumeSoin() {
  const s = services.find((x) => x.id === SOIN_CHOISI);
  if (!s) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        top: 112,
        width: 804,
        height: 86,
        boxSizing: "border-box",
        padding: "0 30px",
        borderRadius: 22,
        background: colors.card,
        border: "1.5px solid rgba(230, 221, 208, 0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ fontFamily: fonts.sans, fontSize: 17, fontWeight: 750, letterSpacing: "0.16em", textTransform: "uppercase", color: colors.inkSoft }}>Soin choisi</div>
        <div style={{ ...titre, fontSize: 31, color: colors.ink }}>{s.name}</div>
      </div>
      <div style={{ fontFamily: fonts.sans, fontSize: 21, color: colors.inkSoft }}>
        {s.durationLabel} · {s.price}
      </div>
    </div>
  );
}

function Calendrier({ frame, clic }: { frame: number; clic: number }) {
  const jourChoisi = frame >= clic;
  const press = pression(frame, clic);
  return (
    <div
      style={{
        position: "absolute",
        left: CAL.x,
        top: CAL.y,
        width: CAL.w,
        height: CAL.h,
        boxSizing: "border-box",
        borderRadius: 26,
        background: colors.card,
        border: "1.5px solid rgba(230, 221, 208, 0.95)",
      }}
    >
      <div style={{ position: "absolute", left: 18, right: 18, top: 16, display: "flex", alignItems: "center", justifyContent: "space-between", color: colors.inkSoft }}>
        <ChevronLeft size={26} strokeWidth={1.75} style={{ opacity: 0.35 }} />
        <span style={{ ...titre, fontSize: 31, color: colors.ink }}>Décembre</span>
        <ChevronRight size={26} strokeWidth={1.75} />
      </div>
      <div style={{ position: "absolute", left: CAL.pad, top: 72, display: "flex", gap: CAL.gap }}>
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div key={d} style={{ width: CAL.cell, textAlign: "center", fontFamily: fonts.sans, fontSize: 17, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: colors.inkSoft }}>
            {d}
          </div>
        ))}
      </div>
      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
        const c = centreJour(d);
        const dispo = !FERMES.includes(d) && d > 1;
        const choisi = d === JOUR_CHOISI && jourChoisi;
        return (
          <div
            key={d}
            style={{
              position: "absolute",
              left: c.x - CAL.x - CAL.cell / 2,
              top: c.y - CAL.y - CAL.cellH / 2,
              width: CAL.cell,
              height: CAL.cellH,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.sans,
              fontSize: 19,
              fontWeight: dispo ? 650 : 400,
              background: choisi ? colors.forest : dispo ? "rgba(230, 238, 230, 0.85)" : "transparent",
              color: choisi ? "#fff" : dispo ? colors.ink : "rgba(86, 101, 93, 0.38)",
              boxShadow: d === 1 ? `inset 0 0 0 1.5px ${colors.gold}` : "none",
              transform: d === JOUR_CHOISI ? `scale(${1 - 0.08 * press})` : undefined,
            }}
          >
            {d}
          </div>
        );
      })}
    </div>
  );
}

function Creneaux({ frame, clicJour, clicHeure }: { frame: number; clicJour: number; clicHeure: number }) {
  const visible = interpolate(frame, [clicJour + 2, clicJour + 12], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const choisie = frame >= clicHeure;
  const press = pression(frame, clicHeure);
  return (
    <div
      style={{
        position: "absolute",
        left: HEURES.x,
        top: HEURES.y,
        width: HEURES.w,
        height: HEURES.h,
        boxSizing: "border-box",
        borderRadius: 26,
        background: colors.card,
        border: "1.5px solid rgba(230, 221, 208, 0.95)",
      }}
    >
      {visible < 1 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 34, textAlign: "center", fontFamily: fonts.sans, fontSize: 19, lineHeight: 1.55, color: colors.inkSoft, opacity: 1 - visible }}>
          Choisissez un jour en vert dans le calendrier pour voir les horaires disponibles.
        </div>
      )}
      <div style={{ opacity: visible }}>
        <div style={{ ...titre, position: "absolute", left: 24, top: 20, fontSize: 29, color: colors.ink }}>Mardi 8 décembre</div>
        {groupes.map((g) => (
          <div key={g.label}>
            <div style={{ position: "absolute", left: 24, top: g.y - HEURES.y, fontFamily: fonts.sans, fontSize: 17, fontWeight: 750, letterSpacing: "0.16em", textTransform: "uppercase", color: colors.inkSoft }}>
              {g.label}
            </div>
            {g.heures.map((h, j) => {
              const sel = choisie && h === HEURE_CHOISIE;
              return (
                <div
                  key={h}
                  style={{
                    position: "absolute",
                    left: CHIPS.x - HEURES.x + j * (CHIPS.w + CHIPS.gap),
                    top: g.y - HEURES.y + 26,
                    width: CHIPS.w,
                    height: CHIPS.h,
                    boxSizing: "border-box",
                    borderRadius: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonts.sans,
                    fontSize: 19,
                    fontWeight: sel ? 750 : 400,
                    border: `1.5px solid ${sel ? colors.forest : colors.line}`,
                    background: sel ? colors.forest : "#fff",
                    color: sel ? "#fff" : colors.ink,
                    transform: h === HEURE_CHOISIE ? `scale(${1 - 0.06 * press})` : undefined,
                  }}
                >
                  {h}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Confirmation({ progression }: { progression: number }) {
  const s = services.find((x) => x.id === SOIN_CHOISI);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 90px",
        opacity: progression,
        transform: `translateY(${(1 - progression) * 22}px)`,
      }}
    >
      <div style={{ color: colors.sage, transform: `scale(${0.7 + 0.3 * progression})` }}>
        <MailCheck size={92} strokeWidth={1.5} />
      </div>
      <div style={{ ...titre, marginTop: 24, fontSize: 58, color: colors.ink }}>Demande envoyée, merci&nbsp;!</div>
      <Body size={22} style={{ marginTop: 18 }}>
        Le créneau est réservé pour vous. Vous allez recevoir un email récapitulatif, puis la confirmation de Béatrice très rapidement.
      </Body>
      <div
        style={{
          marginTop: 30,
          width: 460,
          boxSizing: "border-box",
          padding: "24px 30px",
          borderRadius: 26,
          background: colors.sand,
          textAlign: "left",
          fontFamily: fonts.sans,
          fontSize: 22,
          color: colors.ink,
          lineHeight: 1.6,
        }}
      >
        <div style={{ ...titre, fontSize: 33 }}>{s?.name}</div>
        <div style={{ marginTop: 4 }}>Mardi 8 décembre</div>
        <div>à {HEURE_CHOISIE}</div>
      </div>
    </div>
  );
}

function Curseur({ frame, T }: { frame: number; T: Record<"clicSoin" | "clicJour" | "clicHeure" | "clicContinuer" | "confirmation" | "etape2", number> }) {
  const option = etape1[0].options[0];
  const cibles = {
    depart: { x: 980, y: 820 },
    soin: { x: option.x + OPTION.w * 0.62, y: option.y + OPTION.h / 2 },
    jour: centreJour(JOUR_CHOISI),
    heure: { x: CHIPS.x + CHIPS.w / 2, y: groupes[1].y + 26 + CHIPS.h / 2 },
    continuer: { x: BOUTON.x + BOUTON.w / 2 + 20, y: BOUTON.y + BOUTON.h / 2 },
  };
  const trajet = [
    { f: 8, p: cibles.depart },
    { f: T.clicSoin - 4, p: cibles.soin },
    { f: T.etape2 + 2, p: cibles.soin },
    { f: T.clicJour - 4, p: cibles.jour },
    { f: T.clicJour + 2, p: cibles.jour },
    { f: T.clicHeure - 4, p: cibles.heure },
    { f: T.clicHeure + 2, p: cibles.heure },
    { f: T.clicContinuer - 4, p: cibles.continuer },
  ];
  let p = trajet[0].p;
  for (let i = 0; i < trajet.length - 1; i++) {
    const a = trajet[i];
    const b = trajet[i + 1];
    if (frame >= a.f && frame <= b.f) {
      const k = interpolate(frame, [a.f, b.f], [0, 1], { ...clamp, easing: EASE_IN_OUT });
      p = { x: a.p.x + (b.p.x - a.p.x) * k, y: a.p.y + (b.p.y - a.p.y) * k };
    } else if (frame > b.f) {
      p = b.p;
    }
  }
  const opacite = interpolate(frame, [6, 12, T.clicContinuer + 6, T.clicContinuer + 12], [0, 1, 1, 0], clamp);
  const clics = [T.clicSoin, T.clicJour, T.clicHeure, T.clicContinuer];
  const press = Math.max(...clics.map((c) => pression(frame, c)));
  return (
    <>
      {clics.map((c) => {
        const r = interpolate(frame, [c, c + 14], [0, 1], clamp);
        if (r <= 0 || r >= 1) return null;
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: p.x - 34,
              top: p.y - 34,
              width: 68,
              height: 68,
              borderRadius: "50%",
              border: `3px solid ${colors.forest}`,
              opacity: (1 - r) * 0.7,
              transform: `scale(${0.3 + r})`,
            }}
          />
        );
      })}
      <svg
        width={40}
        height={46}
        viewBox="0 0 20 23"
        style={{
          position: "absolute",
          left: p.x - 5,
          top: p.y - 3,
          opacity: opacite,
          transform: `scale(${1 - 0.12 * press})`,
          transformOrigin: "5px 3px",
          filter: "drop-shadow(0 4px 6px rgba(38, 53, 46, 0.25))",
        }}
      >
        <path d="M2.5 1.5 L2.5 18.5 L7 14.2 L10.2 21.2 L13.2 19.9 L10.1 13 L16.4 13 Z" fill="#fff" stroke={colors.ink} strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </>
  );
}
