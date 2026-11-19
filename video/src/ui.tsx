// Briques visuelles reprises du site (src/components/ui.tsx, globals.css), adaptées à la vidéo.
import { Fragment, type CSSProperties, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AbsoluteFill, Img, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { images } from "./assets";
import { colors, EASE_OUT, fonts, shadows } from "./theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Typographie française pour l'écran : apostrophes courbes (’) à la place des apostrophes droites. */
export function typo(text: string) {
  return text.replace(/'/g, "’");
}

/** Dégradé radial à décroissance douce (proche d'un flou gaussien, sans filtre coûteux). */
export function halo(rgb: string, alpha: number) {
  const stops = [
    [0, 1],
    [12, 0.92],
    [25, 0.72],
    [38, 0.46],
    [50, 0.24],
    [61, 0.1],
    [71, 0],
  ];
  return `radial-gradient(circle, ${stops.map(([pos, k]) => `rgba(${rgb}, ${(alpha * k).toFixed(3)}) ${pos}%`).join(", ")})`;
}

/** Progression 0 → 1 d'une apparition qui démarre à `delay` (courbe du site). */
export function useAppear(delay = 0, duration = 26) {
  const frame = useCurrentFrame();
  return interpolate(frame - delay, [0, duration], [0, 1], { ...clamp, easing: EASE_OUT });
}

/** L'animation « fade-up » du site : fondu + légère remontée. */
export function FadeUp({
  delay = 0,
  duration = 26,
  distance = 34,
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
export function WordsUp({
  text,
  delay = 0,
  stagger = 4,
  duration = 26,
  distance = 28,
}: {
  text: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  distance?: number;
}) {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => {
        const p = interpolate(frame - delay - i * stagger, [0, duration], [0, 1], { ...clamp, easing: EASE_OUT });
        return (
          <Fragment key={i}>
            <span style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * distance}px)` }}>
              {w}
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        );
      })}
    </>
  );
}

/** Titre révélé par un balayage doux de gauche à droite (garde le crénage de la police). */
export function SweepReveal({
  delay = 0,
  duration = 42,
  style,
  children,
}: {
  delay?: number;
  duration?: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const p = useAppear(delay, duration);
  const edge = -25 + p * 150;
  const mask = `linear-gradient(90deg, #000 ${edge - 25}%, transparent ${edge}%)`;
  return (
    <div
      style={{
        WebkitMaskImage: mask,
        maskImage: mask,
        transform: `translateY(${(1 - p) * 26}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Étoile à quatre branches (le « ✦ » de l'ornement du site). */
export function Sparkle({ size = 22, color = colors.gold, style }: { size?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden>
      <path d="M12 0 Q13.4 10.6 24 12 Q13.4 13.4 12 24 Q10.6 13.4 0 12 Q10.6 10.6 12 0Z" fill={color} />
    </svg>
  );
}

/** Ornement doré du site : filet — ✦ — filet. */
export function Ornament({
  delay = 0,
  lineWidth = 80,
  align = "center",
  style,
}: {
  delay?: number;
  lineWidth?: number;
  align?: "center" | "left";
  style?: CSSProperties;
}) {
  const p = useAppear(delay, 36);
  const line: CSSProperties = { height: 2, width: lineWidth, background: "rgba(191, 157, 95, 0.55)" };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap: 18,
        ...style,
      }}
    >
      <div style={{ ...line, transform: `scaleX(${p})`, transformOrigin: "right" }} />
      <Sparkle style={{ opacity: p, transform: `rotate(${(1 - p) * -120}deg) scale(${0.3 + 0.7 * p})` }} />
      <div style={{ ...line, transform: `scaleX(${p})`, transformOrigin: "left" }} />
    </div>
  );
}

export function Eyebrow({ children, size = 48, style }: { children: ReactNode; size?: number; style?: CSSProperties }) {
  return (
    <div style={{ fontFamily: fonts.script, fontWeight: 500, color: colors.roseDeep, fontSize: size, lineHeight: 1.2, ...style }}>
      {children}
    </div>
  );
}

export function Title({ children, size = 88, style }: { children: ReactNode; size?: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: fonts.serif,
        fontWeight: 500,
        color: colors.ink,
        fontSize: size,
        lineHeight: 1.12,
        textWrap: "balance",
        ...style,
      }}
    >
      {typeof children === "string" ? typo(children) : children}
    </div>
  );
}

export function Body({ children, size = 28, style }: { children: ReactNode; size?: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: fonts.sans,
        color: colors.inkSoft,
        fontSize: size,
        lineHeight: 1.65,
        textWrap: "pretty",
        ...style,
      }}
    >
      {typeof children === "string" ? typo(children) : children}
    </div>
  );
}

/** En-tête de section centré du site : petit titre manuscrit, titre, ornement. */
export function SectionHeading({
  eyebrow,
  title,
  delay = 0,
  titleSize = 88,
  style,
}: {
  eyebrow?: string;
  title: ReactNode;
  delay?: number;
  titleSize?: number;
  style?: CSSProperties;
}) {
  return (
    <div style={{ textAlign: "center", ...style }}>
      {eyebrow && (
        <FadeUp delay={delay}>
          <Eyebrow>{typo(eyebrow)}</Eyebrow>
        </FadeUp>
      )}
      <FadeUp delay={delay + 6}>
        <Title size={titleSize} style={{ marginTop: 6 }}>
          {title}
        </Title>
      </FadeUp>
      <Ornament delay={delay + 14} style={{ marginTop: 30 }} />
    </div>
  );
}

/** La « card » du site : fond crème clair, coins arrondis, bordure et ombre douces. */
export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: colors.card,
        borderRadius: 32,
        border: "1.5px solid rgba(232, 220, 207, 0.75)",
        boxShadow: shadows.card,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Pastille ronde avec icône (rose pâle + icône rose foncé, comme sur le site). */
export function IconBadge({
  icon: Icon,
  size = 96,
  background = colors.roseSoft,
  color = colors.roseDeep,
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

/** Boutons « pilule » du site (.btn-primary / .btn-outline). */
export function Button({
  variant = "primary",
  icon: Icon,
  children,
  scale = 1,
  style,
}: {
  variant?: "primary" | "outline";
  icon?: LucideIcon;
  children: ReactNode;
  scale?: number;
  style?: CSSProperties;
}) {
  const primary = variant === "primary";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14 * scale,
        borderRadius: 999,
        padding: `${22 * scale}px ${46 * scale}px`,
        fontFamily: fonts.sans,
        fontWeight: 500,
        fontSize: 26 * scale,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        ...(primary
          ? { background: colors.roseDeep, color: "#fff", boxShadow: shadows.soft }
          : {
              border: `1.5px solid ${colors.line}`,
              background: "rgba(255, 255, 255, 0.65)",
              color: colors.ink,
            }),
        ...style,
      }}
    >
      {Icon && <Icon size={Math.round(27 * scale)} strokeWidth={1.75} />}
      {children}
    </div>
  );
}

/** Puce arrondie (barre de navigation des univers sur la page Soins). */
export function Pill({
  icon: Icon,
  children,
  active = false,
  size = 22,
  style,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  active?: boolean;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.55,
        borderRadius: 999,
        border: `1.5px solid ${active ? colors.roseDeep : colors.line}`,
        background: active ? colors.roseDeep : colors.card,
        color: active ? "#fff" : colors.inkSoft,
        padding: `${size * 0.6}px ${size * 1.2}px`,
        fontFamily: fonts.sans,
        fontSize: size,
        fontWeight: active ? 500 : 400,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {Icon && <Icon size={Math.round(size * 1.05)} strokeWidth={1.5} />}
      {children}
    </div>
  );
}

const STAR_PATH =
  "M12 1 L14.7 8.28 L22.46 8.6 L16.38 13.42 L18.47 20.9 L12 16.6 L5.53 20.9 L7.62 13.42 L1.54 8.6 L9.3 8.28 Z";

/** Les 5 étoiles dorées des témoignages. */
export function Stars({ size = 26, delay = 0, gap = 7 }: { size?: number; delay?: number; gap?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", gap }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const s = spring({ frame: frame - delay - i * 3, fps, config: { damping: 11, stiffness: 170, mass: 0.6 } });
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{ transform: `scale(${s})` }} aria-hidden>
            <path d={STAR_PATH} fill={colors.gold} stroke={colors.gold} strokeWidth={1.2} strokeLinejoin="round" />
          </svg>
        );
      })}
    </div>
  );
}

/** Le logo du site (icon.svg) : pastille rose pâle, cercle doré, « B » à empattements. */
export function Logo({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="31" fill={colors.roseSoft} />
      <circle cx="32" cy="32" r="27" fill="none" stroke={colors.gold} strokeWidth="1.2" />
      <text
        x="32"
        y="43"
        textAnchor="middle"
        fontFamily={fonts.serif}
        fontWeight={500}
        fontSize="32"
        fill={colors.roseDeep}
      >
        B
      </text>
    </svg>
  );
}

/**
 * Fond aquarelle du site (hero-bg.webp) avec un lent zoom.
 * - "hero" : plein cadre, comme l'accueil ;
 * - "page" : en haut de l'image, comme les en-têtes de pages intérieures.
 */
export function Watercolor({
  duration,
  variant = "hero",
  zoom = [1.03, 1.1],
}: {
  duration: number;
  variant?: "hero" | "page";
  zoom?: [number, number];
}) {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, duration], zoom, clamp);
  if (variant === "page") {
    return (
      <AbsoluteFill style={{ background: colors.cream }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "78%", overflow: "hidden" }}>
          <Img
            src={images.heroBg}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.8,
              transform: `scale(${s})`,
              transformOrigin: "60% 30%",
            }}
          />
          <AbsoluteFill
            style={{
              background: `linear-gradient(to bottom, rgba(248,242,236,0.25), rgba(248,242,236,0.4) 45%, ${colors.cream})`,
            }}
          />
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: colors.cream, overflow: "hidden" }}>
      <Img
        src={images.heroBg}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s})`, transformOrigin: "55% 45%" }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(248,242,236,0.12), rgba(248,242,236,0) 45%, rgba(248,242,236,0.55))",
        }}
      />
    </AbsoluteFill>
  );
}

/**
 * Taches de couleur floues du bandeau d'appel à l'action du site (rose, et sauge en option),
 * qui dérivent doucement.
 */
export function SoftBlobs({ intensity = 1, sauge = true }: { intensity?: number; sauge?: boolean }) {
  const frame = useCurrentFrame();
  const dx = Math.sin(frame / 70) * 40;
  const dy = Math.cos(frame / 90) * 30;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: -700 + dx,
          top: -760 + dy,
          width: 1800,
          height: 1800,
          background: halo("217, 168, 160", 0.36 * intensity),
        }}
      />
      {sauge && (
        <div
          style={{
            position: "absolute",
            right: -760 - dx,
            bottom: -820 - dy,
            width: 1800,
            height: 1800,
            background: halo("147, 171, 154", 0.2 * intensity),
          }}
        />
      )}
    </AbsoluteFill>
  );
}

/** Petites lueurs dorées qui montent lentement (évoque l'énergie, très discret). */
export function GoldDust({ count = 18, seed = "or", opacity = 1 }: { count?: number; seed?: string; opacity?: number }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      {Array.from({ length: count }, (_, i) => {
        const size = 14 + random(`${seed}-s-${i}`) * 22;
        const speed = 0.3 + random(`${seed}-v-${i}`) * 0.7;
        const span = height + 160;
        const y = ((random(`${seed}-y-${i}`) * span - frame * speed) % span + span) % span - 80;
        const x = random(`${seed}-x-${i}`) * width + Math.sin(frame / 45 + i * 1.7) * 26;
        const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frame / (16 + (i % 5) * 5) + i * 2.1));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              opacity: twinkle * 0.85,
              background: halo("236, 210, 150", 0.9),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}
