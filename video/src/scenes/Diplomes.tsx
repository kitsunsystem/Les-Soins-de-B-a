import { GraduationCap } from "lucide-react";
import { AbsoluteFill, Img, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { diplomes } from "../assets";
import { certificats } from "../script";
import { colors, EASE_IN_OUT, EASE_OUT, FONDU, fonts, shadows, titre } from "../theme";
import { Accent, clamp, Eyebrow, FadeUp, FondLin, Title } from "../ui";

/** Largeur du certificat au centre ; écart entre deux certificats du carrousel. */
const LARGEUR = 820;
const ECART = 760;
/** Images : premier certificat en place, durée d'un glissement vers le certificat suivant. */
const DEBUT = 12;
const GLISSE = 18;

/**
 * Nombre d'images pendant lesquelles chaque certificat est au centre : la scène est partagée également, le dernier
 * restant jusqu'au fondu de sortie. Même calcul dans scripts/generate-music.py (une note de carillon par certificat).
 */
const pas = (duree: number, n: number) => Math.floor((duree - DEBUT - FONDU) / n);
/** Image où le certificat i arrive au centre. */
const auCentre = (i: number, p: number) => DEBUT + i * p;

/**
 * Les certificats de Béatrice, un par un, pendant un silence de la voix après sa présentation : un carrousel amène
 * chaque feuille au centre, en grand (le magnétisme d'abord), avec son intitulé et son année ; les voisines restent
 * visibles en retrait, et des points indiquent la progression.
 */
export const Diplomes: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const n = certificats.length;
  const p = pas(duration, n);
  // Position du carrousel : 0 sur le premier certificat, 1 sur le deuxième… (glissements adoucis).
  let position = 0;
  for (let k = 1; k < n; k++) {
    position += interpolate(frame, [auCentre(k, p) - GLISSE, auCentre(k, p)], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  }
  const entree = interpolate(frame, [0, DEBUT], [0, 1], { ...clamp, easing: EASE_OUT });

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

      {/* Carrousel : la feuille au centre en grand, les voisines plus petites et estompées. */}
      {certificats.map((c, i) => {
        const d = i - position;
        const ecart = Math.abs(d);
        if (ecart > 2.4) return null;
        const echelle = interpolate(ecart, [0, 1, 2], [1, 0.6, 0.42], clamp);
        const opacite = interpolate(ecart, [0, 1, 1.8, 2.4], [1, 0.55, 0.15, 0], clamp) * entree;
        // Reflet : une bande de lumière glisse sur la feuille pendant qu'elle est au centre.
        const reflet = interpolate(frame, [auCentre(i, p) + 4, auCentre(i, p) + 34], [-0.25, 1.25], clamp);
        return (
          <div
            key={c.image}
            style={{
              position: "absolute",
              left: 960 - LARGEUR / 2,
              top: 535,
              width: LARGEUR,
              zIndex: 100 - Math.round(ecart * 10),
              transform: `translate(${d * ECART}px, -50%) translateY(${(1 - entree) * 36}px) scale(${echelle})`,
              opacity: opacite,
            }}
          >
            <div
              style={{
                position: "relative",
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid rgba(230, 221, 208, 0.9)",
                boxShadow: ecart < 0.5 ? shadows.soft : shadows.card,
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

      {/* Intitulé du certificat au centre : il change avec la feuille. */}
      <div style={{ position: "absolute", top: 846, left: 0, right: 0, height: 60, opacity: entree }}>
        {certificats.map((c, i) => {
          const v = interpolate(Math.abs(i - position), [0, 0.35], [1, 0], clamp);
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

      {/* Progression : un point par certificat. */}
      <div style={{ position: "absolute", top: 928, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 10, opacity: entree }}>
        {certificats.map((c, i) => {
          // Pendant un glissement, les deux points se partagent la pastille : la rangée garde sa largeur.
          const actif = interpolate(Math.abs(i - position), [0, 1], [1, 0], clamp);
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
