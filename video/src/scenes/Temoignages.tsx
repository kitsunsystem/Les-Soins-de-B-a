import { Quote } from "lucide-react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { temoignages } from "../script";
import { colors, EASE_IN_OUT, fonts, shadows, titre } from "../theme";
import { Accent, Body, Card, clamp, FadeUp, FondLin, SectionHeading, Stars, typo } from "../ui";

/**
 * Section « Livre d'or » de l'accueil. Quand la voix lit la phrase de Léa (`citation`, image de la scène),
 * sa carte s'avance et les deux autres s'effacent un peu.
 */
export const Temoignages: React.FC<{ duration: number; citation: number; auteur: string }> = ({ citation, auteur }) => {
  const frame = useCurrentFrame();
  const focus = interpolate(frame, [citation - 8, citation + 6], [0, 1], { ...clamp, easing: EASE_IN_OUT });

  return (
    <AbsoluteFill>
      <FondLin rameaux={false} sable intensite={0.6} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <SectionHeading
          eyebrow="Livre d'or"
          title={
            <>
              Elles en parlent <Accent>mieux que moi</Accent>
            </>
          }
          titleSize={80}
        />
        <FadeUp delay={6} distance={12}>
          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 16 }}>
            <Stars size={26} delay={8} />
            <Body size={24}>Des mots écrits à la main dans mon livre d’or, après leur séance.</Body>
          </div>
        </FadeUp>
        <div style={{ marginTop: 52, display: "flex", alignItems: "stretch", gap: 34 }}>
          {temoignages.map((t, i) => {
            const vedette = t.name === auteur;
            return (
              <FadeUp key={t.name} delay={8 + i * 3} style={{ display: "flex" }}>
                <div
                  style={{
                    display: "flex",
                    opacity: vedette ? 1 : 1 - 0.45 * focus,
                    transform: vedette ? `translateY(${-16 * focus}px) scale(${1 + 0.04 * focus})` : `scale(${1 - 0.02 * focus})`,
                  }}
                >
                  <Card
                    style={{
                      position: "relative",
                      width: 520,
                      padding: "42px 44px 34px",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: vedette && focus > 0.3 ? shadows.soft : undefined,
                    }}
                  >
                    <div style={{ position: "absolute", right: 38, top: 34, color: colors.sageSoft }}>
                      <Quote size={48} strokeWidth={1.6} />
                    </div>
                    <Stars size={26} delay={12 + i * 3} />
                    <div style={{ ...titre, marginTop: 22, flex: 1, fontStyle: "italic", fontWeight: 400, fontSize: 30, lineHeight: 1.5, letterSpacing: 0, color: colors.ink }}>
                      {typo(t.text)}
                    </div>
                    <div style={{ marginTop: 26, paddingTop: 22, borderTop: `1.5px solid ${colors.line}`, display: "flex", alignItems: "center", gap: 16 }}>
                      <div
                        style={{
                          ...titre,
                          width: 54,
                          height: 54,
                          borderRadius: "50%",
                          background: colors.claySoft,
                          color: colors.clayDark,
                          fontSize: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {t.name.charAt(0)}
                      </div>
                      <div style={{ fontFamily: fonts.sans, fontSize: 25, fontWeight: 750, color: colors.ink }}>{t.name}</div>
                    </div>
                  </Card>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
