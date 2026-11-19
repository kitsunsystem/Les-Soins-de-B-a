import { CalendarHeart, Globe, MapPin, Phone } from "lucide-react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { avertissement, domaine, site } from "../script";
import { colors, fonts } from "../theme";
import { Body, Button, Eyebrow, FadeUp, GoldDust, Logo, SoftBlobs, Title, useAppear } from "../ui";

/** Bandeau d'appel à l'action du site (« Offrez-vous un moment de bien-être »), en plan final. */
export const Final: React.FC<{ duration: number }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: frame - 2, fps, config: { damping: 14, stiffness: 120 } });
  const pulse = 1 + 0.025 * Math.max(0, Math.sin((frame - 60) / 11)) * (frame > 60 ? 1 : 0);
  const mention = useAppear(54, 30);

  return (
    <AbsoluteFill style={{ background: colors.cream }}>
      <AbsoluteFill style={{ background: "rgba(243, 225, 220, 0.6)" }} />
      <SoftBlobs intensity={0.9} />
      <GoldDust count={24} seed="final" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", paddingBottom: 30 }}>
        <div style={{ transform: `scale(${logo})`, opacity: Math.min(1, logo * 1.5) }}>
          <Logo size={150} />
        </div>
        <FadeUp delay={10}>
          <Eyebrow style={{ marginTop: 26 }}>Sur rendez-vous uniquement</Eyebrow>
        </FadeUp>
        <FadeUp delay={16}>
          <Title size={104} style={{ marginTop: 6 }}>
            Offrez-vous un moment de bien-être
          </Title>
        </FadeUp>
        <FadeUp delay={24}>
          <Body size={30} style={{ marginTop: 26, maxWidth: 1080 }}>
            Choisissez votre soin et votre créneau en ligne en quelques clics, ou appelez-moi directement.
          </Body>
        </FadeUp>
        <FadeUp delay={32}>
          <div style={{ marginTop: 50, display: "flex", gap: 26, justifyContent: "center" }}>
            <Button icon={CalendarHeart} style={{ transform: `scale(${pulse})` }}>
              Réserver en ligne
            </Button>
            <Button variant="outline" icon={Phone}>
              {site.phone}
            </Button>
          </div>
        </FadeUp>
        <FadeUp delay={42}>
          <div
            style={{
              marginTop: 52,
              display: "flex",
              alignItems: "center",
              gap: 44,
              fontFamily: fonts.sans,
              fontSize: 27,
              color: colors.ink,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 500 }}>
              <Globe size={27} strokeWidth={1.75} color={colors.roseDeep} />
              {domaine}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 12, color: colors.inkSoft }}>
              <MapPin size={27} strokeWidth={1.75} color={colors.roseDeep} />
              Cabinet à {site.city}
            </span>
          </div>
        </FadeUp>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 36,
          textAlign: "center",
          fontFamily: fonts.sans,
          fontSize: 17,
          color: colors.inkSoft,
          opacity: 0.85 * mention,
        }}
      >
        {avertissement}
      </div>
    </AbsoluteFill>
  );
};
