import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { categories, categoryIcons } from "../script";
import { colors, fonts, titre, tones } from "../theme";
import { Accent, Card, CategoryBadge, FondLin, SectionHeading, typo } from "../ui";

/** « Quatre univers de soins, une même attention » : les quatre cartes colorées de l'accueil. */
export const Univers: React.FC<{ duration: number }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <FondLin rameaux={false} intensite={0.8} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <SectionHeading
          eyebrow="Mon offre"
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
                <Card style={{ width: 400, overflow: "hidden" }}>
                  <div style={{ background: t.soft, padding: "34px 34px 30px", minHeight: 262, boxSizing: "border-box" }}>
                    <CategoryBadge category={c} icon={categoryIcons[c.icon]} size={80} surface={colors.card} />
                    <div style={{ ...titre, marginTop: 22, fontSize: 40, color: colors.ink }}>{c.name}</div>
                  </div>
                  <div style={{ padding: "22px 34px", fontFamily: fonts.sans, fontSize: 21, lineHeight: 1.5, color: colors.inkSoft }}>
                    <span style={{ fontWeight: 750, color: t.text }}>Idéal pour</span> {typo(c.idealFor)}.
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
