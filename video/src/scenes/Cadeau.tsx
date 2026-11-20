import { Gift } from "lucide-react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { cadeau } from "../script";
import { colors, shadows, titre } from "../theme";
import { Body, Button, Eyebrow, FadeUp, FondLin, Title, useAppear } from "../ui";

/** Encadré « Cartes & bons cadeaux » de la page Tarifs. */
export const Cadeau: React.FC<{ duration: number }> = () => {
  const frame = useCurrentFrame();
  const boite = useAppear(2, 20);
  const balancement = Math.sin(frame / 14) * 5;

  return (
    <AbsoluteFill>
      <FondLin rameaux={false} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <FadeUp delay={0} distance={14}>
          <Eyebrow>Une idée cadeau</Eyebrow>
        </FadeUp>
        <div
          style={{
            position: "relative",
            marginTop: 36,
            width: 1240,
            overflow: "hidden",
            borderRadius: 40,
            background: colors.claySoft,
            padding: "72px 86px",
            boxShadow: shadows.soft,
            opacity: boite,
            transform: `translateY(${(1 - boite) * 44}px) scale(${0.97 + 0.03 * boite})`,
          }}
        >
          <div style={{ position: "absolute", right: -46, top: -54, color: "rgba(180, 105, 74, 0.22)", transform: `rotate(${balancement + 8}deg)` }}>
            <Gift size={360} strokeWidth={1} />
          </div>
          <FadeUp delay={6}>
            <Title size={82} style={{ position: "relative" }}>
              {cadeau.title}
            </Title>
          </FadeUp>
          <FadeUp delay={9}>
            <Body size={30} style={{ position: "relative", marginTop: 22, maxWidth: 860 }}>
              {cadeau.text}
            </Body>
          </FadeUp>
          <FadeUp delay={13}>
            <div style={{ position: "relative", marginTop: 42, display: "flex", alignItems: "center", gap: 34 }}>
              <Button icon={Gift}>Commander une carte cadeau</Button>
              <span style={{ ...titre, fontStyle: "italic", fontWeight: 400, fontSize: 36, color: colors.clayDark }}>{cadeau.note}</span>
            </div>
          </FadeUp>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
