import { Flame, Hand } from "lucide-react";
import { AbsoluteFill } from "remotion";
import { formations } from "../script";
import { colors, titre } from "../theme";
import { Body, Card, FadeUp, FondLin, IconCircle, SectionHeading, Title } from "../ui";

const icones = [Hand, Flame];

/** Page Formations : « Transmettre, c'est prolonger le soin. » */
export const Formations: React.FC<{ duration: number }> = () => {
  return (
    <AbsoluteFill>
      <FondLin />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <SectionHeading eyebrow="Transmettre" title="Transmettre, c'est prolonger le soin." titleSize={86} />
        <div style={{ marginTop: 62, display: "flex", gap: 40 }}>
          {formations.map((f, i) => (
            <FadeUp key={f.title} delay={8 + i * 4} style={{ display: "flex" }}>
              <Card style={{ width: 620, padding: "46px 52px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <IconCircle icon={icones[i % icones.length]} size={100} />
                <Title size={48} style={{ marginTop: 26 }}>
                  {f.title}
                </Title>
                <Body size={25} style={{ marginTop: 14 }}>
                  {f.text}
                </Body>
              </Card>
            </FadeUp>
          ))}
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
