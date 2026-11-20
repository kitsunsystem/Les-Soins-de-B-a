import { ArrowRight, CalendarCheck, CalendarHeart, Globe2 } from "lucide-react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { images } from "../assets";
import { preuves, site } from "../script";
import { colors, fonts, shadows, titre } from "../theme";
import { Accent, Body, Botanical, Button, clamp, Eyebrow, FadeUp, FondLin, Stars, useAppear } from "../ui";

/** Le haut de la page d'accueil : titre explicite, preuves (dont les séances à distance), photo en arche. */
export const Accueil: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const photo = useAppear(2, 24);
  const zoom = interpolate(frame, [0, duration], [1.08, 1.0], clamp);
  const medaillon = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 150 } });
  const carte = useAppear(16, 22);
  const flotte = Math.sin(frame / 22) * 6;

  return (
    <AbsoluteFill>
      <FondLin rameaux={false} />
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 80, paddingTop: 10 }}>
        <div style={{ width: 920 }}>
          <FadeUp delay={0} distance={14}>
            <Eyebrow>Praticienne bien-être · {site.city} &amp; à distance</Eyebrow>
          </FadeUp>
          <FadeUp delay={3}>
            <div style={{ ...titre, marginTop: 26, fontSize: 98, color: colors.ink }}>
              Réflexologie, massages
              <br />
              <Accent>&amp; magnétisme</Accent>
              <br />à {site.city}
            </div>
          </FadeUp>
          <FadeUp delay={8}>
            <Body size={29} style={{ marginTop: 30, maxWidth: 860 }}>
              Béatrice vous reçoit dans son cabinet pour des soins sur mesure qui{" "}
              <strong style={{ color: colors.ink, fontWeight: 650 }}>
                apaisent le corps, libèrent les tensions et rééquilibrent l’énergie
              </strong>
              . Pour les femmes enceintes et les bébés aussi.
            </Body>
          </FadeUp>
          <FadeUp delay={12}>
            <div style={{ marginTop: 40, display: "flex", gap: 20 }}>
              <Button icon={CalendarHeart}>Prendre rendez-vous</Button>
              <Button variant="outline" iconRight={ArrowRight}>
                Voir les soins &amp; tarifs
              </Button>
            </div>
          </FadeUp>
          <FadeUp delay={16} distance={16}>
            <div style={{ marginTop: 48, display: "flex", alignItems: "center", gap: 54, fontFamily: fonts.sans, fontSize: 22 }}>
              <Preuve visuel={<Stars size={24} delay={18} />} fort="5/5" texte="au livre d’or" />
              <Preuve
                visuel={<span style={{ ...titre, fontSize: 44, lineHeight: 1, color: colors.clay }}>{preuves.prixMin} €</span>}
                fort="Séances dès"
                texte={`${preuves.dureeMin} min`}
              />
              <Preuve visuel={<Globe2 size={30} strokeWidth={1.7} color={colors.forest} />} fort={site.city} texte="& partout en France" />
            </div>
          </FadeUp>
        </div>

        <div style={{ position: "relative", width: 700, height: 840 }}>
          <Botanical height={250} opacity={0.26} style={{ right: -40, top: -36 }} />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 20,
              width: 600,
              height: 750,
              overflow: "hidden",
              borderRadius: "300px 300px 42px 42px",
              boxShadow: shadows.soft,
              opacity: photo,
              transform: `translateY(${(1 - photo) * 40}px)`,
            }}
          >
            <Img src={images.zen} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} />
          </div>
          <div
            style={{
              position: "absolute",
              left: -10,
              bottom: 150,
              width: 250,
              height: 250,
              borderRadius: "50%",
              overflow: "hidden",
              border: `9px solid ${colors.linen}`,
              boxShadow: shadows.soft,
              transform: `scale(${medaillon})`,
            }}
          >
            <Img src={images.welcome} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 60%" }} />
          </div>
          <div
            style={{
              position: "absolute",
              right: -20,
              bottom: 26,
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "18px 30px 18px 18px",
              borderRadius: 26,
              background: "rgba(255, 253, 249, 0.96)",
              boxShadow: shadows.soft,
              opacity: carte,
              transform: `translateY(${(1 - carte) * 30 + flotte}px)`,
            }}
          >
            <div
              style={{
                width: 62,
                height: 62,
                borderRadius: 16,
                background: colors.forest,
                color: colors.linen,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarCheck size={30} strokeWidth={1.7} />
            </div>
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontFamily: fonts.sans, fontSize: 17, fontWeight: 750, letterSpacing: "0.14em", textTransform: "uppercase", color: colors.clay }}>
                Sur rendez-vous
              </div>
              <div style={{ marginTop: 6, fontFamily: fonts.sans, fontSize: 25, fontWeight: 650, color: colors.ink }}>
                Réservation en ligne · 24 h/24
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

function Preuve({ visuel, fort, texte }: { visuel: React.ReactNode; fort: string; texte: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {visuel}
      <div style={{ lineHeight: 1.25, color: colors.inkSoft }}>
        <div style={{ fontWeight: 750, color: colors.ink }}>{fort}</div>
        {texte}
      </div>
    </div>
  );
}
