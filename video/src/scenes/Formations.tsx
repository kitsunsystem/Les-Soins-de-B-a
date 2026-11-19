import { Flame, Hand } from "lucide-react";
import { AbsoluteFill } from "remotion";
import { formations } from "../script";
import { colors, fonts } from "../theme";
import { Body, Card, FadeUp, IconBadge, SectionHeading, Title, Watercolor } from "../ui";

const icones = [Hand, Flame];

/** Page Formations du site : « Transmettre, c'est prolonger le soin. » */
export const Formations: React.FC<{ duration: number }> = ({ duration }) => {
  return (
    <AbsoluteFill>
      <Watercolor duration={duration} variant="page" zoom={[1.06, 1.0]} />
      {/* Halo crème derrière le titre pour qu'il reste lisible devant les feuillages. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(1000px 330px at 960px 200px, rgba(248,242,236,0.92) 0%, rgba(248,242,236,0.8) 45%, rgba(248,242,236,0.35) 75%, rgba(248,242,236,0) 100%)",
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <SectionHeading eyebrow="Transmettre" title="Transmettre, c'est prolonger le soin." titleSize={86} />
        <FadeUp delay={20}>
          <Body style={{ marginTop: 30, maxWidth: 1180, textAlign: "center" }}>
            Parce que le magnétisme et la Flamme Violette sont des dons qui se transmettent, je propose des formations à
            celles et ceux qui souhaitent développer leur pratique.
          </Body>
        </FadeUp>
        <div style={{ marginTop: 54, display: "flex", gap: 40 }}>
          {formations.map((f, i) => (
            <FadeUp key={f.title} delay={28 + i * 8} style={{ display: "flex" }}>
              <Card
                style={{
                  width: 640,
                  padding: "46px 54px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <IconBadge icon={icones[i % icones.length]} size={100} />
                <Title size={50} style={{ marginTop: 26 }}>
                  {f.title}
                </Title>
                <Body size={25} style={{ marginTop: 14 }}>
                  {f.text}
                </Body>
              </Card>
            </FadeUp>
          ))}
        </div>
        <FadeUp delay={44}>
          <div style={{ marginTop: 40, fontFamily: fonts.serif, fontStyle: "italic", fontSize: 34, color: colors.inkSoft }}>
            Durée, tarifs et modalités sur demande.
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
