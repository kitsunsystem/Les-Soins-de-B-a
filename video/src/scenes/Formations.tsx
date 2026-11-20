import { Flame, Hand } from "lucide-react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { formations } from "../script";
import { colors, EASE_IN_OUT, shadows, titre } from "../theme";
import { Body, Button, Card, clamp, FadeUp, FondLin, IconCircle, SectionHeading, Title } from "../ui";

const icones = [Hand, Flame];

/**
 * Page Formations : « Transmettre, c'est prolonger le soin. »
 * Chaque carte s'avance quand la voix la nomme (`reperes`, images de la scène, dans l'ordre des formations).
 */
export const Formations: React.FC<{ duration: number; reperes: number[] }> = ({ reperes }) => {
  const frame = useCurrentFrame();
  const active = reperes.filter((r) => frame >= r - 6).length - 1;
  const focus = interpolate(frame, [reperes[0] - 8, reperes[0] + 4], [0, 1], { ...clamp, easing: EASE_IN_OUT });

  return (
    <AbsoluteFill>
      <FondLin />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <SectionHeading eyebrow="Transmettre" title="Transmettre, c'est prolonger le soin." titleSize={86} />
        <div style={{ marginTop: 62, display: "flex", gap: 40 }}>
          {formations.map((f, i) => {
            const on = interpolate(frame, [reperes[i] - 6, reperes[i] + 4, (reperes[i + 1] ?? 1e9) - 6, (reperes[i + 1] ?? 1e9) + 4], [0, 1, 1, 0], {
              ...clamp,
              easing: EASE_IN_OUT,
            });
            const attenue = focus * (active === i ? 0 : 1);
            return (
              <FadeUp key={f.title} delay={8 + i * 4} style={{ display: "flex" }}>
                <div style={{ display: "flex", opacity: 1 - 0.4 * attenue, transform: `translateY(${-14 * on}px) scale(${1 + 0.04 * on})` }}>
                  <Card
                    style={{
                      width: 620,
                      padding: "46px 52px 40px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      boxShadow: on > 0.3 ? shadows.soft : undefined,
                    }}
                  >
                    <IconCircle icon={icones[i % icones.length]} size={100} />
                    <Title size={48} style={{ marginTop: 26 }}>
                      {f.title}
                    </Title>
                    <Body size={25} style={{ marginTop: 14, flex: 1 }}>
                      {f.text}
                    </Body>
                    <div style={{ paddingTop: 30 }}>
                      <Button variant="outline" scale={0.78}>
                        Me contacter pour en savoir plus
                      </Button>
                    </div>
                  </Card>
                </div>
              </FadeUp>
            );
          })}
        </div>
        <FadeUp delay={16}>
          <div style={{ ...titre, marginTop: 44, fontStyle: "italic", fontWeight: 380, fontSize: 34, color: colors.inkSoft }}>
            Durée, tarifs et modalités sur demande.
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
