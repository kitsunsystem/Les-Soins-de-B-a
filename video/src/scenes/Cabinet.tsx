import type { LucideIcon } from "lucide-react";
import { Armchair, Bed, Lamp, MapPin } from "lucide-react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { images } from "../assets";
import { site } from "../script";
import { colors, EASE_IN_OUT, EASE_OUT, fonts, shadows, titre } from "../theme";
import { Accent, clamp, FadeUp, FondLin, SectionHeading, typo } from "../ui";

const photos: { src: string; position: string; zoom: [number, number]; origine: string; arche: boolean; legende: string; icone: LucideIcon }[] = [
  { src: images.cabinet1, position: "34% 55%", zoom: [1.12, 1.02], origine: "30% 50%", arche: false, legende: "Une table de soin douillette", icone: Bed },
  { src: images.cabinet2, position: "50% 62%", zoom: [1.02, 1.1], origine: "50% 60%", arche: true, legende: "Un coin pour échanger", icone: Armchair },
  { src: images.cabinet3, position: "50% 58%", zoom: [1.1, 1.02], origine: "60% 50%", arche: false, legende: "Une lumière tout en douceur", icone: Lamp },
];

/**
 * Galerie « Mon cabinet » de la page À propos. Les photos s'avancent une à une quand la voix les décrit
 * (`photos` : images de la scène), avec leur légende ; à la fin, les trois légendes restent visibles.
 */
export const Cabinet: React.FC<{ duration: number; photos: [number, number, number] }> = ({ duration, photos: reperes }) => {
  const frame = useCurrentFrame();
  const vedettes = photos.map((_, i) => {
    const debut = reperes[i];
    const suivant = reperes[i + 1] ?? 1e9;
    return interpolate(frame, [debut - 6, debut + 8, suivant - 6, suivant + 8], [0, 1, 1, 0], { ...clamp, easing: EASE_IN_OUT });
  });
  // Une photo est en avant : les autres reculent un peu.
  const actif = Math.max(...vedettes);

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
        <div style={{ marginTop: 70, display: "flex", alignItems: "flex-end", gap: 32 }}>
          {photos.map((p, i) => {
            const v = vedettes[i];
            const recul = actif - v;
            const zoom = interpolate(frame, [0, duration], p.zoom, clamp) + 0.05 * v;
            const legende = interpolate(frame, [reperes[i] - 4, reperes[i] + 10], [0, 1], { ...clamp, easing: EASE_OUT });
            const Icone = p.icone;
            return (
              <FadeUp key={i} delay={4 + i * 3} distance={36} style={{ zIndex: v > 0.5 ? 2 : 1 }}>
                <div
                  style={{
                    position: "relative",
                    width: 520,
                    height: p.arche ? 580 : 520,
                    borderRadius: p.arche ? "260px 260px 40px 40px" : 32,
                    overflow: "hidden",
                    boxShadow: v > 0.05 ? shadows.soft : shadows.card,
                    transform: `translateY(${-8 * v}px) scale(${1 + 0.05 * v - 0.04 * recul})`,
                    transformOrigin: "50% 100%",
                    opacity: 1 - 0.2 * recul,
                  }}
                >
                  <Img
                    src={p.src}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: p.position,
                      transform: `scale(${zoom})`,
                      transformOrigin: p.origine,
                      filter: `brightness(${1.06 - 0.04 * recul}) saturate(${0.94 - 0.24 * recul})`,
                    }}
                  />
                  {/* Légende flottante, comme les cartes posées sur les photos du site. */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 26,
                      display: "flex",
                      justifyContent: "center",
                      opacity: legende * (1 - 0.25 * recul),
                      transform: `translateY(${(1 - legende) * 18}px)`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 24px 12px 14px",
                        borderRadius: 999,
                        background: "rgba(255, 253, 249, 0.94)",
                        boxShadow: "0 14px 34px -18px rgba(38, 53, 46, 0.55)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: "50%",
                          background: colors.claySoft,
                          color: colors.clayDark,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icone size={22} strokeWidth={1.7} />
                      </div>
                      <span style={{ ...titre, fontSize: 27, fontStyle: "italic", color: colors.ink }}>{typo(p.legende)}</span>
                    </div>
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>
        <FadeUp delay={12} distance={14}>
          <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 12, fontFamily: fonts.sans, fontSize: 25, color: colors.inkSoft }}>
            <MapPin size={26} strokeWidth={1.75} color={colors.forest} />
            Cabinet à {site.city} — sur rendez-vous uniquement
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
