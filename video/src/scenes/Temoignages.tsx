import { BookOpen } from "lucide-react";
import { AbsoluteFill } from "remotion";
import { temoignages } from "../script";
import { colors, fonts } from "../theme";
import { Card, FadeUp, SectionHeading, Stars, typo } from "../ui";

/** Section « Livre d'or » : les cartes de témoignages du site. */
export const Temoignages: React.FC<{ duration: number }> = () => {
  return (
    <AbsoluteFill style={{ background: colors.sand, alignItems: "center", justifyContent: "center" }}>
      <SectionHeading
        eyebrow="Livre d'or"
        title="Ce que disent celles et ceux qui m'ont fait confiance"
        titleSize={72}
        style={{ maxWidth: 1300 }}
      />
      <div style={{ marginTop: 64, display: "flex", gap: 36 }}>
        {temoignages.map((t, i) => (
          <FadeUp key={t.name} delay={22 + i * 9} style={{ display: "flex" }}>
            <Card style={{ width: 530, padding: "46px 48px", display: "flex", flexDirection: "column" }}>
              <Stars delay={30 + i * 9} size={30} />
              <div
                style={{
                  marginTop: 24,
                  flex: 1,
                  fontFamily: fonts.serif,
                  fontStyle: "italic",
                  fontSize: 33,
                  lineHeight: 1.45,
                  color: colors.ink,
                }}
              >
                {typo(t.text)}
              </div>
              <div style={{ marginTop: 26, fontFamily: fonts.script, fontWeight: 500, fontSize: 44, color: colors.roseDeep }}>
                — {t.name}
              </div>
            </Card>
          </FadeUp>
        ))}
      </div>
      <FadeUp delay={52} distance={16}>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: fonts.sans,
            fontSize: 22,
            color: colors.inkSoft,
          }}
        >
          <BookOpen size={24} strokeWidth={1.75} color={colors.roseDeep} />
          {typo("Extraits des messages manuscrits du livre d'or du cabinet")}
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};
