import { Quote } from "lucide-react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { temoignages } from "../script";
import { colors, EASE_IN_OUT, fonts, shadows, titre } from "../theme";
import { Accent, Body, Card, clamp, FadeUp, FondLin, SectionHeading, Stars, typo } from "../ui";

/** Morceaux de la phrase lue par la voix : chacun s'allume quand il est prononcé. */
const FRAGMENTS_LUS = ["Un moment suspendu, ", "d'évasion, ", "de liberté."];

/**
 * Section « Livre d'or » de l'accueil. Pendant la citation de Léa (repères en images de la scène),
 * sa carte s'avance, les mots lus s'allument un à un, puis son nom sur « écrit Léa ».
 */
export const Temoignages: React.FC<{
  duration: number;
  auteur: string;
  /** Images de scène : « Un moment suspendu », « d'évasion », « de liberté », « écrit Léa ». */
  lecture: [number, number, number, number];
}> = ({ auteur, lecture }) => {
  const frame = useCurrentFrame();
  const [citation, , , signature] = lecture;
  const focus = interpolate(frame, [citation - 8, citation + 6], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const nom = interpolate(frame, [signature - 3, signature + 4, signature + 16], [0, 1, 0.6], clamp);

  return (
    <AbsoluteFill>
      <FondLin rameaux={false} sable intensite={0.6} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <SectionHeading
          eyebrow="Livre d'or"
          title={
            <>
              Elles en parlent <Accent>mieux que personne</Accent>
            </>
          }
          titleSize={80}
        />
        <FadeUp delay={6} distance={12}>
          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 16 }}>
            <Stars size={26} delay={8} />
            <Body size={24}>Des mots écrits à la main dans le livre d’or du cabinet, après leur séance.</Body>
          </div>
        </FadeUp>
        <div style={{ marginTop: 52, display: "flex", alignItems: "stretch", gap: 34 }}>
          {temoignages.map((t, i) => {
            const vedette = t.name === auteur;
            return (
              <FadeUp key={t.name} delay={8 + i * 3} style={{ display: "flex" }}>
                <div
                  style={{
                    display: "flex",
                    opacity: vedette ? 1 : 1 - 0.45 * focus,
                    transform: vedette ? `translateY(${-18 * focus}px) scale(${1 + 0.07 * focus})` : `scale(${1 - 0.03 * focus})`,
                    zIndex: vedette ? 1 : 0,
                  }}
                >
                  <Card
                    style={{
                      position: "relative",
                      width: 520,
                      padding: "42px 44px 34px",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: vedette && focus > 0.3 ? shadows.soft : undefined,
                    }}
                  >
                    <div style={{ position: "absolute", right: 38, top: 34, color: colors.sageSoft }}>
                      <Quote size={48} strokeWidth={1.6} />
                    </div>
                    <Stars size={26} delay={12 + i * 3} />
                    <div
                      style={{
                        ...titre,
                        marginTop: 22,
                        flex: 1,
                        fontStyle: "italic",
                        fontWeight: 400,
                        fontSize: 30,
                        lineHeight: 1.5,
                        letterSpacing: 0,
                        color: colors.ink,
                        textWrap: "pretty",
                      }}
                    >
                      {vedette ? <CitationLue texte={t.text} lecture={lecture} focus={focus} /> : typo(t.text)}
                    </div>
                    <div style={{ marginTop: 26, paddingTop: 22, borderTop: `1.5px solid ${colors.line}`, display: "flex", alignItems: "center", gap: 16 }}>
                      <div
                        style={{
                          ...titre,
                          width: 54,
                          height: 54,
                          borderRadius: "50%",
                          background: vedette ? interpolateColors(nom, [0, 1], [colors.claySoft, colors.clay]) : colors.claySoft,
                          color: vedette ? interpolateColors(nom, [0, 1], [colors.clayDark, "#ffffff"]) : colors.clayDark,
                          fontSize: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transform: vedette ? `scale(${1 + 0.15 * nom})` : undefined,
                        }}
                      >
                        {t.name.charAt(0)}
                      </div>
                      <div style={{ fontFamily: fonts.sans, fontSize: 25, fontWeight: 750, color: vedette ? interpolateColors(nom, [0, 1], [colors.ink, colors.clayDark]) : colors.ink }}>
                        {t.name}
                      </div>
                    </div>
                  </Card>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** La citation de Léa : les morceaux lus par la voix passent en terracotta foncé, le reste s'efface un peu. */
function CitationLue({ texte, lecture, focus }: { texte: string; lecture: [number, number, number, number]; focus: number }) {
  const frame = useCurrentFrame();
  const t = typo(texte);
  const morceaux = FRAGMENTS_LUS.map(typo);
  // Le texte complet commence par « « » puis les morceaux lus, puis la suite non lue.
  const debut = t.indexOf(morceaux[0]);
  const finLue = t.indexOf(morceaux[2]) + morceaux[2].length;
  if (debut < 0 || finLue < morceaux[2].length) return <>{t}</>;
  const reste = t.slice(finLue);
  return (
    <>
      {t.slice(0, debut)}
      {morceaux.map((m, i) => {
        const allume = interpolate(frame, [lecture[i] - 3, lecture[i] + 5], [0, 1], clamp);
        return (
          <span key={m} style={{ color: interpolateColors(allume, [0, 1], [colors.ink, colors.clayDark]) }}>
            {m}
          </span>
        );
      })}
      <span style={{ opacity: 1 - 0.45 * focus }}>{reste}</span>
    </>
  );
}
