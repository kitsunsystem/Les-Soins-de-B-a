import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { accroche, devise, site } from "../script";
import { colors, EASE_IN_OUT, EASE_OUT, fonts, titre } from "../theme";
import { Accent, clamp, FadeUp, FondLin, LogoBadge, Ornament, typo, useAppear, WordsUp } from "../ui";

/**
 * Accroche, puis la marque. Les repères (images de la scène) viennent de la voix off :
 * « Stress… », « Et si vous preniez… », « Bienvenue aux Soins de Béa ».
 */
export const Ouverture: React.FC<{ duration: number; stress: number; question: number; marque: number }> = ({
  stress,
  question,
  marque,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sortie = interpolate(frame, [marque - 16, marque - 4], [1, 0], { ...clamp, easing: EASE_IN_OUT });
  const rameaux = interpolate(frame, [0, 50], [0, 1], { ...clamp, easing: EASE_OUT });

  const pastille = spring({ frame: frame - (marque - 6), fps, config: { damping: 15, stiffness: 140 } });
  const trace = interpolate(frame, [marque - 4, marque + 22], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const nom = useAppear(marque + 2, 30);
  const masque = `linear-gradient(90deg, #000 ${-25 + nom * 150 - 25}%, transparent ${-25 + nom * 150}%)`;

  return (
    <AbsoluteFill>
      <FondLin trace={rameaux} />

      {frame < marque && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            opacity: sortie,
            transform: `translateY(${(1 - sortie) * -26}px)`,
          }}
        >
          <FadeUp delay={stress - 4} duration={22}>
            <div
              style={{
                ...titre,
                fontStyle: "italic",
                fontWeight: 380,
                fontSize: 64,
                color: colors.inkSoft,
              }}
            >
              {typo(accroche.intro)}
            </div>
          </FadeUp>
          <div style={{ ...titre, marginTop: 34, fontSize: 118, color: colors.ink }}>
            <WordsUp text={accroche.ligne1} delay={question - 4} stagger={3} />
            <br />
            <Accent>
              <WordsUp text={accroche.ligne2} delay={question + 11} stagger={3} />
            </Accent>
          </div>
        </AbsoluteFill>
      )}

      {frame >= marque - 8 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <div style={{ transform: `scale(${pastille})`, opacity: Math.min(1, pastille * 1.4) }}>
            <LogoBadge size={150} trace={trace} />
          </div>
          <div
            style={{
              ...titre,
              marginTop: 34,
              fontSize: 168,
              lineHeight: 1.05,
              color: colors.ink,
              WebkitMaskImage: masque,
              maskImage: masque,
              transform: `translateY(${(1 - nom) * 20}px)`,
            }}
          >
            {site.name}
          </div>
          <FadeUp delay={marque + 10} distance={14}>
            <div
              style={{
                marginTop: 26,
                fontFamily: fonts.sans,
                fontSize: 27,
                fontWeight: 750,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: colors.clay,
              }}
            >
              Bien-être · {site.city}
            </div>
          </FadeUp>
          <Ornament delay={marque + 14} style={{ marginTop: 40 }} />
          <FadeUp delay={marque + 20} duration={22}>
            <div style={{ ...titre, marginTop: 38, fontStyle: "italic", fontWeight: 380, fontSize: 52, color: colors.forest }}>
              {typo(devise)}
            </div>
          </FadeUp>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
