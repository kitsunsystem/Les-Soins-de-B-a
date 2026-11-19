import { Check, ChevronLeft, ChevronRight, ChevronRight as Fleche, Clock, MailCheck } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { categories, categoryIcons, reservation, services } from "../script";
import { colors, EASE_IN_OUT, fonts, shadows } from "../theme";
import { Body, Card, clamp, Eyebrow, FadeUp, IconBadge, Title, typo, useAppear, Watercolor } from "../ui";

// Chronologie de la démonstration (en images, à 30 i/s).
const T = {
  clicSoin: 44,
  etape2: 64,
  clicJour: 84,
  clicHeure: 106,
  clicContinuer: 124,
  confirmation: 132,
};

// Géométrie de la maquette (coordonnées internes à la carte).
const CARTE = { w: 930, h: 780 };
const CAL = { x: 48, y: 244, w: 470, h: 412, pad: 26, cell: 54.6, cellH: 50, gap: 6, gridTop: 118 };
const HEURES = { x: 540, y: 244, w: 342, h: 412 };
const JOUR_CHOISI = 8;
const OFFSET = 1; // décembre 2026 commence un mardi (lundi en premier)
const FERMES = [6, 13, 20, 24, 25, 26, 27, 31];

const centreJour = (d: number) => {
  const i = OFFSET + d - 1;
  const col = i % 7;
  const row = Math.floor(i / 7);
  return {
    x: CAL.x + CAL.pad + col * (CAL.cell + CAL.gap) + CAL.cell / 2,
    y: CAL.y + CAL.gridTop + row * (CAL.cellH + CAL.gap) + CAL.cellH / 2,
  };
};

const CHIPS = { x: HEURES.x + 26, w: 140, h: 52, gap: 14 };
const groupes = [
  { label: "Matin", heures: reservation.creneaux.filter((h) => parseInt(h) < 12), y: HEURES.y + 112 },
  { label: "Après-midi", heures: reservation.creneaux.filter((h) => parseInt(h) >= 12 && parseInt(h) < 18), y: HEURES.y + 214 },
  { label: "Soir", heures: reservation.creneaux.filter((h) => parseInt(h) >= 18), y: HEURES.y + 316 },
];
const HEURE_CHOISIE = "14h00";
const BOUTON = { x: 634, y: 682, w: 248, h: 64 };

// Étape 1 : deux univers, soins sur une grille de deux colonnes (comme la page de réservation du site).
const OPTION = { w: 408, h: 112, gap: 18 };
const etape1 = (() => {
  let y = 124;
  return reservation.groupes.map((g) => {
    const legende = y;
    const lignes = Math.ceil(g.soins.length / 2);
    const options = g.soins.map((id, i) => ({
      id,
      x: 48 + (i % 2) * (OPTION.w + OPTION.gap),
      y: legende + 62 + Math.floor(i / 2) * (OPTION.h + OPTION.gap),
    }));
    y = legende + 62 + lignes * (OPTION.h + OPTION.gap) + 16;
    return { ...g, legende, options };
  });
})();
const SOIN_CHOISI = reservation.groupes[0].soins[0];

const cible = {
  depart: { x: 1010, y: 860 },
  soin: { x: etape1[0].options[0].x + OPTION.w * 0.62, y: etape1[0].options[0].y + OPTION.h / 2 },
  jour: centreJour(JOUR_CHOISI),
  heure: { x: CHIPS.x + CHIPS.w / 2, y: groupes[1].y + 26 + CHIPS.h / 2 },
  continuer: { x: BOUTON.x + BOUTON.w / 2 + 20, y: BOUTON.y + BOUTON.h / 2 },
};

const trajet: { f: number; p: { x: number; y: number } }[] = [
  { f: 14, p: cible.depart },
  { f: 38, p: cible.soin },
  { f: 66, p: cible.soin },
  { f: 80, p: cible.jour },
  { f: 90, p: cible.jour },
  { f: 102, p: cible.heure },
  { f: 110, p: cible.heure },
  { f: 121, p: cible.continuer },
];

function positionCurseur(frame: number) {
  if (frame <= trajet[0].f) return trajet[0].p;
  for (let i = 0; i < trajet.length - 1; i++) {
    const a = trajet[i];
    const b = trajet[i + 1];
    if (frame <= b.f) {
      const t = interpolate(frame, [a.f, b.f], [0, 1], { ...clamp, easing: EASE_IN_OUT });
      return { x: a.p.x + (b.p.x - a.p.x) * t, y: a.p.y + (b.p.y - a.p.y) * t };
    }
  }
  return trajet[trajet.length - 1].p;
}

/** Pression d'un clic : 0 au repos, 1 au moment du clic. */
const pression = (frame: number, clic: number) =>
  interpolate(frame, [clic - 4, clic, clic + 5], [0, 1, 0], clamp);

export const Reservation: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const carte = useAppear(8, 32);
  const phase1 = interpolate(frame, [T.etape2 - 8, T.etape2 + 2], [1, 0], clamp);
  const phase2 = interpolate(frame, [T.etape2 - 2, T.etape2 + 8, T.confirmation - 6, T.confirmation + 2], [0, 1, 1, 0], clamp);
  const phase3 = interpolate(frame, [T.confirmation - 2, T.confirmation + 12], [0, 1], clamp);
  const etape = frame < T.etape2 ? 1 : 2;

  return (
    <AbsoluteFill>
      <Watercolor duration={duration} variant="page" zoom={[1.0, 1.06]} />
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 76 }}>
        <div style={{ width: 640 }}>
          <FadeUp delay={2}>
            <Eyebrow>Réservation</Eyebrow>
          </FadeUp>
          <FadeUp delay={8}>
            <Title size={86} style={{ marginTop: 8 }}>
              Réservez en ligne, en quelques clics
            </Title>
          </FadeUp>
          <FadeUp delay={16}>
            <Body size={27} style={{ marginTop: 30 }}>
              Choisissez votre soin, votre jour et votre créneau&nbsp;: vous recevez aussitôt un email récapitulatif, puis
              la confirmation de Béatrice.
            </Body>
          </FadeUp>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 20 }}>
            {reservation.avantages.map((a, i) => (
              <FadeUp key={a} delay={26 + i * 7} distance={20}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <IconBadge icon={Check} size={50} background={colors.sageSoft} color={colors.ink} />
                  <span style={{ fontFamily: fonts.sans, fontSize: 26, fontWeight: 500, color: colors.ink }}>{typo(a)}</span>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            width: CARTE.w,
            height: CARTE.h,
            opacity: carte,
            transform: `translateY(${(1 - carte) * 50}px)`,
          }}
        >
          <Card style={{ position: "absolute", inset: 0, boxShadow: shadows.soft }}>{null}</Card>

          {/* Étapes */}
          <div style={{ position: "absolute", left: 85, top: 46, width: 760, opacity: 1 - phase3 }}>
            <Etapes etape={etape} />
          </div>

          {/* Étape 1 : choix du soin */}
          {phase1 > 0 && (
            <div style={{ position: "absolute", inset: 0, opacity: phase1 }}>
              {etape1.map((g, gi) => {
                const categorie = categories.find((c) => c.id === g.categorie);
                if (!categorie) return null;
                const Icone = categoryIcons[categorie.icon];
                return (
                  <div key={g.categorie}>
                    <div
                      style={{
                        position: "absolute",
                        left: 48,
                        top: g.legende,
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        fontFamily: fonts.serif,
                        fontWeight: 500,
                        fontSize: 38,
                        color: colors.ink,
                        opacity: interpolate(frame, [10 + gi * 10, 26 + gi * 10], [0, 1], clamp),
                      }}
                    >
                      <IconBadge icon={Icone} size={48} />
                      {categorie.name}
                    </div>
                    {g.options.map((o, i) => {
                      const s = services.find((x) => x.id === o.id);
                      if (!s) return null;
                      const cliquee = o.id === SOIN_CHOISI;
                      return (
                        <Option
                          key={o.id}
                          style={{ left: o.x, top: o.y, width: OPTION.w, height: OPTION.h }}
                          choisi={cliquee && frame >= T.clicSoin}
                          press={cliquee ? pression(frame, T.clicSoin) : 0}
                          apparition={14 + gi * 12 + i * 4}
                        >
                          <div style={{ fontFamily: fonts.serif, fontWeight: 500, fontSize: 30, color: colors.ink, lineHeight: 1.1 }}>
                            {s.name}
                          </div>
                          <div
                            style={{
                              marginTop: 12,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontFamily: fonts.sans,
                              fontSize: 19,
                              color: colors.inkSoft,
                            }}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Clock size={19} strokeWidth={1.75} />
                              {s.durationLabel}
                            </span>
                            <span style={{ fontFamily: fonts.serif, fontSize: 30, color: colors.roseDeep }}>{s.price}</span>
                          </div>
                        </Option>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Étape 2 : date et heure */}
          {phase2 > 0 && (
            <div style={{ position: "absolute", inset: 0, opacity: phase2 }}>
              <ResumeSoin />
              <Calendrier frame={frame} />
              <Creneaux frame={frame} />
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
                  fontWeight: 500,
                  fontSize: 23,
                  color: "#fff",
                  background: colors.roseDeep,
                  boxShadow: shadows.soft,
                  opacity: frame >= T.clicHeure ? 1 : 0.55,
                  transform: `scale(${1 - 0.04 * pression(frame, T.clicContinuer)})`,
                }}
              >
                Continuer
                <Fleche size={24} strokeWidth={2} />
              </div>
            </div>
          )}

          {/* Étape 4 : confirmation */}
          {phase3 > 0 && <Confirmation progression={phase3} frame={frame} />}

          <Curseur frame={frame} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

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
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.sans,
                fontWeight: 500,
                fontSize: 20,
                background: actuel ? colors.roseDeep : fait ? colors.sage : colors.card,
                color: actuel || fait ? "#fff" : colors.inkSoft,
                boxShadow: actuel || fait ? "none" : `inset 0 0 0 1.5px ${colors.line}`,
              }}
            >
              {fait ? <Check size={22} strokeWidth={2.5} /> : n}
            </div>
            <span
              style={{
                fontFamily: fonts.sans,
                fontSize: 21,
                fontWeight: actuel ? 500 : 400,
                color: actuel ? colors.ink : colors.inkSoft,
                whiteSpace: "nowrap",
              }}
            >
              {l}
            </span>
            {i < labels.length - 1 && <div style={{ flex: 1, height: 1.5, background: colors.line }} />}
          </div>
        );
      })}
    </div>
  );
}

function Option({
  style,
  choisi,
  press,
  apparition,
  children,
}: {
  style: CSSProperties;
  choisi: boolean;
  press: number;
  apparition: number;
  children: ReactNode;
}) {
  const p = useAppear(apparition, 24);
  return (
    <div
      style={{
        position: "absolute",
        boxSizing: "border-box",
        padding: "18px 26px",
        borderRadius: 24,
        background: colors.card,
        border: `1.5px solid ${choisi ? colors.roseDeep : "rgba(232, 220, 207, 0.9)"}`,
        boxShadow: choisi ? `0 0 0 6px rgba(163, 92, 82, 0.16), ${shadows.soft}` : shadows.card,
        opacity: p,
        transform: `translateY(${(1 - p) * 20}px) scale(${1 - 0.02 * press})`,
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
        top: 126,
        width: 834,
        height: 92,
        boxSizing: "border-box",
        padding: "0 30px",
        borderRadius: 24,
        background: colors.card,
        border: "1.5px solid rgba(232, 220, 207, 0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ fontFamily: fonts.sans, fontSize: 15, letterSpacing: "0.16em", textTransform: "uppercase", color: colors.inkSoft }}>
          Soin choisi
        </div>
        <div style={{ fontFamily: fonts.serif, fontWeight: 500, fontSize: 32, color: colors.ink, lineHeight: 1.15 }}>{s.name}</div>
      </div>
      <div style={{ fontFamily: fonts.sans, fontSize: 21, color: colors.inkSoft }}>
        {s.durationLabel} · {s.price}
      </div>
    </div>
  );
}

function Calendrier({ frame }: { frame: number }) {
  const jours = Array.from({ length: 31 }, (_, i) => i + 1);
  const jourChoisi = frame >= T.clicJour;
  const press = pression(frame, T.clicJour);
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
        border: "1.5px solid rgba(232, 220, 207, 0.9)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          top: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: colors.inkSoft,
        }}
      >
        <ChevronLeft size={26} strokeWidth={1.75} style={{ opacity: 0.35 }} />
        <span style={{ fontFamily: fonts.serif, fontWeight: 500, fontSize: 32, color: colors.ink }}>Décembre</span>
        <ChevronRight size={26} strokeWidth={1.75} />
      </div>
      <div style={{ position: "absolute", left: CAL.pad, top: 78, display: "flex", gap: CAL.gap }}>
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div
            key={d}
            style={{
              width: CAL.cell,
              textAlign: "center",
              fontFamily: fonts.sans,
              fontSize: 14,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: colors.inkSoft,
            }}
          >
            {d}
          </div>
        ))}
      </div>
      {jours.map((d) => {
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
              fontSize: 20,
              fontWeight: dispo ? 500 : 400,
              background: choisi ? colors.roseDeep : dispo ? "rgba(243, 225, 220, 0.75)" : "transparent",
              color: choisi ? "#fff" : dispo ? colors.ink : "rgba(107, 87, 71, 0.38)",
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

function Creneaux({ frame }: { frame: number }) {
  const visible = interpolate(frame, [T.clicJour + 2, T.clicJour + 14], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const choisie = frame >= T.clicHeure;
  const press = pression(frame, T.clicHeure);
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
        border: "1.5px solid rgba(232, 220, 207, 0.9)",
      }}
    >
      {visible < 1 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 36,
            textAlign: "center",
            fontFamily: fonts.sans,
            fontSize: 20,
            lineHeight: 1.55,
            color: colors.inkSoft,
            opacity: 1 - visible,
          }}
        >
          Choisissez un jour en rose dans le calendrier pour voir les horaires disponibles.
        </div>
      )}
      <div style={{ opacity: visible }}>
        <div style={{ position: "absolute", left: 26, top: 22, fontFamily: fonts.serif, fontWeight: 500, fontSize: 30, color: colors.ink }}>
          Mardi 8 décembre
        </div>
        {groupes.map((g) => (
          <div key={g.label}>
            <div
              style={{
                position: "absolute",
                left: 26,
                top: g.y - HEURES.y,
                fontFamily: fonts.sans,
                fontSize: 14,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: colors.inkSoft,
              }}
            >
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
                    fontSize: 20,
                    fontWeight: sel ? 500 : 400,
                    border: `1.5px solid ${sel ? colors.roseDeep : colors.line}`,
                    background: sel ? colors.roseDeep : "#fff",
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

function Confirmation({ progression, frame }: { progression: number; frame: number }) {
  const s = services.find((x) => x.id === SOIN_CHOISI);
  const icone = interpolate(frame, [T.confirmation, T.confirmation + 16], [0.6, 1], { ...clamp, easing: EASE_IN_OUT });
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
        transform: `translateY(${(1 - progression) * 24}px)`,
      }}
    >
      <div style={{ color: colors.sage, transform: `scale(${icone})` }}>
        <MailCheck size={92} strokeWidth={1.5} />
      </div>
      <div style={{ marginTop: 26, fontFamily: fonts.serif, fontWeight: 500, fontSize: 60, color: colors.ink, lineHeight: 1.1 }}>
        Demande envoyée, merci&nbsp;!
      </div>
      <div style={{ marginTop: 20, fontFamily: fonts.sans, fontSize: 23, lineHeight: 1.6, color: colors.inkSoft }}>
        Le créneau est réservé pour vous. Vous allez recevoir un email récapitulatif, puis la confirmation de Béatrice
        très rapidement.
      </div>
      <div
        style={{
          marginTop: 34,
          width: 470,
          boxSizing: "border-box",
          padding: "26px 32px",
          borderRadius: 26,
          background: colors.sand,
          textAlign: "left",
          fontFamily: fonts.sans,
          fontSize: 22,
          color: colors.ink,
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontFamily: fonts.serif, fontWeight: 500, fontSize: 34, lineHeight: 1.2 }}>{s?.name}</div>
        <div style={{ marginTop: 6 }}>Mardi 8 décembre</div>
        <div>à {HEURE_CHOISIE}</div>
      </div>
    </div>
  );
}

function Curseur({ frame }: { frame: number }) {
  const p = positionCurseur(frame);
  const opacite = interpolate(frame, [12, 20, T.clicContinuer + 6, T.clicContinuer + 14], [0, 1, 1, 0], clamp);
  const clics = [T.clicSoin, T.clicJour, T.clicHeure, T.clicContinuer];
  const press = Math.max(...clics.map((c) => pression(frame, c)));
  return (
    <>
      {clics.map((c) => {
        const r = interpolate(frame, [c, c + 16], [0, 1], clamp);
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
              border: `3px solid ${colors.roseDeep}`,
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
          filter: "drop-shadow(0 4px 6px rgba(74, 54, 40, 0.25))",
        }}
      >
        <path
          d="M2.5 1.5 L2.5 18.5 L7 14.2 L10.2 21.2 L13.2 19.9 L10.1 13 L16.4 13 Z"
          fill="#fff"
          stroke={colors.ink}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
}
