import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { images } from "../assets";
import { colors, shadows } from "../theme";
import { Body, clamp, Eyebrow, FadeUp, Pill, SoftBlobs, Title, useAppear } from "../ui";

const pastilles = ["Réflexologie", "Kinésiologie", "Massages", "Magnétisme", "Guidance"];

/** Section « Bienvenue dans mon univers » de l'accueil : l'illustration aquarelle et la présentation. */
export const Beatrice: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const img = useAppear(2, 36);
  const zoom = interpolate(frame, [0, duration], [1.0, 1.07], clamp);

  return (
    <AbsoluteFill style={{ background: colors.cream }}>
      <SoftBlobs intensity={0.6} sauge={false} />
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 120 }}>
        <div
          style={{
            position: "relative",
            width: 630,
            height: 575,
            opacity: img,
            transform: `translateY(${(1 - img) * 44}px)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -30,
              borderRadius: 54,
              background: colors.roseSoft,
              transform: `rotate(${-2.2 * img}deg)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 46,
              overflow: "hidden",
              boxShadow: shadows.soft,
            }}
          >
            <Img
              src={images.welcome}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${zoom})`,
                transformOrigin: "50% 6%",
              }}
            />
          </div>
        </div>

        <div style={{ width: 880 }}>
          <FadeUp delay={12}>
            <Eyebrow>Bienvenue dans mon univers</Eyebrow>
          </FadeUp>
          <FadeUp delay={18}>
            <Title size={92} style={{ marginTop: 8 }}>
              Une rencontre,
              <br />
              un soin, un chemin
            </Title>
          </FadeUp>
          <FadeUp delay={28}>
            <Body style={{ marginTop: 38 }}>
              Je suis <strong style={{ color: colors.ink, fontWeight: 500 }}>Béatrice</strong>, praticienne bien-être à
              Perpignan. Mon approche est holistique&nbsp;: elle relie le corps, l’énergie et l’esprit.
            </Body>
          </FadeUp>
          <FadeUp delay={36}>
            <Body style={{ marginTop: 22 }}>
              Je vous accueille dans un cadre doux et apaisant, pour un accompagnement personnalisé, à votre rythme et à
              votre écoute.
            </Body>
          </FadeUp>
          <div style={{ marginTop: 44, display: "flex", gap: 12 }}>
            {pastilles.map((p, i) => (
              <FadeUp key={p} delay={50 + i * 5} distance={20}>
                <Pill size={20}>{p}</Pill>
              </FadeUp>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
