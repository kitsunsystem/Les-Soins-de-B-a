import { MapPin } from "lucide-react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { images } from "../assets";
import { site } from "../script";
import { colors, fonts, shadows } from "../theme";
import { clamp, FadeUp, SectionHeading } from "../ui";

const photos = [
  { src: images.cabinet1, position: "34% 55%", zoom: [1.14, 1.04] as [number, number], origine: "30% 50%" },
  { src: images.cabinet2, position: "50% 62%", zoom: [1.02, 1.12] as [number, number], origine: "50% 60%" },
  { src: images.cabinet3, position: "50% 58%", zoom: [1.12, 1.02] as [number, number], origine: "60% 50%" },
];

/** Galerie « Mon cabinet » de la page À propos. */
export const Cabinet: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: colors.sand, alignItems: "center", justifyContent: "center" }}>
      <SectionHeading eyebrow="Mon cabinet" title="Un espace pensé pour votre détente" titleSize={82} />
      <div style={{ marginTop: 58, display: "flex", gap: 32 }}>
        {photos.map((p, i) => {
          const s = interpolate(frame, [0, duration], p.zoom, clamp);
          return (
            <FadeUp key={i} delay={16 + i * 7} distance={40}>
              <div style={{ width: 530, height: 540, borderRadius: 28, overflow: "hidden", boxShadow: shadows.card }}>
                <Img
                  src={p.src}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: p.position,
                    transform: `scale(${s})`,
                    transformOrigin: p.origine,
                    filter: "brightness(1.06) saturate(0.94)",
                  }}
                />
              </div>
            </FadeUp>
          );
        })}
      </div>
      <FadeUp delay={38}>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: fonts.sans,
            fontSize: 26,
            color: colors.inkSoft,
          }}
        >
          <MapPin size={26} strokeWidth={1.75} color={colors.roseDeep} />
          Cabinet à {site.city} — sur rendez-vous uniquement
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};
