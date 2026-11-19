import { Award, HeartHandshake, ShieldCheck } from "lucide-react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { images } from "../assets";
import { raisons } from "../script";
import { colors, fonts, shadows } from "../theme";
import { Body, clamp, FadeUp, IconBadge, Ornament, SoftBlobs, Title, useAppear } from "../ui";

const icones = [HeartHandshake, Award, ShieldCheck];

/** Section « Pourquoi me consulter » de l'accueil, avec la photo zen de la page À propos. */
export const Pourquoi: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const photo = useAppear(0, 36);
  const zoom = interpolate(frame, [0, duration], [1.1, 1.0], clamp);

  return (
    <AbsoluteFill style={{ background: colors.cream }}>
      <SoftBlobs intensity={0.5} sauge={false} />
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 120 }}>
        <div
          style={{
            width: 600,
            height: 760,
            borderRadius: 46,
            overflow: "hidden",
            boxShadow: shadows.soft,
            opacity: photo,
            transform: `translateY(${(1 - photo) * 44}px)`,
          }}
        >
          <Img src={images.zen} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} />
        </div>

        <div style={{ width: 860 }}>
          <FadeUp delay={8}>
            <Title size={92}>Pourquoi me consulter</Title>
          </FadeUp>
          <Ornament delay={14} align="left" lineWidth={64} style={{ marginTop: 28 }} />
          {raisons.map((r, i) => (
            <FadeUp key={r.title} delay={22 + i * 9}>
              <div style={{ marginTop: i === 0 ? 54 : 40, display: "flex", gap: 34, alignItems: "flex-start" }}>
                <IconBadge icon={icones[i]} size={96} background={colors.sageSoft} color={colors.ink} />
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontFamily: fonts.serif, fontWeight: 500, fontSize: 46, lineHeight: 1.12, color: colors.ink }}>
                    {r.title}
                  </div>
                  <Body size={25} style={{ marginTop: 8 }}>
                    {r.text}
                  </Body>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
