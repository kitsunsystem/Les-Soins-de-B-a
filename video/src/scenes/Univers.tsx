import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { categories, categoryIcons } from "../script";
import { colors, titre, tones } from "../theme";
import { Accent, Card, CategoryBadge, FondLin, SectionHeading } from "../ui";

/** « Corps / & Détente », « Femmes enceintes / & Bébés », « Guidance / spirituelle ». */
function lignesDuNom(nom: string) {
  if (nom.includes(" & ")) return nom.split(" & ").map((l, i) => (i > 0 ? `& ${l}` : l));
  return nom.length > 14 ? nom.split(" ") : [nom];
}

/** « Quatre univers de soins, une même attention » : les quatre cartes colorées de l'accueil. */
export const Univers: React.FC<{ duration: number }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <FondLin rameaux={false} intensite={0.8} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <SectionHeading
          eyebrow="Les soins"
          title={
            <>
              Quatre univers de soins, <Accent>une même attention</Accent>
            </>
          }
          titleSize={80}
        />
        <div style={{ marginTop: 64, display: "flex", gap: 30 }}>
          {categories.map((c, i) => {
            const t = tones[c.id];
            const s = spring({ frame: frame - (6 + i * 3), fps, config: { damping: 16, stiffness: 150 } });
            return (
              <div key={c.id} style={{ display: "flex", opacity: Math.min(1, s * 1.3), transform: `translateY(${(1 - s) * 50}px)` }}>
                <Card style={{ width: 400, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ flex: 1, background: t.soft, padding: "38px 36px 40px" }}>
                    <CategoryBadge category={c} icon={categoryIcons[c.icon]} size={84} surface={colors.card} />
                    <div style={{ ...titre, marginTop: 24, fontSize: 38, color: colors.ink }}>
                      {lignesDuNom(c.name).map((l) => (
                        <div key={l} style={{ whiteSpace: "nowrap" }}>
                          {l}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
