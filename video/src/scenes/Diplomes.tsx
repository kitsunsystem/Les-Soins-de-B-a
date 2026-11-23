import { GraduationCap } from "lucide-react";
import { AbsoluteFill, Img, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { diplomes } from "../assets";
import { certificats } from "../script";
import { colors, EASE_IN_OUT, EASE_OUT, fonts, shadows, titre } from "../theme";
import { Accent, clamp, Eyebrow, FadeUp, FondLin, Title } from "../ui";

/** Vue rapprochée : largeur du certificat au centre, écart entre deux certificats. */
const LARGEUR = 820;
const ECART = 760;
/** Vue d'ensemble (les six en rang) : écart et échelle des certificats. */
const ECART_ENSEMBLE = 306;
const ECHELLE_ENSEMBLE = 0.36;
/** Images : passage à la vue rapprochée autour de « magnétisme », glissement autour de chaque nom suivant. */
const ZOOM_AVANT = 16;
const ZOOM_APRES = 8;
const GLISSE_AVANT = 10;
const GLISSE_APRES = 6;

/**
 * Les certificats de Béatrice, sur la voix des certificats : « Formée auprès d'organismes spécialisés, Béatrice a obtenu
 * six certifications » montre les six en rang (`annonce` : image de « six ») ; sur « magnétisme », la vue se rapproche
 * du premier, puis chaque certificat arrive au centre, en grand, quand la voix le nomme (`arrivees` : images de la
 * scène), avec son intitulé et son année ; les voisins restent visibles en retrait, des points indiquent la progression.
 */
export const Diplomes: React.FC<{ duration: number; annonce: number; arrivees: number[] }> = ({ annonce, arrivees }) => {
  const frame = useCurrentFrame();
  const n = certificats.length;
  // 0 : vue d'ensemble ; 1 : vue rapprochée, un certificat au centre.
  const rapproche = interpolate(frame, [arrivees[0] - ZOOM_AVANT, arrivees[0] + ZOOM_APRES], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  // Certificat au centre du carrousel : 0, puis un après l'autre quand la voix les nomme (glissements adoucis).
  let rang = 0;
  for (let k = 1; k < n; k++) {
    rang += interpolate(frame, [arrivees[k] - GLISSE_AVANT, arrivees[k] + GLISSE_APRES], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  }
  // Position sur l'écran : le milieu du rang en vue d'ensemble, puis le certificat en cours. Tailles, intitulés et points
  // suivent `rang` : pendant le rapprochement, seul le premier certificat grandit, sans que les autres grossissent au passage.
  const position = ((n - 1) / 2) * (1 - rapproche) + rang;
  const ecart = ECART_ENSEMBLE + (ECART - ECART_ENSEMBLE) * rapproche;
  const entree = interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: EASE_OUT });
  // « 6 certifications » sous le rang, pendant que la voix le dit, jusqu'au rapprochement.
  const six = interpolate(frame, [annonce - 3, annonce + 6, arrivees[0] - ZOOM_AVANT, arrivees[0] - ZOOM_AVANT + 8], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill>
      <FondLin rameaux={false} sable intensite={0.7} />

      <div style={{ position: "absolute", top: 56, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <FadeUp delay={0} distance={14}>
          <Eyebrow>Son parcours</Eyebrow>
        </FadeUp>
        <FadeUp delay={2}>
          <Title size={64} style={{ marginTop: 12, textAlign: "center" }}>
            Formée et <Accent>certifiée</Accent>
          </Title>
        </FadeUp>
      </div>

      {certificats.map((c, i) => {
        const d = i - position;
        const e = Math.abs(i - rang);
        // Arrivée en rang au début de la scène, l'un après l'autre.
        const apparition = interpolate(frame, [4 + 3 * i, 18 + 3 * i], [0, 1], { ...clamp, easing: EASE_OUT });
        const echelleProche = interpolate(e, [0, 1, 2], [1, 0.6, 0.42], clamp);
        const echelle = ECHELLE_ENSEMBLE + (echelleProche - ECHELLE_ENSEMBLE) * rapproche;
        const opaciteProche = interpolate(e, [0, 1, 1.8, 2.4], [1, 0.55, 0.15, 0], clamp);
        const opacite = (1 + (opaciteProche - 1) * rapproche) * apparition;
        if (opacite <= 0.002) return null;
        const arrivee = arrivees[i] ?? 0;
        // Reflet : une bande de lumière glisse sur la feuille quand elle arrive au centre.
        const reflet = interpolate(frame, [arrivee + 6, arrivee + 36], [-0.25, 1.25], clamp);
        return (
          <div
            key={c.image}
            style={{
              position: "absolute",
              left: 960 - LARGEUR / 2,
              top: 535,
              width: LARGEUR,
              zIndex: 100 - Math.round(e * 10),
              transform: `translate(${d * ecart}px, -50%) translateY(${(1 - apparition) * 30}px) scale(${echelle})`,
              opacity: opacite,
            }}
          >
            <div
              style={{
                position: "relative",
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid rgba(230, 221, 208, 0.9)",
                boxShadow: e < 0.5 && rapproche > 0.5 ? shadows.soft : shadows.card,
              }}
            >
              <Img src={diplomes[c.image]} style={{ display: "block", width: "100%" }} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  // En lumière douce : le papier reste blanc, ce sont l'encre et les sceaux qui brillent au passage.
                  background: `linear-gradient(105deg, transparent ${(reflet - 0.2) * 100}%, rgba(255, 246, 222, 0.95) ${reflet * 100}%, transparent ${(reflet + 0.2) * 100}%)`,
                  mixBlendMode: "soft-light",
                  opacity: reflet > -0.22 && reflet < 1.22 ? 1 : 0,
                }}
              />
            </div>
          </div>
        );
      })}

      {/* « 6 certifications », juste sous le rang, pendant que la voix le dit. */}
      {six > 0 && (
        <div
          style={{
            position: "absolute",
            top: 690,
            left: 0,
            right: 0,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            opacity: six,
            transform: `translateY(${(1 - six) * 12}px)`,
          }}
        >
          <GraduationCap size={34} strokeWidth={1.5} color={colors.forest} />
          <span style={{ ...titre, fontSize: 44, color: colors.ink }}>6 certifications</span>
        </div>
      )}

      {/* Sous la feuille au centre : son intitulé, qui change avec la feuille. */}
      <div style={{ position: "absolute", top: 846, left: 0, right: 0, height: 60 }}>
        {certificats.map((c, i) => {
          const v = interpolate(Math.abs(i - rang), [0, 0.35], [1, 0], clamp) * interpolate(rapproche, [0.6, 1], [0, 1], clamp);
          if (v <= 0) return null;
          return (
            <div
              key={c.image}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                opacity: v,
                transform: `translateY(${(1 - v) * 12}px)`,
              }}
            >
              <GraduationCap size={34} strokeWidth={1.5} color={colors.forest} />
              <span style={{ ...titre, fontSize: 44, color: colors.ink }}>{c.titre}</span>
              <span style={{ fontFamily: fonts.sans, fontSize: 30, color: colors.inkSoft }}>· {c.annee}</span>
            </div>
          );
        })}
      </div>

      {/* Progression : un point par certificat (en vue rapprochée). */}
      <div style={{ position: "absolute", top: 928, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 10, opacity: rapproche }}>
        {certificats.map((c, i) => {
          // Pendant un glissement, les deux points se partagent la pastille : la rangée garde sa largeur.
          const actif = interpolate(Math.abs(i - rang), [0, 1], [1, 0], clamp);
          return (
            <div
              key={c.image}
              style={{
                width: 10 + 22 * actif,
                height: 10,
                borderRadius: 999,
                background: interpolateColors(actif, [0, 1], ["rgba(86, 101, 93, 0.25)", colors.clay]),
              }}
            />
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 46, left: 0, right: 0, textAlign: "center", fontFamily: fonts.sans, fontSize: 21, color: colors.inkSoft, opacity: entree }}>
        Formations professionnelles suivies auprès d’organismes privés spécialisés.
      </div>
    </AbsoluteFill>
  );
};
