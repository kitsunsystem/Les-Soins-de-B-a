import { Clock } from "lucide-react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import type { CategoryId, Service } from "../../../src/lib/content";
import { categories, categoryIcons, services } from "../script";
import { colors, EASE_IN_OUT, EASE_OUT, fonts, titre, tones } from "../theme";
import { Body, Botanical, Card, CategoryBadge, clamp, halo, typo } from "../ui";

const ORDRE: CategoryId[] = ["corps", "energetique", "femmes-bebes", "guidance"];
const LARGEUR_GAUCHE = 640;

/**
 * Textes adaptés pour la vidéo : la voix off parle de Béatrice à la troisième personne,
 * et on évite toute formulation qui ressemblerait à un effet sur la santé.
 */
const introsVideo: Partial<Record<CategoryId, string>> = {
  corps: "Des soins manuels pour libérer les tensions et reconnecter votre corps à sa sérénité.",
  energetique:
    "Le magnétisme est le fil conducteur de sa pratique : Béatrice l'intègre à chacun de ses soins, et peut aussi le proposer de manière ciblée.",
};

/** Descriptions affichées quand l'univers compte peu de soins. */
const descriptionsCourtes: Partial<Record<string, string>> = {
  "massage-energetique": "Libération des blocages énergétiques par l'imposition des mains et le massage.",
  "soin-complet": "L'expérience la plus aboutie : massage viscéral, réflexologie, bien-être et énergétique.",
  "magnetisme-distance": "Accompagnement énergétique à distance, à partir d'une photo récente.",
  "massage-prenatal": "Un moment de détente et de reconnexion, adapté à chaque trimestre.",
  "atelier-massage-bebe": "Béatrice vous transmet les gestes pour masser votre bébé et renforcer le lien.",
  "oracle-tarot": "Amour, travail, famille, choix de vie : un tirage personnalisé selon votre demande.",
  mediumnite: "Guidance, accompagnement autour d'un deuil, questionnement spirituel.",
};

/** Repère de voix d'un soin : pour Corps & Détente, la voix dit « réflexologie et massages » (deux groupes). */
function repereDuSoin(s: Service, reperes: Record<string, number>) {
  if (s.category === "corps") return s.id.startsWith("reflexologie") ? reperes.reflexologie : reperes.massages;
  return reperes[s.id];
}

/**
 * Les quatre univers de la page Soins, enchaînés sans coupure : la barre des univers reste en place,
 * le panneau change au moment où la voix passe à l'univers suivant (`changements`), et chaque soin
 * s'allume quand la voix le nomme (`reperes`, images de la scène).
 */
export const Soins: React.FC<{ duration: number; changements: [number, number, number]; reperes: Record<string, number> }> = ({
  duration,
  changements,
  reperes,
}) => {
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
            <div style={{ position: "absolute", left: -620, top: -380, width: 1700, height: 1700, background: halo(tones[id].rgbSoft, 1) }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", right: -480, bottom: -700, width: 1400, height: 1400, background: halo("245, 228, 217", 0.6) }} />
      <Botanical height={210} opacity={0.16} style={{ right: 36, top: -8 }} />

      <BarreUnivers frame={frame} debuts={debuts} />

      {ORDRE.map((id, i) => {
        const debut = debuts[i];
        const fin = debuts[i + 1];
        const entree = i === 0 ? 1 : interpolate(frame, [debut + 1, debut + 13], [0, 1], { ...clamp, easing: EASE_OUT });
        const sortie = fin === undefined ? 1 : interpolate(frame, [fin - 9, fin + 1], [1, 0], { ...clamp, easing: EASE_IN_OUT });
        const visible = Math.min(entree, sortie);
        if (visible <= 0) return null;
        const dx = (1 - entree) * 70 - (1 - sortie) * 70;
        // Lente poussée propre à chaque univers.
        const zoom = interpolate(frame, [debut, fin ?? duration], [1, 1.025], clamp);
        return (
          <AbsoluteFill key={id} style={{ opacity: visible, transform: `translateX(${dx}px) scale(${zoom})` }}>
            <Panneau id={id} local={frame - debut} reperes={Object.fromEntries(Object.entries(reperes).map(([k, v]) => [k, v - debut]))} />
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

/** Coupe le nom d'un univers en lignes (« Corps / & Détente », « Guidance / spirituelle »). */
function lignesDuTitre(nom: string) {
  if (nom.includes(" & ")) return nom.split(" & ").map((l, i) => (i > 0 ? `& ${l}` : l));
  return nom.length > 14 ? nom.split(" ") : [nom];
}

function Panneau({ id, local, reperes }: { id: CategoryId; local: number; reperes: Record<string, number> }) {
  const c = categories.find((x) => x.id === id);
  if (!c) return null;
  const t = tones[id];
  const liste = services.filter((s) => s.category === id);
  const details = liste.length <= 3;
  const lignes = lignesDuTitre(c.name);
  const plusLongue = Math.max(...lignes.map((l) => l.length));
  // Fraunces fait environ 0,53 em par caractère à cette graisse : chaque ligne tient sans retour.
  const taille = Math.min(92, Math.floor(LARGEUR_GAUCHE / (plusLongue * 0.53)));
  const a = (d: number, dur = 16) => interpolate(local - d, [0, dur], [0, 1], { ...clamp, easing: EASE_OUT });

  // Ordre de lecture des soins (ou des groupes) pour savoir quand une ligne cesse d'être celle qu'on lit.
  const reperesListe = [...new Set(liste.map((s) => repereDuSoin(s, reperes)).filter((r): r is number => r !== undefined))].sort((x, y) => x - y);

  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 90, paddingTop: 110 }}>
      <div style={{ width: LARGEUR_GAUCHE }}>
        <div style={{ opacity: a(2), transform: `translateY(${(1 - a(2)) * 24}px)` }}>
          <CategoryBadge category={c} icon={categoryIcons[c.icon]} size={104} surface={colors.card} />
        </div>
        <div style={{ ...titre, marginTop: 28, fontSize: taille, color: colors.ink, opacity: a(4), transform: `translateY(${(1 - a(4)) * 24}px)` }}>
          {lignes.map((l) => (
            <div key={l} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
        <div style={{ opacity: a(7), transform: `translateY(${(1 - a(7)) * 24}px)` }}>
          <Body size={27} style={{ marginTop: 24 }}>
            {introsVideo[id] ?? c.intro}
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
          {liste.map((s, i) => {
            const repere = repereDuSoin(s, reperes);
            const suivant = repere === undefined ? undefined : reperesListe.find((r) => r > repere);
            const allume =
              repere === undefined
                ? 0
                : interpolate(local, [repere - 3, repere + 5, (suivant ?? 1e9) - 2, (suivant ?? 1e9) + 8], [0, 1, 1, 0.4], {
                    ...clamp,
                    easing: EASE_IN_OUT,
                  });
            return (
              <Ligne
                key={s.id}
                service={s}
                details={details}
                derniere={i === liste.length - 1}
                apparition={a(6 + i * (details ? 4 : 2), 14)}
                allume={allume}
                ton={t}
              />
            );
          })}
        </Card>
      </div>
    </AbsoluteFill>
  );
}

function Ligne({
  service,
  details,
  derniere,
  apparition,
  allume,
  ton,
}: {
  service: Service;
  details: boolean;
  derniere: boolean;
  apparition: number;
  /** 0 : pas encore nommé ; 1 : la voix le nomme ; 0,4 : déjà nommé. */
  allume: number;
  ton: (typeof tones)[CategoryId];
}) {
  const duree = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", fontFamily: fonts.sans, fontSize: 21, color: colors.inkSoft }}>
      <Clock size={20} strokeWidth={1.75} />
      {service.durationLabel}
    </div>
  );
  const prix = (
    <div style={{ ...titre, textAlign: "right", whiteSpace: "nowrap", fontSize: details ? 42 : 34, color: colors.clay }}>{service.price}</div>
  );
  // Mise en avant : fond teinté de l'univers et liseré à gauche, sur toute la largeur de la carte.
  const surlignage = {
    margin: details ? "0 -26px" : "0 -22px",
    padding: details ? "26px 26px" : "11px 22px",
    borderRadius: 18,
    background: interpolateColors(allume, [0, 1], ["rgba(255, 253, 249, 0)", ton.soft]),
    boxShadow: allume > 0.01 ? `inset ${Math.round(5 * allume)}px 0 0 ${ton.solid}` : "none",
    opacity: apparition,
    transform: `translateY(${(1 - apparition) * 16}px)`,
  };

  // Peu de soins : présentation des cartes de la page Soins (nom, description, prix et durée à droite).
  if (details) {
    return (
      <div style={{ borderBottom: derniere ? "none" : "1.5px solid rgba(230, 221, 208, 0.8)", padding: "4px 0" }}>
        <div style={{ ...surlignage, display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...titre, fontSize: 36, color: colors.ink, textWrap: "balance" }}>{service.name}</div>
            <div style={{ marginTop: 8, fontFamily: fonts.sans, fontSize: 21, lineHeight: 1.5, color: colors.inkSoft, textWrap: "pretty" }}>
              {typo(descriptionsCourtes[service.id] ?? service.description)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            {prix}
            <div style={{ padding: "6px 14px", borderRadius: 999, background: colors.sand }}>{duree}</div>
          </div>
        </div>
      </div>
    );
  }

  // Beaucoup de soins : lignes « soin ····· durée prix » de l'accueil.
  return (
    <div style={{ ...surlignage, display: "flex", alignItems: "baseline", gap: 20 }}>
      <div style={{ fontFamily: fonts.sans, fontSize: 25, fontWeight: 650, color: colors.ink }}>{service.name}</div>
      <span style={{ flex: 1, borderBottom: "2px dotted rgba(86, 101, 93, 0.3)", marginBottom: 7 }} />
      {duree}
      <div style={{ minWidth: 120 }}>{prix}</div>
    </div>
  );
}
