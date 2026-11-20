import { CalendarHeart, Globe, MapPin, Phone } from "lucide-react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { domaine, site } from "../script";
import { colors, EASE_IN_OUT, fonts } from "../theme";
import { Body, Botanical, Button, clamp, Eyebrow, FadeUp, LogoBadge, Title } from "../ui";

/**
 * Bandeau d'appel à l'action du site, en plan final. L'adresse du site puis le téléphone
 * s'illuminent quand la voix les prononce (`site`, `telephone` : images de la scène).
 */
export const Final: React.FC<{ duration: number; site: number; telephone: number }> = ({ site: repereSite, telephone }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bloc = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const logo = interpolate(frame, [4, 30], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const surSite = interpolate(frame, [repereSite - 6, repereSite + 6, telephone - 8, telephone + 4], [0, 1, 1, 0.35], clamp);
  const surTel = interpolate(frame, [telephone - 6, telephone + 6], [0, 1], clamp);
  const pulse = surTel * (0.5 + 0.5 * Math.sin((frame - telephone) / 7));

  return (
    <AbsoluteFill style={{ background: colors.linen }}>
      <div
        style={{
          position: "absolute",
          inset: 48,
          borderRadius: 64,
          background: colors.forest,
          overflow: "hidden",
          transform: `scale(${0.96 + 0.04 * bloc})`,
          opacity: Math.min(1, bloc * 1.5),
        }}
      >
        <Botanical height={460} color={colors.linen} opacity={0.1} trace={logo} style={{ left: -40, top: -60 }} />
        <Botanical height={460} color={colors.gold} opacity={0.22} trace={logo} rotate={180} style={{ right: -30, bottom: -80 }} />

        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", paddingBottom: 26 }}>
          <LogoBadge size={112} inverse trace={logo} />
          <FadeUp delay={6} distance={14}>
            <Eyebrow color={colors.gold} style={{ marginTop: 30 }}>
              Sur rendez-vous uniquement
            </Eyebrow>
          </FadeUp>
          <FadeUp delay={9}>
            <Title size={104} color={colors.linen} style={{ marginTop: 18, maxWidth: 1400 }}>
              Offrez-vous un moment rien qu'à vous
            </Title>
          </FadeUp>
          <FadeUp delay={13}>
            <Body size={30} color="rgba(248, 244, 238, 0.82)" style={{ marginTop: 22, maxWidth: 1050 }}>
              Choisissez votre soin et votre créneau en ligne en moins d'une minute, ou appelez-moi directement.
            </Body>
          </FadeUp>
          <FadeUp delay={17}>
            <div style={{ marginTop: 46, display: "flex", gap: 24, justifyContent: "center" }}>
              <Button variant="accent" icon={CalendarHeart}>
                Réserver en ligne
              </Button>
              <Button
                variant="outlineLight"
                icon={Phone}
                style={{
                  borderColor: `rgba(194, 154, 79, ${0.32 + 0.68 * surTel})`,
                  background: `rgba(248, 244, 238, ${0.12 * surTel})`,
                  transform: `scale(${1 + 0.05 * pulse})`,
                  boxShadow: surTel > 0 ? `0 0 ${40 * surTel}px rgba(194, 154, 79, ${0.35 * surTel})` : "none",
                }}
              >
                {site.phone}
              </Button>
            </div>
          </FadeUp>
          <FadeUp delay={22}>
            <div style={{ marginTop: 48, display: "flex", alignItems: "center", gap: 46, fontFamily: fonts.sans, fontSize: 29, color: colors.linen }}>
              <span
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontWeight: 650,
                  transform: `scale(${1 + 0.06 * surSite})`,
                }}
              >
                <Globe size={29} strokeWidth={1.75} color={colors.gold} />
                {domaine}
                <span
                  style={{
                    position: "absolute",
                    left: 42,
                    right: 0,
                    bottom: -10,
                    height: 2.5,
                    background: colors.gold,
                    transform: `scaleX(${surSite})`,
                    transformOrigin: "left",
                  }}
                />
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(248, 244, 238, 0.82)" }}>
                <MapPin size={29} strokeWidth={1.75} color={colors.gold} />
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
            bottom: 34,
            textAlign: "center",
            fontFamily: fonts.sans,
            fontSize: 18,
            color: "rgba(248, 244, 238, 0.55)",
            opacity: interpolate(frame, [30, 50], [0, 1], clamp),
          }}
        >
          Pratiques de bien-être, non médicales.
        </div>
      </div>
    </AbsoluteFill>
  );
};
