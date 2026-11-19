import { Clock } from "lucide-react";
import { AbsoluteFill } from "remotion";
import type { CategoryId, Service } from "../../../src/lib/content";
import { avecDescriptions, categories, categoryIcons, descriptionsCourtes, services } from "../script";
import { colors, fonts } from "../theme";
import { Body, Card, FadeUp, IconBadge, Ornament, Pill, Title, typo, Watercolor } from "../ui";

const LARGEUR_GAUCHE = 620;

/**
 * Coupe « Corps & Détente » en « Corps / & Détente » et choisit une taille de titre qui tient dans la colonne :
 * une ligne trop longue (« Guidance spirituelle ») passe sur deux lignes plutôt que de rétrécir.
 */
function titre(nom: string) {
  const lignes = nom.split(" & ").map((l, i) => (i > 0 ? `& ${l}` : l));
  const largeur = (n: number) => Math.floor(LARGEUR_GAUCHE / (n * 0.46));
  const tailles = lignes.map((l) => {
    const surUneLigne = largeur(l.length);
    if (surUneLigne >= 76) return Math.min(96, surUneLigne);
    return Math.min(96, largeur(Math.max(...l.split(" ").map((m) => m.length))));
  });
  return { lignes, taille: Math.min(...tailles) };
}

/**
 * Un univers de soins : la barre des univers de la page Soins, l'en-tête de l'univers
 * et la carte des tarifs (même présentation que la page Tarifs du site).
 */
export const Categorie: React.FC<{ id: CategoryId; duration: number; fond: "creme" | "sable" }> = ({
  id,
  duration,
  fond,
}) => {
  const categorie = categories.find((c) => c.id === id);
  if (!categorie) throw new Error(`Univers inconnu : ${id}`);
  const liste = services.filter((s) => s.category === id);
  const details = avecDescriptions.includes(id);
  const Icon = categoryIcons[categorie.icon];
  const { lignes, taille } = titre(categorie.name);

  return (
    <AbsoluteFill style={{ background: fond === "sable" ? colors.sand : colors.cream }}>
      {fond === "creme" && <Watercolor duration={duration} variant="page" zoom={[1.0, 1.06]} />}

      <div style={{ position: "absolute", top: 54, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 16 }}>
        {categories.map((c, i) => (
          <FadeUp key={c.id} delay={i * 2} distance={12}>
            <Pill icon={categoryIcons[c.icon]} active={c.id === id} size={21}>
              {c.name}
            </Pill>
          </FadeUp>
        ))}
      </div>

      <AbsoluteFill
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 90, paddingTop: 96 }}
      >
        <div style={{ width: LARGEUR_GAUCHE }}>
          <FadeUp delay={6}>
            <IconBadge icon={Icon} size={108} />
          </FadeUp>
          <FadeUp delay={12}>
            <Title size={taille} style={{ marginTop: 30 }}>
              {lignes.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </Title>
          </FadeUp>
          <Ornament delay={20} align="left" lineWidth={64} style={{ marginTop: 32 }} />
          <FadeUp delay={26}>
            <Body size={29} style={{ marginTop: 30 }}>
              {categorie.intro}
            </Body>
          </FadeUp>
        </div>

        <FadeUp delay={14} distance={44}>
          <Card style={{ width: 960, padding: details ? "16px 56px" : "22px 56px" }}>
            {liste.map((s, i) => (
              <Ligne
                key={s.id}
                service={s}
                details={details}
                delay={24 + i * (details ? 7 : 3)}
                derniere={i === liste.length - 1}
              />
            ))}
          </Card>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

function Duree({ service }: { service: Service }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 9,
        whiteSpace: "nowrap",
        fontFamily: fonts.sans,
        fontSize: 22,
        color: colors.inkSoft,
      }}
    >
      <Clock size={21} strokeWidth={1.75} />
      {service.durationLabel}
    </div>
  );
}

function Ligne({
  service,
  details,
  delay,
  derniere,
}: {
  service: Service;
  details: boolean;
  delay: number;
  derniere: boolean;
}) {
  const separateur = derniere ? "none" : "1.5px solid rgba(232, 220, 207, 0.8)";

  // Peu de soins : présentation des cartes de la page Soins (nom, description, durée au-dessus du prix).
  if (details) {
    return (
      <FadeUp delay={delay} distance={18}>
        <div style={{ display: "flex", alignItems: "center", gap: 40, padding: "30px 0", borderBottom: separateur }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: fonts.serif, fontWeight: 500, fontSize: 38, lineHeight: 1.15, color: colors.ink }}>
              {service.name}
            </div>
            <div
              style={{
                marginTop: 8,
                fontFamily: fonts.sans,
                fontSize: 21,
                lineHeight: 1.55,
                color: colors.inkSoft,
                textWrap: "pretty",
              }}
            >
              {typo(descriptionsCourtes[service.id] ?? service.description)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <Duree service={service} />
            <div
              style={{
                marginTop: 4,
                whiteSpace: "nowrap",
                fontFamily: fonts.serif,
                fontSize: 44,
                lineHeight: 1.15,
                color: colors.roseDeep,
              }}
            >
              {service.price}
            </div>
          </div>
        </div>
      </FadeUp>
    );
  }

  // Beaucoup de soins : présentation en tableau de la page Tarifs.
  return (
    <FadeUp delay={delay} distance={18}>
      <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "14px 0", borderBottom: separateur }}>
        <div style={{ flex: 1, fontFamily: fonts.sans, fontSize: 25, lineHeight: 1.5, color: colors.ink }}>{service.name}</div>
        <Duree service={service} />
        <div
          style={{
            minWidth: 128,
            textAlign: "right",
            whiteSpace: "nowrap",
            fontFamily: fonts.serif,
            fontSize: 36,
            lineHeight: 1.2,
            color: colors.roseDeep,
          }}
        >
          {service.price}
        </div>
      </div>
    </FadeUp>
  );
}
