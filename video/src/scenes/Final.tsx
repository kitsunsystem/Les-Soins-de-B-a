import { CalendarHeart, Globe, MapPin, Phone } from "lucide-react";
import { AbsoluteFill, interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { domaine, site } from "../script";
import { colors, EASE_IN_OUT, fonts } from "../theme";
import { Body, Botanical, Button, clamp, Eyebrow, FadeUp, LogoBadge, Title } from "../ui";

/**
 * Bandeau d'appel à l'action du site, en plan final. Repères (images de la scène) : le nom de la marque
 * apparaît sur « Les Soins de Béa », l'adresse du site se souligne sur « Réservez sur… », puis le bouton
 * téléphone s'allume et chaque paire de chiffres passe en or au moment où elle est dictée.
 */
export const Final: React.FC<{ duration: number; site: number; telephone: number; paires: number[] }> = ({
  site: repereSite,
  telephone,
  paires,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bloc = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const apparition = interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const logo = interpolate(frame, [2, 28], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const trait = interpolate(frame, [repereSite - 6, repereSite + 6], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const surSite = interpolate(frame, [repereSite - 6, repereSite + 6, telephone - 8, telephone + 4], [0, 1, 1, 0.35], clamp);
  const surTel = interpolate(frame, [telephone - 6, telephone + 6], [0, 1], clamp);

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
          opacity: apparition,
        }}
      >
        <Botanical height={460} color={colors.linen} opacity={0.1} trace={logo} style={{ left: -40, top: -60 }} />
        <Botanical
          height={460}
          color={colors.gold}
          opacity={0.22}
          trace={logo}
          rotate={180}
          style={{ right: -30, bottom: -80, transformOrigin: "50% 50%" }}
        />

        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", paddingBottom: 30 }}>
          <LogoBadge size={100} inverse trace={logo} />
          <FadeUp delay={3} distance={16}>
            <Title size={70} color={colors.linen} style={{ marginTop: 18 }}>
              {site.name}
            </Title>
          </FadeUp>
          <FadeUp delay={8} distance={12}>
            <Eyebrow color={colors.gold} style={{ marginTop: 14 }}>
              Bien-être · {site.city} · sur rendez-vous
            </Eyebrow>
          </FadeUp>
          <FadeUp delay={12}>
            <Title size={84} color={colors.linen} style={{ marginTop: 34 }}>
              Offrez-vous un moment rien qu'à vous
            </Title>
          </FadeUp>
          <FadeUp delay={15}>
            <Body size={29} color="rgba(248, 244, 238, 0.82)" style={{ marginTop: 18, maxWidth: 1080 }}>
              Choisissez votre soin et votre créneau en ligne en moins d'une minute, ou appelez Béatrice directement.
            </Body>
          </FadeUp>
          <FadeUp delay={18}>
            <div style={{ marginTop: 40, display: "flex", gap: 24, justifyContent: "center" }}>
              <Button variant="accent" icon={CalendarHeart}>
                Réserver en ligne
              </Button>
              <Button
                variant="outlineLight"
                icon={Phone}
                style={{
                  borderColor: interpolateColors(surTel, [0, 1], ["rgba(248, 244, 238, 0.32)", "rgba(194, 154, 79, 1)"]),
                  background: `rgba(248, 244, 238, ${0.12 * surTel})`,
                  boxShadow: surTel > 0 ? `0 0 ${40 * surTel}px rgba(194, 154, 79, ${0.35 * surTel})` : "none",
                }}
              >
                <Numero frame={frame} paires={paires} />
              </Button>
            </div>
          </FadeUp>
          <FadeUp delay={22}>
            <div style={{ marginTop: 42, display: "flex", alignItems: "center", gap: 46, fontFamily: fonts.sans, fontSize: 29, color: colors.linen }}>
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
                    transform: `scaleX(${trait})`,
                    transformOrigin: "left",
                    opacity: 0.4 + 0.6 * surSite,
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
            bottom: 30,
            textAlign: "center",
            fontFamily: fonts.sans,
            fontSize: 22,
            color: "rgba(248, 244, 238, 0.75)",
            opacity: interpolate(frame, [30, 50], [0, 1], clamp),
          }}
        >
          Pratiques de bien-être, non médicales.
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Le numéro, paire par paire : chaque paire passe en or quand la voix la dit, puis reste en lin. */
function Numero({ frame, paires }: { frame: number; paires: number[] }) {
  const morceaux = site.phone.split(".");
  return (
    <span style={{ display: "inline-flex" }}>
      {morceaux.map((m, i) => {
        const c = paires[i];
        if (c === undefined) return <span key={i}>{(i > 0 ? "." : "") + m}</span>;
        const fin = paires[i + 1] ?? c + 30;
        const or = interpolate(frame, [c - 2, c + 3, fin - 2, fin + 4], [0, 1, 1, 0], { ...clamp, easing: EASE_IN_OUT });
        const dite = interpolate(frame, [c - 2, c + 3], [0.7, 1], clamp);
        return (
          <span key={i} style={{ display: "inline-flex" }}>
            {i > 0 && <span style={{ opacity: dite }}>.</span>}
            <span
              style={{
                display: "inline-block",
                opacity: dite,
                color: interpolateColors(or, [0, 1], [colors.linen, colors.gold]),
                transform: `scale(${1 + 0.12 * or})`,
              }}
            >
              {m}
            </span>
          </span>
        );
      })}
    </span>
  );
}
