import { Quote } from "lucide-react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { temoignages } from "../script";
import { colors, EASE_IN_OUT, fonts, shadows, titre } from "../theme";
import { Accent, Body, Card, clamp, FadeUp, FondLin, SectionHeading, Stars, typo } from "../ui";

/** Morceaux de chaque message lus par la voix : chacun s'allume quand il est prononcé. */
const FRAGMENTS_LUS: Record<string, string[]> = {
  Léa: ["Un moment suspendu, ", "d'évasion, ", "de liberté."],
  Val: ["vous êtes ", "une vraie fée."],
  Sarah: ["une pépite ", "avec des mains ", "et un cœur en or"],
};

type Lecture = {
  auteur: string;
  /** Images de scène où la voix commence chaque morceau lu. */
  fragments: number[];
  /** Image de scène de « écrit Léa », « ajoute Val », « confie Sarah ». */
  signature: number;
};

/**
 * Section « Livre d'or » de l'accueil. La voix lit trois messages l'un après l'autre : la carte lue s'avance,
 * ses mots s'allument au fil de la lecture, puis le nom de son autrice ; les autres cartes restent visibles en retrait.
 */
export const Temoignages: React.FC<{ duration: number; lectures: Lecture[] }> = ({ lectures }) => {
  const frame = useCurrentFrame();
  const focus = (auteur: string) => {
    const i = lectures.findIndex((l) => l.auteur === auteur);
    if (i < 0) return 0;
    const debut = lectures[i].fragments[0];
    const suivant = lectures[i + 1]?.fragments[0] ?? 1e9;
    return interpolate(frame, [debut - 8, debut + 6, suivant - 8, suivant + 6], [0, 1, 1, 0], { ...clamp, easing: EASE_IN_OUT });
  };
  const actif = Math.max(...temoignages.map((t) => focus(t.name)));

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
            const lecture = lectures.find((l) => l.auteur === t.name);
            const f = focus(t.name);
            const recul = actif - f;
            // Sur « écrit Léa »… : la pastille et le prénom passent en terracotta et y restent ; seule la taille pulse.
            const signe = lecture ? interpolate(frame, [lecture.signature - 3, lecture.signature + 4], [0, 1], clamp) : 0;
            const impulsion = lecture ? interpolate(frame, [lecture.signature - 3, lecture.signature + 4, lecture.signature + 16], [0, 1, 0.4], clamp) : 0;
            return (
              <FadeUp key={t.name} delay={8 + i * 3} style={{ display: "flex", zIndex: f > 0.5 ? 1 : 0 }}>
                <div
                  style={{
                    display: "flex",
                    opacity: 1 - 0.42 * recul,
                    transform: `translateY(${-18 * f}px) scale(${1 + 0.06 * f - 0.03 * recul})`,
                  }}
                >
                  <Card
                    style={{
                      position: "relative",
                      width: 520,
                      padding: "42px 44px 34px",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: f > 0.3 ? shadows.soft : undefined,
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
                      {lecture ? <CitationLue texte={t.text} morceaux={FRAGMENTS_LUS[t.name] ?? []} instants={lecture.fragments} focus={f} /> : typo(t.text)}
                    </div>
                    <div style={{ marginTop: 26, paddingTop: 22, borderTop: `1.5px solid ${colors.line}`, display: "flex", alignItems: "center", gap: 16 }}>
                      <div
                        style={{
                          ...titre,
                          width: 54,
                          height: 54,
                          borderRadius: "50%",
                          background: interpolateColors(signe, [0, 1], [colors.claySoft, colors.clay]),
                          color: interpolateColors(signe, [0, 1], [colors.clayDark, "#ffffff"]),
                          fontSize: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transform: `scale(${1 + 0.15 * impulsion})`,
                        }}
                      >
                        {t.name.charAt(0)}
                      </div>
                      <div style={{ fontFamily: fonts.sans, fontSize: 25, fontWeight: 750, color: interpolateColors(signe, [0, 1], [colors.ink, colors.clayDark]) }}>
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

/** Un message du livre d'or : les morceaux lus passent en terracotta foncé, le reste s'efface un peu pendant la lecture. */
function CitationLue({ texte, morceaux, instants, focus }: { texte: string; morceaux: string[]; instants: number[]; focus: number }) {
  const frame = useCurrentFrame();
  const t = typo(texte);
  const lus = morceaux.map(typo);
  // Les morceaux lus se suivent dans le message : on les retrouve d'un bloc.
  const debut = t.indexOf(lus.join(""));
  if (debut < 0 || lus.length === 0) return <>{t}</>;
  const fin = debut + lus.join("").length;
  // Seul le texte non lu s'efface (pas les guillemets qui encadrent un passage lu).
  const efface = (morceau: string) => ({ opacity: /\p{L}/u.test(morceau) ? 1 - 0.45 * focus : 1 });
  return (
    <>
      <span style={efface(t.slice(0, debut))}>{t.slice(0, debut)}</span>
      {lus.map((m, i) => {
        const allume = interpolate(frame, [instants[i] - 3, instants[i] + 5], [0, 1], clamp);
        return (
          <span key={m} style={{ color: interpolateColors(allume, [0, 1], [colors.ink, colors.clayDark]) }}>
            {m}
          </span>
        );
      })}
      <span style={efface(t.slice(fin))}>{t.slice(fin)}</span>
    </>
  );
}
