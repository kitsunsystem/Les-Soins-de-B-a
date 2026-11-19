import { site } from "@/lib/site";

/** Emblème : un lotus (soin, éclosion) surmonté d'un point de lumière (énergie). */
export function LogoMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <circle cx="24" cy="4.8" r="1.9" fill="currentColor" />
      <path
        d="M24 10c5.5 6 7.2 11.7 7.2 16.2 0 4.8-3 8.4-7.2 10.3-4.2-1.9-7.2-5.5-7.2-10.3C16.8 21.7 18.5 16 24 10Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M22.4 36.6c-6.2.6-11.6-2-14.4-7.4 4.4-1.7 9-1.2 12.3 1.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M25.6 36.6c6.2.6 11.6-2 14.4-7.4-4.4-1.7-9-1.2-12.3 1.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M13 41.2c7.3 2 14.7 2 22 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ inverted = false, compact = false }: { inverted?: boolean; compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span
        className={`grid shrink-0 place-items-center rounded-full ${compact ? "size-10" : "size-11 md:size-12"} ${
          inverted ? "bg-linen/10 text-gold" : "bg-forest text-linen"
        }`}
      >
        <LogoMark className={compact ? "size-6" : "size-7"} />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`whitespace-nowrap font-serif text-[1.45rem] md:text-[1.6rem] ${inverted ? "text-linen" : "text-ink"}`}>
          {site.name}
        </span>
        <span
          className={`mt-1.5 whitespace-nowrap text-[0.66rem] font-bold uppercase tracking-[0.22em] ${
            inverted ? "text-gold" : "text-clay"
          }`}
        >
          Bien-être · {site.city}
        </span>
      </span>
    </span>
  );
}

/** Rameau botanique au trait, pour les décors de fond. */
export function Botanical({ className = "" }: { className?: string }) {
  const leaves: [number, number, number][] = [
    [98, 250, -150],
    [101, 214, -30],
    [104, 178, -155],
    [109, 142, -25],
    [116, 106, -160],
    [124, 72, -20],
    [133, 40, -150],
  ];
  return (
    <svg viewBox="0 0 220 300" fill="none" className={className} aria-hidden>
      <path d="M96 298C93 222 101 140 140 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {leaves.map(([x, y, r], i) => (
        <path
          key={i}
          d="M0 0C11-13 33-14 46 0 33 13 11 13 0 0Z"
          transform={`translate(${x} ${y}) rotate(${r})`}
          stroke="currentColor"
          strokeWidth="1.2"
        />
      ))}
    </svg>
  );
}
