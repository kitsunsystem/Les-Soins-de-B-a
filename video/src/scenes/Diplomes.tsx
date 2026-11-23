import { GraduationCap } from "lucide-react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { diplomes } from "../assets";
import { certificats } from "../script";
import { colors, EASE_IN_OUT, fonts, shadows } from "../theme";
import { Accent, clamp, Eyebrow, FadeUp, FondLin, Title } from "../ui";

const LARGEUR = 410;
/** Légère inclinaison de chaque feuille, comme posée à la main. */
const INCLINAISONS = [-1.6, 1.1, -0.9, 1.3, -1.2, 0.8];
/** Image (de la scène) où chaque certificat commence à se poser. */
const arrivee = (i: number) => 8 + 5 * i;

/**
 * Les certificats de Béatrice, pendant un court silence de la voix après sa présentation : les six feuilles se posent
 * l'une après l'autre (le magnétisme d'abord), un reflet de lumière passe sur chacune, puis l'ensemble reste à l'écran.
 */
export const Diplomes: React.FC<{ duration: number }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <FondLin rameaux={false} sable intensite={0.7} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <FadeUp delay={0} distance={14}>
          <Eyebrow>Son parcours</Eyebrow>
        </FadeUp>
        <FadeUp delay={2}>
          <Title size={72} style={{ marginTop: 14, textAlign: "center" }}>
            Formée et <Accent>certifiée</Accent>
          </Title>
        </FadeUp>

        <div style={{ marginTop: 38, display: "grid", gridTemplateColumns: `repeat(3, ${LARGEUR}px)`, columnGap: 58, rowGap: 30 }}>
          {certificats.map((c, i) => {
            const pose = spring({ frame: frame - arrivee(i), fps, config: { damping: 15, stiffness: 120 } });
            const visible = interpolate(frame, [arrivee(i), arrivee(i) + 8], [0, 1], clamp);
            // Reflet : une bande de lumière traverse la feuille une fois qu'elle est posée.
            const reflet = interpolate(frame, [arrivee(i) + 26, arrivee(i) + 44], [-0.4, 1.4], { ...clamp, easing: EASE_IN_OUT });
            return (
              <div key={c.image} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={{ height: 290, display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      position: "relative",
                      width: LARGEUR,
                      borderRadius: 6,
                      overflow: "hidden",
                      border: "1px solid rgba(230, 221, 208, 0.9)",
                      boxShadow: shadows.soft,
                      opacity: visible,
                      transform: `translateY(${(1 - pose) * 46}px) rotate(${INCLINAISONS[i % INCLINAISONS.length] + (1 - pose) * 5}deg) scale(${0.93 + 0.07 * pose})`,
                    }}
                  >
                    <Img src={diplomes[c.image]} style={{ display: "block", width: "100%" }} />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        // En lumière douce : le papier reste blanc, ce sont l'encre et les sceaux qui brillent au passage.
                        background: `linear-gradient(105deg, transparent ${(reflet - 0.22) * 100}%, rgba(255, 246, 222, 0.95) ${reflet * 100}%, transparent ${(reflet + 0.22) * 100}%)`,
                        mixBlendMode: "soft-light",
                        opacity: reflet > -0.35 && reflet < 1.35 ? 1 : 0,
                      }}
                    />
                  </div>
                </div>
                <FadeUp delay={arrivee(i) + 6} distance={10}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: fonts.sans, fontSize: 23, color: colors.inkSoft }}>
                    <GraduationCap size={24} strokeWidth={1.6} color={colors.forest} />
                    <span style={{ fontWeight: 650, color: colors.ink }}>{c.titre}</span>
                    <span>· {c.annee}</span>
                  </div>
                </FadeUp>
              </div>
            );
          })}
        </div>

        <FadeUp delay={34} distance={10}>
          <div style={{ marginTop: 30, fontFamily: fonts.sans, fontSize: 21, color: colors.inkSoft }}>
            Formations professionnelles suivies auprès d’organismes privés spécialisés.
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
