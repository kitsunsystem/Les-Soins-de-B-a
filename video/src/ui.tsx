// Briques visuelles reprises du site (src/components/brand.tsx, ui.tsx, services.tsx, globals.css).
import { Fragment, type CSSProperties, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Category } from "../../src/lib/content";
import { colors, EASE_IN_OUT, EASE_OUT, FONDU, fonts, shadows, titre, tones } from "./theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Typographie française pour l'écran : apostrophes courbes. */
export function typo(text: string) {
  return text.replace(/'/g, "’");
}

/** Dégradé radial à décroissance douce (proche du flou « blur-3xl » du site, sans filtre coûteux). */
export function halo(rgb: string, alpha: number) {
  const stops = [
    [0, 1],
    [14, 0.9],
    [28, 0.7],
    [42, 0.45],
    [55, 0.22],
    [66, 0.08],
    [74, 0],
  ];
  return `radial-gradient(circle, ${stops.map(([p, k]) => `rgba(${rgb}, ${(alpha * k).toFixed(3)}) ${p}%`).join(", ")})`;
}

/** Progression 0 → 1 d'une apparition qui démarre à `delay` (courbe du site). */
export function useAppear(delay = 0, duration = 18) {
  const frame = useCurrentFrame();
  return interpolate(frame - delay, [0, duration], [0, 1], { ...clamp, easing: EASE_OUT });
}

/** L'animation « fade-up » du site : fondu + légère remontée. */
export function FadeUp({
  delay = 0,
  duration = 18,
  distance = 26,
  style,
  children,
}: {
  delay?: number;
  duration?: number;
  distance?: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const p = useAppear(delay, duration);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * distance}px)`, ...style }}>{children}</div>;
}

/** Apparition mot à mot (les espaces insécables restent attachés au mot). */
export function WordsUp({ text, delay = 0, stagger = 3, duration = 18 }: { text: string; delay?: number; stagger?: number; duration?: number }) {
  const frame = useCurrentFrame();
  const words = typo(text).split(" ");
  return (
    <>
      {words.map((w, i) => {
        const p = interpolate(frame - delay - i * stagger, [0, duration], [0, 1], { ...clamp, easing: EASE_OUT });
        return (
          <Fragment key={i}>
            <span style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>{w}</span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        );
      })}
    </>
  );
}

/**
 * Enveloppe d'une scène : fondu d'entrée, puis fondu de sortie vers le fond lin.
 * Les deux fondus ne se chevauchent pas : le texte de deux scènes n'est jamais superposé.
 */
export function Fondu({ duration, entree = true, sortie = true, children }: { duration: number; entree?: boolean; sortie?: boolean; children: ReactNode }) {
  const frame = useCurrentFrame();
  const opIn = entree ? interpolate(frame, [0, FONDU], [0, 1], { ...clamp, easing: EASE_IN_OUT }) : 1;
  const opOut = sortie ? interpolate(frame, [duration - FONDU, duration], [1, 0], { ...clamp, easing: EASE_IN_OUT }) : 1;
  return <AbsoluteFill style={{ opacity: Math.min(opIn, opOut) }}>{children}</AbsoluteFill>;
}

/** Emblème du site : un lotus surmonté d'un point de lumière. `trace` dessine le trait de 0 à 1. */
export function LogoMark({ size = 48, color = "currentColor", trace = 1 }: { size?: number; color?: string; trace?: number }) {
  const dash = { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - trace };
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="4.8" r="1.9" fill={color} opacity={trace} />
      <path
        d="M24 10c5.5 6 7.2 11.7 7.2 16.2 0 4.8-3 8.4-7.2 10.3-4.2-1.9-7.2-5.5-7.2-10.3C16.8 21.7 18.5 16 24 10Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
        {...dash}
      />
      <path d="M22.4 36.6c-6.2.6-11.6-2-14.4-7.4 4.4-1.7 9-1.2 12.3 1.4" stroke={color} strokeWidth="1.7" strokeLinecap="round" {...dash} />
      <path d="M25.6 36.6c6.2.6 11.6-2 14.4-7.4-4.4-1.7-9-1.2-12.3 1.4" stroke={color} strokeWidth="1.7" strokeLinecap="round" {...dash} />
      <path d="M13 41.2c7.3 2 14.7 2 22 0" stroke={color} strokeWidth="1.7" strokeLinecap="round" {...dash} />
    </svg>
  );
}

/** Pastille de l'emblème (fond vert forêt, lotus lin), comme l'en-tête du site. */
export function LogoBadge({ size = 96, trace = 1, inverse = false }: { size?: number; trace?: number; inverse?: boolean }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: inverse ? "rgba(248, 244, 238, 0.1)" : colors.forest,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <LogoMark size={size * 0.58} color={inverse ? colors.gold : colors.linen} trace={trace} />
    </div>
  );
}

const FEUILLES: [number, number, number][] = [
  [98, 250, -150],
  [101, 214, -30],
  [104, 178, -155],
  [109, 142, -25],
  [116, 106, -160],
  [124, 72, -20],
  [133, 40, -150],
];

/** Rameau botanique au trait (décor du site), qui se balance doucement. */
export function Botanical({
  height = 300,
  color = colors.forest,
  opacity = 0.18,
  flip = false,
  rotate = 0,
  trace = 1,
  style,
}: {
  height?: number;
  color?: string;
  opacity?: number;
  flip?: boolean;
  rotate?: number;
  trace?: number;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame / 38) * 1.6;
  const dash = { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - trace };
  return (
    <svg
      width={(height * 220) / 300}
      height={height}
      viewBox="0 0 220 300"
      fill="none"
      aria-hidden
      style={{
        position: "absolute",
        opacity,
        transform: `rotate(${rotate + sway}deg) scaleX(${flip ? -1 : 1})`,
        transformOrigin: "45% 100%",
        ...style,
      }}
    >
      <path d="M96 298C93 222 101 140 140 14" stroke={color} strokeWidth="1.3" strokeLinecap="round" {...dash} />
      {FEUILLES.map(([x, y, r], i) => (
        <path
          key={i}
          d="M0 0C11-13 33-14 46 0 33 13 11 13 0 0Z"
          transform={`translate(${x} ${y}) rotate(${r})`}
          stroke={color}
          strokeWidth="1.2"
          {...dash}
        />
      ))}
    </svg>
  );
}

/** Ornement du site : filet doré — lotus — filet doré. */
export function Ornament({ delay = 0, style }: { delay?: number; style?: CSSProperties }) {
  const p = useAppear(delay, 24);
  const filet: CSSProperties = { height: 2, width: 64, background: "rgba(194, 154, 79, 0.5)" };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, color: colors.gold, ...style }}>
      <div style={{ ...filet, transform: `scaleX(${p})`, transformOrigin: "right" }} />
      <LogoMark size={32} trace={p} />
      <div style={{ ...filet, transform: `scaleX(${p})`, transformOrigin: "left" }} />
    </div>
  );
}

/** Sur-titre du site (.eyebrow) : capitales espacées terracotta, précédées d'un trait. */
export function Eyebrow({ children, size = 23, color = colors.clay, style }: { children: ReactNode; size?: number; color?: string; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.62,
        fontFamily: fonts.sans,
        fontSize: size,
        fontWeight: 750,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color,
        ...style,
      }}
    >
      <span style={{ width: size * 1.65, height: 2, background: color, opacity: 0.6 }} />
      {children}
    </div>
  );
}

/** Mot mis en valeur dans un titre (.accent) : italique terracotta. */
export function Accent({ children, color = colors.clay }: { children: ReactNode; color?: string }) {
  return <span style={{ fontStyle: "italic", color }}>{typeof children === "string" ? typo(children) : children}</span>;
}

export function Title({ children, size = 84, color = colors.ink, style }: { children: ReactNode; size?: number; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ ...titre, color, fontSize: size, textWrap: "balance", ...style }}>
      {typeof children === "string" ? typo(children) : children}
    </div>
  );
}

export function Body({ children, size = 29, color = colors.inkSoft, style }: { children: ReactNode; size?: number; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ fontFamily: fonts.sans, color, fontSize: size, lineHeight: 1.62, textWrap: "pretty", ...style }}>
      {typeof children === "string" ? typo(children) : children}
    </div>
  );
}

/** En-tête de section du site : sur-titre, titre, intro. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  delay = 0,
  titleSize = 84,
  align = "center",
  style,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  delay?: number;
  titleSize?: number;
  align?: "center" | "left";
  style?: CSSProperties;
}) {
  const center = align === "center";
  return (
    <div style={{ textAlign: center ? "center" : "left", ...style }}>
      {eyebrow && (
        <FadeUp delay={delay} distance={16}>
          <Eyebrow>{typo(eyebrow)}</Eyebrow>
        </FadeUp>
      )}
      <FadeUp delay={delay + 3}>
        <Title size={titleSize} style={{ marginTop: 18 }}>
          {title}
        </Title>
      </FadeUp>
      {intro && (
        <FadeUp delay={delay + 7}>
          <Body size={28} style={{ marginTop: 22, ...(center ? { marginInline: "auto", maxWidth: 1100 } : {}) }}>
            {intro}
          </Body>
        </FadeUp>
      )}
    </div>
  );
}

/** La « card » du site. */
export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: colors.card,
        borderRadius: 38,
        border: "1.5px solid rgba(230, 221, 208, 0.85)",
        boxShadow: shadows.card,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Pastille d'univers (carré arrondi teinté). */
export function CategoryBadge({
  category,
  icon: Icon,
  size = 92,
  surface,
}: {
  category: Category;
  icon: LucideIcon;
  size?: number;
  surface?: string;
}) {
  const t = tones[category.id];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: surface ?? t.soft,
        color: t.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={Math.round(size * 0.44)} strokeWidth={1.6} />
    </div>
  );
}

/** Icône dans un rond (sauge pâle + vert forêt par défaut). */
export function IconCircle({
  icon: Icon,
  size = 88,
  background = colors.sageSoft,
  color = colors.forest,
  style,
}: {
  icon: LucideIcon;
  size?: number;
  background?: string;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      <Icon size={Math.round(size * 0.42)} strokeWidth={1.5} />
    </div>
  );
}

type Variante = "primary" | "accent" | "outline" | "outlineLight";

/** Boutons « pilule » du site (.btn-primary, .btn-accent, .btn-outline). */
export function Button({
  variant = "primary",
  icon: Icon,
  iconRight,
  children,
  scale = 1,
  style,
}: {
  variant?: Variante;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  children: ReactNode;
  scale?: number;
  style?: CSSProperties;
}) {
  const IconRight = iconRight;
  const v: Record<Variante, CSSProperties> = {
    primary: { background: colors.forest, color: "#fff", boxShadow: shadows.soft },
    accent: { background: colors.clay, color: "#fff", boxShadow: shadows.soft },
    outline: { border: "2px solid rgba(52, 84, 69, 0.28)", background: "rgba(255, 255, 255, 0.55)", color: colors.forestDark },
    outlineLight: { border: "2px solid rgba(248, 244, 238, 0.32)", color: colors.linen },
  };
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14 * scale,
        borderRadius: 999,
        padding: `${24 * scale}px ${46 * scale}px`,
        fontFamily: fonts.sans,
        fontWeight: 650,
        fontSize: 27 * scale,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
        ...v[variant],
        ...style,
      }}
    >
      {Icon && <Icon size={Math.round(28 * scale)} strokeWidth={1.9} />}
      {children}
      {IconRight && <IconRight size={Math.round(26 * scale)} strokeWidth={2} />}
    </div>
  );
}

/** Puce arrondie. */
export function Pill({
  icon: Icon,
  children,
  background = colors.card,
  color = colors.inkSoft,
  border = colors.line,
  size = 22,
  style,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  background?: string;
  color?: string;
  border?: string;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.5,
        borderRadius: 999,
        border: `1.5px solid ${border}`,
        background,
        color,
        padding: `${size * 0.52}px ${size * 1.05}px`,
        fontFamily: fonts.sans,
        fontSize: size,
        fontWeight: 650,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {Icon && <Icon size={Math.round(size * 1.05)} strokeWidth={1.7} />}
      {children}
    </div>
  );
}

const ETOILE =
  "M12 1 L14.7 8.28 L22.46 8.6 L16.38 13.42 L18.47 20.9 L12 16.6 L5.53 20.9 L7.62 13.42 L1.54 8.6 L9.3 8.28 Z";

/** Les 5 étoiles dorées. */
export function Stars({ size = 26, delay = 0, gap = 6 }: { size?: number; delay?: number; gap?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", gap }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const s = spring({ frame: frame - delay - i * 2, fps, config: { damping: 12, stiffness: 190, mass: 0.6 } });
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{ transform: `scale(${s})` }} aria-hidden>
            <path d={ETOILE} fill={colors.gold} stroke={colors.gold} strokeWidth={1.1} strokeLinejoin="round" />
          </svg>
        );
      })}
    </div>
  );
}

/** Fond des en-têtes du site : lin, halo sauge en haut à gauche et halo terracotta à droite, rameaux au trait. */
export function FondLin({
  rameaux = true,
  sable = false,
  intensite = 1,
  trace = 1,
}: {
  rameaux?: boolean;
  sable?: boolean;
  intensite?: number;
  /** Dessin progressif des rameaux (0 → 1). */
  trace?: number;
}) {
  const frame = useCurrentFrame();
  const dx = Math.sin(frame / 80) * 30;
  const dy = Math.cos(frame / 95) * 24;
  return (
    <AbsoluteFill style={{ background: sable ? colors.sand : colors.linen, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -560 + dx, top: -640 + dy, width: 1500, height: 1500, background: halo("226, 236, 226", 0.95 * intensite) }} />
      <div style={{ position: "absolute", right: -520 - dx, top: -120 - dy, width: 1300, height: 1300, background: halo("245, 225, 212", 0.85 * intensite) }} />
      {rameaux && (
        <>
          <Botanical height={420} color={colors.forest} opacity={0.16} trace={trace} style={{ right: 40, bottom: -24 }} />
          <Botanical height={320} color={colors.clay} opacity={0.15} trace={trace} flip style={{ left: -30, top: 40 }} />
        </>
      )}
    </AbsoluteFill>
  );
}
