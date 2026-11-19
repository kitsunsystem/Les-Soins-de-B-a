import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { categories, categoryIcons } from "../script";
import { colors, EASE_IN_OUT, fonts, shadows } from "../theme";
import { Card, clamp, FadeUp, SectionHeading } from "../ui";

/** Section « Les 4 univers de soins » de l'accueil, avec un passage sur chaque carte (effet de survol du site). */
export const Univers: React.FC<{ duration: number }> = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: colors.sand, alignItems: "center", justifyContent: "center" }}>
      <SectionHeading eyebrow="Mon offre" title="Les 4 univers de soins" delay={2} />
      <div style={{ marginTop: 72, display: "grid", gridTemplateColumns: "repeat(2, 790px)", gap: 36 }}>
        {categories.map((c, i) => {
          const Icon = categoryIcons[c.icon];
          const start = 62 + i * 13;
          // Survol : monte, puis redescend en laissant la place à la carte suivante.
          const h = interpolate(frame, [start, start + 9, start + 22, start + 32], [0, 1, 1, 0], {
            ...clamp,
            easing: EASE_IN_OUT,
          });
          return (
            <FadeUp key={c.id} delay={20 + i * 6} style={{ display: "flex" }}>
              <Card
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 34,
                  padding: "44px 46px",
                  transform: `translateY(${-10 * h}px)`,
                  boxShadow: h > 0.01 ? shadows.soft : shadows.card,
                }}
              >
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: interpolateColors(h, [0, 1], [colors.roseSoft, colors.roseDeep]),
                    color: interpolateColors(h, [0, 1], [colors.roseDeep, "#ffffff"]),
                  }}
                >
                  <Icon size={40} strokeWidth={1.5} />
                </div>
                <div>
                  <div style={{ fontFamily: fonts.serif, fontWeight: 500, fontSize: 47, lineHeight: 1.1, color: colors.ink }}>
                    {c.name}
                  </div>
                  <div style={{ marginTop: 10, fontFamily: fonts.sans, fontSize: 22, color: colors.inkSoft, whiteSpace: "nowrap" }}>
                    {c.summary}
                  </div>
                  <div
                    style={{
                      marginTop: 18,
                      fontFamily: fonts.sans,
                      fontWeight: 500,
                      fontSize: 23,
                      color: colors.roseDeep,
                    }}
                  >
                    Découvrir →
                  </div>
                </div>
              </Card>
            </FadeUp>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
