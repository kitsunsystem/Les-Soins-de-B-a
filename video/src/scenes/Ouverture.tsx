import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { accroche, site } from "../script";
import { colors, EASE_IN_OUT, EASE_OUT, fonts, titre } from "../theme";
import { Accent, clamp, FadeUp, FondLin, LogoBadge, Ornament, typo, useAppear, WordsUp } from "../ui";

/** « Stress, » / « tensions, » / « fatigue du quotidien… » : chaque mot apparaît quand la voix le dit. */
const FRAGMENTS_ACCROCHE = ["Stress,", "tensions,", "fatigue du quotidien…"];

/**
 * Accroche, puis la marque. Les repères (images de la scène) viennent de la voix off :
 * « Stress », « tensions », « fatigue », « Et si vous preniez… », « un moment… », « Bienvenue aux Soins de Béa ».
 */
export const Ouverture: React.FC<{
  duration: number;
  stress: number;
  tensions: number;
  fatigue: number;
  question: number;
  moment: number;
  marque: number;
}> = ({ stress, tensions, fatigue, question, moment, marque }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sortie = interpolate(frame, [marque - 16, marque - 4], [1, 0], { ...clamp, easing: EASE_IN_OUT });
  const rameaux = interpolate(frame, [0, 50], [0, 1], { ...clamp, easing: EASE_OUT });

  const pastille = spring({ frame: frame - (marque - 6), fps, config: { damping: 15, stiffness: 140 } });
  const trace = interpolate(frame, [marque - 4, marque + 22], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const nom = useAppear(marque + 2, 30);
  const avance = interpolate(frame, [stress, marque], [1, 1.04], clamp);
  const delais = [stress - 4, tensions - 4, fatigue - 4];
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
            transform: `translateY(${(1 - sortie) * -26}px) scale(${avance})`,
          }}
        >
          <div style={{ display: "flex", gap: 18, ...titre, fontStyle: "italic", fontWeight: 380, fontSize: 64, color: colors.inkSoft }}>
            {FRAGMENTS_ACCROCHE.map((mot, i) => (
              <FadeUp key={mot} delay={delais[i]} duration={16} distance={20}>
                {typo(mot)}
              </FadeUp>
            ))}
          </div>
          <div style={{ ...titre, marginTop: 34, fontSize: 118, color: colors.ink }}>
            <WordsUp text={accroche.ligne1} delay={question - 4} stagger={3} />
            <br />
            <Accent>
              <WordsUp text={accroche.ligne2} delay={moment - 4} stagger={5} duration={12} />
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
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
