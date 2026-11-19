import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { accroche, disciplines, motto, site } from "../script";
import { colors, EASE_IN_OUT, fonts } from "../theme";
import { clamp, Eyebrow, FadeUp, GoldDust, Ornament, SweepReveal, Watercolor, WordsUp } from "../ui";

/** Image où l'accroche s'efface et où la marque apparaît. */
export const MARQUE = 118;

/** Accroche, puis l'accueil du site : « Bienvenue — Les Soins de Béa ». */
export const Ouverture: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const sortie = interpolate(frame, [MARQUE - 16, MARQUE + 4], [1, 0], { ...clamp, easing: EASE_IN_OUT });

  return (
    <AbsoluteFill>
      <Watercolor duration={duration} zoom={[1.12, 1.03]} />
      <GoldDust count={30} seed="ouverture" />

      {/* Accroche */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          opacity: sortie,
          transform: `translateY(${(1 - sortie) * -30}px)`,
        }}
      >
        <FadeUp delay={6} duration={30}>
          <div style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 60, color: colors.inkSoft }}>
            {accroche.intro}
          </div>
        </FadeUp>
        <div
          style={{
            marginTop: 30,
            fontFamily: fonts.serif,
            fontWeight: 500,
            fontSize: 112,
            lineHeight: 1.12,
            color: colors.ink,
          }}
        >
          <WordsUp text={accroche.ligne1} delay={34} stagger={4} />
          <br />
          <span style={{ color: colors.roseDeep, fontStyle: "italic" }}>
            <WordsUp text={accroche.ligne2} delay={54} stagger={4} />
          </span>
        </div>
      </AbsoluteFill>

      {/* Marque */}
      {frame >= MARQUE - 2 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <FadeUp delay={MARQUE} duration={30}>
            <Eyebrow size={68}>Bienvenue</Eyebrow>
          </FadeUp>
          <SweepReveal delay={MARQUE + 8} duration={46}>
            <div
              style={{
                marginTop: 6,
                fontFamily: fonts.serif,
                fontWeight: 500,
                fontSize: 188,
                lineHeight: 1.05,
                color: colors.ink,
              }}
            >
              {site.name}
            </div>
          </SweepReveal>
          <FadeUp delay={MARQUE + 24}>
            <div
              style={{
                marginTop: 40,
                fontFamily: fonts.sans,
                fontWeight: 500,
                fontSize: 25,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: colors.inkSoft,
              }}
            >
              {site.tagline}
            </div>
          </FadeUp>
          <FadeUp delay={MARQUE + 30}>
            <div style={{ marginTop: 18, fontFamily: fonts.sans, fontStyle: "italic", fontSize: 29, color: colors.inkSoft }}>
              {disciplines}
            </div>
          </FadeUp>
          <Ornament delay={MARQUE + 36} lineWidth={96} style={{ marginTop: 46 }} />
          <FadeUp delay={MARQUE + 44} duration={32}>
            <div
              style={{
                marginTop: 46,
                fontFamily: fonts.serif,
                fontStyle: "italic",
                fontSize: 56,
                color: colors.roseDeep,
              }}
            >
              {motto}
            </div>
          </FadeUp>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
