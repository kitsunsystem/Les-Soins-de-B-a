import type { LucideIcon } from "lucide-react";
import { Clock, Flame, House, ImageIcon, Phone, Video } from "lucide-react";
import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import type { CategoryId, Service } from "../../../src/lib/content";
import { categories, categoryIcons, services } from "../script";
import { colors, EASE_IN_OUT, EASE_OUT, fonts, FPS, titre, tones } from "../theme";
import { Body, Botanical, Card, CategoryBadge, clamp, Eyebrow, halo, typo } from "../ui";

const ORDRE: CategoryId[] = ["corps", "energetique", "femmes-bebes", "guidance"];
const LARGEUR_GAUCHE = 640;
type Ton = (typeof tones)[CategoryId];

/**
 * Textes adaptés pour la vidéo : la voix off parle de Béatrice à la troisième personne,
 * et on évite toute formulation qui ressemblerait à un effet sur la santé.
 */
const introsVideo: Partial<Record<CategoryId, string>> = {
  corps: "Des soins manuels pour libérer les tensions et reconnecter votre corps à sa sérénité.",
  // Lue en moins de 3 s avant « Magnétiseuse » : une phrase courte.
  energetique: "Le magnétisme, fil conducteur de sa pratique.",
};

/** Descriptions affichées quand l'univers compte peu de soins. */
const descriptionsCourtes: Partial<Record<string, string>> = {
  "massage-energetique": "Libération des blocages énergétiques par l'imposition des mains et le massage.",
  "soin-complet": "L'expérience la plus aboutie : massage viscéral, réflexologie, bien-être et énergétique.",
  "magnetisme-distance": "Accompagnement énergétique à distance, à partir d'une photo récente.",
  "massage-prenatal": "Un moment de détente et de reconnexion, adapté à chaque trimestre.",
  "atelier-massage-bebe": "Béatrice vous transmet les gestes pour masser votre bébé et renforcer le lien.",
  "guidance-complete": "Une heure pour toutes vos questions : tirage d'oracle et de tarot, enrichi des messages reçus en médiumnité.",
  "oracle-tarot": "Amour, travail, famille, choix de vie : un tirage personnalisé selon votre demande.",
  mediumnite: "Guidance, accompagnement autour d'un deuil, questionnement spirituel.",
};

/** Mots des descriptions surlignés quand la voix les prononce (nom du repère). */
const surlignages: Partial<Record<string, { fragment: string; repere: string }[]>> = {
  "magnetisme-distance": [{ fragment: "à partir d'une photo récente", repere: "photo" }],
  "oracle-tarot": [
    { fragment: "Amour", repere: "amour" },
    { fragment: "travail", repere: "travail" },
    { fragment: "choix de vie", repere: "choix-de-vie" },
  ],
  mediumnite: [{ fragment: "accompagnement autour d'un deuil", repere: "deuil" }],
};

/** Repères qui mettent fin à la lecture des soins d'un univers (la voix passe à autre chose). */
const finsDeLecture: Partial<Record<CategoryId, string>> = { energetique: "magnetiseuse", guidance: "seances" };

/** Repère de voix d'un soin : pour Corps & Détente, la voix dit « réflexologie et massages » (deux groupes). */
function repereDuSoin(s: Service, reperes: Record<string, number>) {
  if (s.category === "corps") return s.id.startsWith("reflexologie") ? reperes.reflexologie : reperes.massages;
  return reperes[s.id];
}

/** Hex → rgba, pour les surlignages teintés. */
function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** 0 avant le repère, 1 quand la voix le dit, `reste` une fois passé le repère suivant. */
function allumage(local: number, repere: number | undefined, suivant?: number, reste = 0.45) {
  if (repere === undefined) return 0;
  return interpolate(local, [repere - 3, repere + 5, (suivant ?? 1e9) - 2, (suivant ?? 1e9) + 8], [0, 1, 1, reste], {
    ...clamp,
    easing: EASE_IN_OUT,
  });
}

/**
 * Les quatre univers de la page Soins, enchaînés sans coupure : la barre des univers reste en place,
 * le panneau change au moment où la voix passe à l'univers suivant (`changements`), et chaque soin
 * s'allume quand la voix le nomme (`reperes`, images de la scène). L'énergétique et la guidance ont un
 * second temps : les savoir-faire de magnétiseuse, puis les séances au cabinet ou à distance.
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
  const finLecture = finsDeLecture[id] ? reperes[finsDeLecture[id]] : undefined;
  const reperesListe = [
    ...new Set([...liste.map((s) => repereDuSoin(s, reperes)), finLecture].filter((r): r is number => r !== undefined)),
  ].sort((x, y) => x - y);

  // Second temps du panneau (savoir-faire de magnétiseuse, séances à distance) : il remplace l'intro.
  const second =
    id === "energetique" ? (
      <BlocMagnetiseuse local={local} reperes={reperes} ton={t} />
    ) : id === "guidance" ? (
      <BlocSeances local={local} reperes={reperes} ton={t} />
    ) : null;
  // L'intro s'efface d'abord, puis le second temps entre : jamais deux textes l'un sur l'autre.
  const sortieIntro = finLecture === undefined ? 0 : interpolate(local, [finLecture - 8, finLecture], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const entreeSecond = finLecture === undefined ? 0 : interpolate(local, [finLecture, finLecture + 10], [0, 1], { ...clamp, easing: EASE_OUT });
  // L'encadré « Idéal pour » n'a sa place que si l'intro reste assez longtemps à l'écran pour être lue.
  const avecIdeal = finLecture === undefined || finLecture > 5 * FPS;

  const intro = (
    <div style={{ opacity: 1 - sortieIntro, transform: `translateY(${-18 * sortieIntro}px)` }}>
      <div style={{ opacity: a(7), transform: `translateY(${(1 - a(7)) * 24}px)` }}>
        <Body size={27} style={{ marginTop: 24 }}>
          {introsVideo[id] ?? c.intro}
        </Body>
      </div>
      {avecIdeal && (
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
      )}
    </div>
  );

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
        {/* Les deux temps occupent la même case : la colonne garde sa hauteur quand l'un remplace l'autre. */}
        <div style={{ display: "grid" }}>
          <div style={{ gridArea: "1 / 1" }}>{intro}</div>
          {second && (
            <div style={{ gridArea: "1 / 1", opacity: entreeSecond, transform: `translateY(${18 * (1 - entreeSecond)}px)`, paddingTop: 30 }}>{second}</div>
          )}
        </div>
      </div>

      <div style={{ opacity: a(3, 18), transform: `translateY(${(1 - a(3, 18)) * 36}px)` }}>
        <Card style={{ width: 920, padding: details ? "18px 52px" : "26px 52px" }}>
          {liste.map((s, i) => {
            const repere = repereDuSoin(s, reperes);
            const suivant = repere === undefined ? undefined : reperesListe.find((r) => r > repere);
            // Massages nommés un par un (« relaxant, californien ou ayurvédique ») : petite impulsion.
            const propre = s.category === "corps" ? reperes[s.id] : undefined;
            const accent = propre === undefined ? 0 : interpolate(local, [propre - 3, propre + 4, propre + 16, propre + 26], [0, 1, 1, 0], clamp);
            return (
              <Ligne
                key={s.id}
                service={s}
                details={details}
                derniere={i === liste.length - 1}
                apparition={a(6 + i * (details ? 4 : 2), 14)}
                allume={allumage(local, repere, suivant, 0.4)}
                accent={accent}
                ton={t}
                local={local}
                reperes={reperes}
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
  accent,
  ton,
  local,
  reperes,
}: {
  service: Service;
  details: boolean;
  derniere: boolean;
  apparition: number;
  /** 0 : pas encore nommé ; 1 : la voix le nomme ; 0,4 : déjà nommé. */
  allume: number;
  /** Impulsion quand la voix nomme ce soin précis dans un groupe. */
  accent: number;
  ton: Ton;
  local: number;
  reperes: Record<string, number>;
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
            <div style={{ marginTop: 8, fontFamily: fonts.sans, fontSize: 24, lineHeight: 1.5, color: colors.inkSoft, textWrap: "pretty" }}>
              <TexteSurligne
                texte={descriptionsCourtes[service.id] ?? service.description}
                marques={(surlignages[service.id] ?? []).map((m) => ({ fragment: m.fragment, repere: reperes[m.repere] }))}
                local={local}
                ton={ton}
              />
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
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 25,
          fontWeight: 650,
          color: interpolateColors(accent, [0, 1], [colors.ink, ton.solid]),
          transform: `translateX(${8 * accent}px)`,
        }}
      >
        {service.name}
      </div>
      <span style={{ flex: 1, borderBottom: "2px dotted rgba(86, 101, 93, 0.3)", marginBottom: 7 }} />
      {duree}
      {/* Assez large pour « sur devis » : les durées restent alignées sur toutes les lignes. */}
      <div style={{ minWidth: 150 }}>{prix}</div>
    </div>
  );
}

/** Texte dont certains passages se surlignent (feutre teinté qui glisse, texte qui fonce) quand la voix les prononce. */
function TexteSurligne({ texte, marques, local, ton }: { texte: string; marques: { fragment: string; repere?: number }[]; local: number; ton: Ton }) {
  const t = typo(texte);
  const morceaux: ReactNode[] = [];
  let curseur = 0;
  const places = marques
    .map((m) => ({ ...m, fragment: typo(m.fragment), index: t.indexOf(typo(m.fragment)) }))
    .filter((m) => m.index >= 0)
    .sort((x, y) => x.index - y.index);
  for (const m of places) {
    if (m.index < curseur) continue;
    morceaux.push(t.slice(curseur, m.index));
    const p = m.repere === undefined ? 0 : interpolate(local, [m.repere - 2, m.repere + 9], [0, 1], { ...clamp, easing: EASE_OUT });
    morceaux.push(
      <span
        key={m.index}
        style={{
          color: interpolateColors(p, [0, 1], [colors.inkSoft, colors.ink]),
          backgroundImage: `linear-gradient(${rgba(ton.solid, 0.24)}, ${rgba(ton.solid, 0.24)})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${p * 100}% 100%`,
          borderRadius: 6,
          padding: "1px 3px",
          margin: "0 -3px",
          boxDecorationBreak: "clone",
          WebkitBoxDecorationBreak: "clone",
        }}
      >
        {m.fragment}
      </span>,
    );
    curseur = m.index + m.fragment.length;
  }
  morceaux.push(t.slice(curseur));
  return <>{morceaux}</>;
}

/** Un savoir-faire ou un mode de séance : pastille, titre, précision ; s'allume quand la voix le nomme. */
function Atout({ icon: Icon, titre: nom, texte, on, apparition, ton }: { icon: LucideIcon; titre: string; texte: string; on: number; apparition: number; ton: Ton }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "14px 22px 14px 14px",
        borderRadius: 26,
        background: interpolateColors(on, [0, 1], [colors.card, ton.soft]),
        border: `1.5px solid ${interpolateColors(on, [0, 1], ["rgba(230, 221, 208, 0.85)", rgba(ton.solid, 0.35)])}`,
        boxShadow: on > 0.5 ? `0 18px 40px -26px ${rgba(ton.solid, 0.7)}` : "none",
        opacity: apparition,
        transform: `translateX(${(1 - apparition) * 30}px) scale(${1 + 0.02 * on})`,
        transformOrigin: "left center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: interpolateColors(on, [0.55, 1], [ton.soft, ton.solid]),
          color: interpolateColors(on, [0.55, 1], [ton.text, "#ffffff"]),
        }}
      >
        <Icon size={29} strokeWidth={1.6} />
      </div>
      <div>
        <div style={{ ...titre, fontSize: 31, color: colors.ink }}>{typo(nom)}</div>
        <div style={{ marginTop: 3, fontFamily: fonts.sans, fontSize: 24, lineHeight: 1.35, color: colors.inkSoft }}>{typo(texte)}</div>
      </div>
    </div>
  );
}

/** Arrivée échelonnée des éléments d'un second temps, juste après la bascule (`debut`), avant que la voix les nomme. */
function arrivee(local: number, debut: number, rang: number) {
  return interpolate(local, [debut + 4 + 5 * rang, debut + 18 + 5 * rang], [0, 1], { ...clamp, easing: EASE_OUT });
}

/**
 * « Magnétiseuse, Béatrice enlève aussi le feu, et pratique le magnétisme à distance, sur simple photo. »
 * Les cartes arrivent avec le surtitre, éteintes, et chacune s'allume quand la voix la nomme.
 */
function BlocMagnetiseuse({ local, reperes, ton }: { local: number; reperes: Record<string, number>; ton: Ton }) {
  const feu = reperes.feu;
  const distance = reperes["magnetisme-distance"];
  const debut = reperes.magnetiseuse;
  return (
    <div>
      <Eyebrow size={20} color={ton.text}>
        Magnétiseuse
      </Eyebrow>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <Atout
          icon={Flame}
          titre="Coupe de feu"
          texte="Elle enlève le feu : un savoir traditionnel"
          on={allumage(local, feu, distance, 0.5)}
          apparition={arrivee(local, debut, 0)}
          ton={ton}
        />
        <Atout
          icon={ImageIcon}
          titre="Magnétisme à distance"
          texte="Sur simple photo, sans vous déplacer"
          on={allumage(local, distance)}
          apparition={arrivee(local, debut, 1)}
          ton={ton}
        />
      </div>
      <div style={{ marginTop: 18, fontFamily: fonts.sans, fontSize: 23, lineHeight: 1.45, color: colors.inkSoft, opacity: arrivee(local, debut, 2) }}>
        {typo("Pratiques traditionnelles de bien-être, qui ne remplacent pas un avis médical.")}
      </div>
    </div>
  );
}

/**
 * « Ces séances ont lieu au cabinet, mais aussi à distance, par téléphone ou en visio, où que vous soyez. »
 * Les trois modes arrivent avec le surtitre, éteints ; chacun s'allume quand la voix le nomme.
 */
function BlocSeances({ local, reperes, ton }: { local: number; reperes: Record<string, number>; ton: Ton }) {
  const modes = [
    { icon: House, titre: "Au cabinet", texte: "À Perpignan, sur rendez-vous", repere: reperes.seanceCabinet },
    { icon: Phone, titre: "Par téléphone", texte: "Béatrice vous appelle à l'heure du rendez-vous", repere: reperes.seanceTelephone },
    { icon: Video, titre: "En visio", texte: "Partout en France, depuis chez vous", repere: reperes.seanceVisio },
  ];
  // « Où que vous soyez » : les trois modes s'allument ensemble pour finir, pleinement (pastille pleine, icône blanche).
  const ensemble = reperes.seancePartout;
  const final = interpolate(local, [ensemble - 2, ensemble + 8], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  return (
    <div>
      <Eyebrow size={20} color={ton.text}>
        Au cabinet ou à distance
      </Eyebrow>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {modes.map((m, i) => {
          const suivant = modes[i + 1]?.repere ?? ensemble;
          const lu = allumage(local, m.repere, suivant, 0.5);
          return (
            <Atout
              key={m.titre}
              icon={m.icon}
              titre={m.titre}
              texte={m.texte}
              on={Math.max(lu, final)}
              apparition={arrivee(local, reperes.seances, i)}
              ton={ton}
            />
          );
        })}
      </div>
    </div>
  );
}
