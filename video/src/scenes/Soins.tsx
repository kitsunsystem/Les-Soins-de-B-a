import { Clock } from "lucide-react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import type { CategoryId, Service } from "../../../src/lib/content";
import { categories, categoryIcons, services } from "../script";
import { colors, EASE_IN_OUT, EASE_OUT, fonts, titre, tones } from "../theme";
import { Body, Botanical, Card, CategoryBadge, clamp, halo, typo } from "../ui";

const ORDRE: CategoryId[] = ["corps", "energetique", "femmes-bebes", "guidance"];
const LARGEUR_GAUCHE = 640;

/** Descriptions affichées quand l'univers compte peu de soins. */
const descriptionsCourtes: Partial<Record<string, string>> = {
  "massage-energetique": "Libération des blocages énergétiques par l'imposition des mains et le massage.",
  "soin-complet": "L'expérience la plus aboutie : massage viscéral, réflexologie, bien-être et énergétique.",
  "magnetisme-distance": "Accompagnement énergétique à distance, à partir d'une photo récente.",
  "massage-prenatal": "Un moment de détente et de reconnexion, adapté à chaque trimestre.",
  "atelier-massage-bebe": "Je vous transmets les gestes pour masser votre bébé et renforcer le lien.",
  "oracle-tarot": "Amour, travail, famille, choix de vie : un tirage personnalisé selon votre demande.",
  mediumnite: "Guidance, accompagnement autour d'un deuil, questionnement spirituel.",
};

/**
 * Les quatre univers de la page Soins, enchaînés sans coupure : la barre des univers reste en place
 * et le panneau change au moment où la voix passe à l'univers suivant (`changements`, images de la scène).
 */
export const Soins: React.FC<{ duration: number; changements: [number, number, number] }> = ({ changements }) => {
  const frame = useCurrentFrame();
  const debuts = [0, ...changements];

  return (
    <AbsoluteFill style={{ background: colors.linen, overflow: "hidden" }}>
      {/* Halo de la couleur de l'univers en cours, qui change en douceur. */}
      {ORDRE.map((id, i) => {
        const op = interpolate(frame, [debuts[i] - 6, debuts[i] + 10, (debuts[i + 1] ?? 1e9) - 6, (debuts[i + 1] ?? 1e9) + 10], [0, 1, 1, 0], clamp);
        if (op <= 0) return null;
        return (
          <div key={id} style={{ position: "absolute", inset: 0, opacity: op }}>
            <div style={{ position: "absolute", left: -620, top: -380, width: 1700, height: 1700, background: halo(tones[id].rgbSoft, 0.95) }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", right: -480, bottom: -700, width: 1400, height: 1400, background: halo("245, 225, 212", 0.6) }} />
      <Botanical height={360} opacity={0.14} style={{ right: 30, top: 150 }} />

      <BarreUnivers frame={frame} debuts={debuts} />

      {ORDRE.map((id, i) => {
        const debut = debuts[i];
        const fin = debuts[i + 1];
        const entree = i === 0 ? 1 : interpolate(frame, [debut + 1, debut + 13], [0, 1], { ...clamp, easing: EASE_OUT });
        const sortie = fin === undefined ? 1 : interpolate(frame, [fin - 9, fin + 1], [1, 0], { ...clamp, easing: EASE_IN_OUT });
        const visible = Math.min(entree, sortie);
        if (visible <= 0) return null;
        const dx = (1 - entree) * 70 - (1 - sortie) * 70;
        return (
          <AbsoluteFill key={id} style={{ opacity: visible, transform: `translateX(${dx}px)` }}>
            <Panneau id={id} local={frame - debut} />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

function BarreUnivers({ frame, debuts }: { frame: number; debuts: number[] }) {
  const apparition = interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: EASE_OUT });
  return (
    <div
      style={{
        position: "absolute",
        top: 58,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        gap: 16,
        opacity: apparition,
        transform: `translateY(${(1 - apparition) * -20}px)`,
      }}
    >
      {categories.map((c, i) => {
        const t = tones[c.id];
        const Icon = categoryIcons[c.icon];
        const on = interpolate(frame, [debuts[i] - 4, debuts[i] + 6, (debuts[i + 1] ?? 1e9) - 4, (debuts[i + 1] ?? 1e9) + 6], [0, 1, 1, 0], clamp);
        return (
          <div
            key={c.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "13px 26px",
              borderRadius: 999,
              fontFamily: fonts.sans,
              fontSize: 22,
              fontWeight: 650,
              background: interpolateColors(on, [0, 1], [t.soft, t.solid]),
              color: interpolateColors(on, [0, 1], [t.text, "#ffffff"]),
              transform: `scale(${1 + 0.05 * on})`,
              boxShadow: on > 0.5 ? "0 12px 30px -16px rgba(38, 53, 46, 0.45)" : "none",
            }}
          >
            <Icon size={23} strokeWidth={1.7} />
            {c.name}
          </div>
        );
      })}
    </div>
  );
}

function Panneau({ id, local }: { id: CategoryId; local: number }) {
  const c = categories.find((x) => x.id === id);
  if (!c) return null;
  const t = tones[id];
  const liste = services.filter((s) => s.category === id);
  const details = liste.length <= 3;
  const lignes = c.name.split(" & ").map((l, i) => (i > 0 ? `& ${l}` : l));
  const plusLongue = Math.max(...lignes.map((l) => l.length));
  const taille = Math.min(92, Math.floor(LARGEUR_GAUCHE / (plusLongue * 0.47)));
  const a = (d: number, dur = 16) => interpolate(local - d, [0, dur], [0, 1], { ...clamp, easing: EASE_OUT });

  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 90, paddingTop: 110 }}>
      <div style={{ width: LARGEUR_GAUCHE }}>
        <div style={{ opacity: a(2), transform: `translateY(${(1 - a(2)) * 24}px)` }}>
          <CategoryBadge category={c} icon={categoryIcons[c.icon]} size={104} surface={colors.card} />
        </div>
        <div style={{ ...titre, marginTop: 28, fontSize: taille, color: colors.ink, opacity: a(4), transform: `translateY(${(1 - a(4)) * 24}px)` }}>
          {lignes.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
        <div style={{ opacity: a(7), transform: `translateY(${(1 - a(7)) * 24}px)` }}>
          <Body size={27} style={{ marginTop: 24 }}>
            {c.intro}
          </Body>
        </div>
        <div
          style={{
            marginTop: 30,
            padding: "20px 28px",
            borderRadius: 26,
            background: colors.card,
            border: `1.5px solid ${t.soft}`,
            fontFamily: fonts.sans,
            fontSize: 23,
            lineHeight: 1.5,
            color: colors.inkSoft,
            opacity: a(10),
            transform: `translateY(${(1 - a(10)) * 24}px)`,
          }}
        >
          <span style={{ fontWeight: 750, color: t.text }}>Idéal pour :</span> {typo(c.idealFor)}.
        </div>
      </div>

      <div style={{ opacity: a(3, 18), transform: `translateY(${(1 - a(3, 18)) * 36}px)` }}>
        <Card style={{ width: 920, padding: details ? "18px 52px" : "26px 52px" }}>
          {liste.map((s, i) => (
            <Ligne key={s.id} service={s} details={details} apparition={a(6 + i * (details ? 4 : 2), 14)} />
          ))}
        </Card>
      </div>
    </AbsoluteFill>
  );
}

function Ligne({ service, details, apparition }: { service: Service; details: boolean; apparition: number }) {
  const duree = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", fontFamily: fonts.sans, fontSize: 21, color: colors.inkSoft }}>
      <Clock size={20} strokeWidth={1.75} />
      {service.durationLabel}
    </div>
  );
  const prix = (
    <div style={{ ...titre, textAlign: "right", whiteSpace: "nowrap", fontSize: details ? 42 : 34, color: colors.clay }}>{service.price}</div>
  );

  // Peu de soins : présentation des cartes de la page Soins (nom, description, prix et durée à droite).
  if (details) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 30,
          padding: "26px 0",
          borderBottom: "1.5px solid rgba(230, 221, 208, 0.8)",
          opacity: apparition,
          transform: `translateY(${(1 - apparition) * 16}px)`,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ ...titre, fontSize: 36, color: colors.ink }}>{service.name}</div>
          <div style={{ marginTop: 8, fontFamily: fonts.sans, fontSize: 21, lineHeight: 1.5, color: colors.inkSoft }}>
            {typo(descriptionsCourtes[service.id] ?? service.description)}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          {prix}
          <div style={{ padding: "6px 14px", borderRadius: 999, background: colors.sand }}>{duree}</div>
        </div>
      </div>
    );
  }

  // Beaucoup de soins : lignes « soin ····· durée prix » de l'accueil.
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 20,
        padding: "11px 0",
        opacity: apparition,
        transform: `translateY(${(1 - apparition) * 16}px)`,
      }}
    >
      <div style={{ fontFamily: fonts.sans, fontSize: 25, fontWeight: 650, color: colors.ink }}>{service.name}</div>
      <span style={{ flex: 1, borderBottom: "2px dotted rgba(86, 101, 93, 0.3)", marginBottom: 7 }} />
      {duree}
      <div style={{ minWidth: 120 }}>{prix}</div>
    </div>
  );
}
