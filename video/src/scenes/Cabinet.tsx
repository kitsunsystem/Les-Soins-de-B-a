import { MapPin } from "lucide-react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { images } from "../assets";
import { site } from "../script";
import { colors, fonts, shadows } from "../theme";
import { Accent, clamp, FadeUp, FondLin, SectionHeading } from "../ui";

const photos = [
  { src: images.cabinet1, position: "34% 55%", zoom: [1.12, 1.02] as [number, number], origine: "30% 50%", arche: false },
  { src: images.cabinet2, position: "50% 62%", zoom: [1.02, 1.1] as [number, number], origine: "50% 60%", arche: true },
  { src: images.cabinet3, position: "50% 58%", zoom: [1.1, 1.02] as [number, number], origine: "60% 50%", arche: false },
];

/** Galerie « Mon cabinet » de la page À propos. */
export const Cabinet: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <FondLin rameaux={false} sable />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <SectionHeading
          eyebrow="Le cabinet"
          title={
            <>
              Un espace pensé pour <Accent>votre détente</Accent>
            </>
          }
          titleSize={80}
        />
        <div style={{ marginTop: 56, display: "flex", alignItems: "flex-end", gap: 32 }}>
          {photos.map((p, i) => {
            const s = interpolate(frame, [0, duration], p.zoom, clamp);
            return (
              <FadeUp key={i} delay={4 + i * 3} distance={36}>
                <div
                  style={{
                    width: 520,
                    height: p.arche ? 580 : 520,
                    borderRadius: p.arche ? "260px 260px 40px 40px" : 32,
                    overflow: "hidden",
                    boxShadow: shadows.card,
                  }}
                >
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
        <FadeUp delay={12} distance={14}>
          <div style={{ marginTop: 36, display: "flex", alignItems: "center", gap: 12, fontFamily: fonts.sans, fontSize: 25, color: colors.inkSoft }}>
            <MapPin size={26} strokeWidth={1.75} color={colors.forest} />
            Cabinet à {site.city} — sur rendez-vous uniquement
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
