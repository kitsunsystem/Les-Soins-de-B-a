import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { images } from "../assets";
import { pastillesFormations } from "../script";
import { colors, shadows } from "../theme";
import { Accent, Body, clamp, Eyebrow, FadeUp, FondLin, Pill, Title, useAppear } from "../ui";

/** Section « Qui suis-je ? » de l'accueil. */
export const Beatrice: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const img = useAppear(0, 24);
  const zoom = interpolate(frame, [0, duration], [1.0, 1.06], clamp);

  return (
    <AbsoluteFill>
      <FondLin rameaux={false} intensite={0.7} />
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 120 }}>
        <div style={{ position: "relative", width: 620, height: 566, opacity: img, transform: `translateY(${(1 - img) * 34}px)` }}>
          <div
            style={{
              position: "absolute",
              inset: -22,
              borderRadius: 54,
              background: colors.claySoft,
              transform: `rotate(${-3 * img}deg)`,
            }}
          />
          <div style={{ position: "absolute", inset: 0, borderRadius: 50, overflow: "hidden", boxShadow: shadows.soft }}>
            <Img
              src={images.welcome}
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`, transformOrigin: "50% 6%" }}
            />
          </div>
        </div>

        <div style={{ width: 900 }}>
          <FadeUp delay={2} distance={14}>
            <Eyebrow>Votre praticienne</Eyebrow>
          </FadeUp>
          <FadeUp delay={5}>
            <Title size={88} style={{ marginTop: 22 }}>
              Béatrice, <Accent>à l’écoute de votre équilibre</Accent>
            </Title>
          </FadeUp>
          <FadeUp delay={10}>
            <Body style={{ marginTop: 32 }}>
              Sensible aux énergies depuis l’adolescence, elle a fait du magnétisme le cœur de sa pratique, qu’elle enrichit
              de réflexologie, de kinésiologie et de massages bien-être.
            </Body>
          </FadeUp>
          <div style={{ marginTop: 36, display: "flex", flexWrap: "wrap", gap: 12 }}>
            {pastillesFormations.map((p, i) => (
              <FadeUp key={p} delay={14 + i * 2} distance={14}>
                <Pill size={21}>{p}</Pill>
              </FadeUp>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
