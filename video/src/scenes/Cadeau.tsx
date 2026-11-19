import { Gift } from "lucide-react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { cadeau } from "../script";
import { colors, fonts } from "../theme";
import { Body, Button, clamp, Eyebrow, FadeUp, GoldDust, SoftBlobs, Title, useAppear } from "../ui";

/** Encadré « Cartes & bons cadeaux » de la page Tarifs. */
export const Cadeau: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const carte = useAppear(4, 34);
  const balancement = Math.sin(frame / 22) * 4;
  const flotte = interpolate(frame, [0, duration], [10, -10], clamp);

  return (
    <AbsoluteFill style={{ background: colors.cream, alignItems: "center", justifyContent: "center" }}>
      <SoftBlobs intensity={0.9} sauge={false} />
      <GoldDust count={18} seed="cadeau" opacity={0.8} />
      <FadeUp delay={0}>
        <Eyebrow size={52} style={{ textAlign: "center" }}>
          Une idée cadeau
        </Eyebrow>
      </FadeUp>
      <div
        style={{
          position: "relative",
          marginTop: 34,
          width: 1180,
          overflow: "hidden",
          borderRadius: 40,
          background: colors.roseSoft,
          padding: "74px 84px",
          opacity: carte,
          transform: `translateY(${(1 - carte) * 50 + flotte}px)`,
          boxShadow: "0 24px 80px -30px rgba(120, 70, 50, 0.28)",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -40,
            top: -46,
            color: "rgba(217, 168, 160, 0.42)",
            transform: `rotate(${balancement + 8}deg)`,
          }}
        >
          <Gift size={340} strokeWidth={1} />
        </div>
        <FadeUp delay={14}>
          <Title size={84} style={{ position: "relative" }}>
            {cadeau.title}
          </Title>
        </FadeUp>
        <FadeUp delay={20}>
          <Body size={30} style={{ position: "relative", marginTop: 24, maxWidth: 820 }}>
            {cadeau.text}
          </Body>
        </FadeUp>
        <FadeUp delay={28}>
          <div style={{ position: "relative", marginTop: 44, display: "flex", alignItems: "center", gap: 34 }}>
            <Button icon={Gift}>Commander une carte cadeau</Button>
            <span style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 34, color: colors.roseDeep }}>
              {cadeau.note}
            </span>
          </div>
        </FadeUp>
      </div>
    </AbsoluteFill>
  );
};
