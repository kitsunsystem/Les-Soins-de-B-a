import Link from "next/link";
import { ArrowRight, Baby, Clock, Eye, Leaf, Sparkles } from "lucide-react";
import type { Category, CategoryId, Service } from "@/lib/content";

const icons = { leaf: Leaf, sparkles: Sparkles, baby: Baby, eye: Eye };

/** Une couleur par univers de soins, pour se repérer d'un coup d'œil. */
export const tones: Record<CategoryId, { soft: string; text: string; border: string; solid: string }> = {
  corps: { soft: "bg-sage-soft", text: "text-forest", border: "border-sage", solid: "bg-forest" },
  energetique: { soft: "bg-amber-soft", text: "text-[#87601c]", border: "border-gold", solid: "bg-gold" },
  "femmes-bebes": { soft: "bg-blush-soft", text: "text-clay-dark", border: "border-blush", solid: "bg-clay" },
  guidance: { soft: "bg-lavender-soft", text: "text-lavender", border: "border-lavender/50", solid: "bg-lavender" },
};

export function CategoryIcon({ icon, className = "size-6" }: { icon: Category["icon"]; className?: string }) {
  const Icon = icons[icon];
  return <Icon className={className} aria-hidden strokeWidth={1.6} />;
}

export function CategoryBadge({ category, className = "size-14" }: { category: Category; className?: string }) {
  const t = tones[category.id];
  return (
    <span className={`grid shrink-0 place-items-center rounded-2xl ${t.soft} ${t.text} ${className}`}>
      <CategoryIcon icon={category.icon} />
    </span>
  );
}

export function ServiceCard({ service }: { service: Service }) {
  const bookable = service.durationMinutes !== null;
  return (
    <article className="card group flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
      <h3 className="text-[1.45rem]">{service.name}</h3>
      <p className="mt-2 flex-1 text-[0.95rem] text-ink-soft">{service.description}</p>
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex items-center gap-3">
          <span className="font-serif text-[1.65rem] leading-none text-clay">{service.price}</span>
          <span className="flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-ink-soft">
            <Clock className="size-3" aria-hidden />
            {service.durationLabel}
          </span>
        </div>
        {bookable ? (
          <Link
            href={`/rendez-vous?soin=${service.id}`}
            className="btn btn-primary !px-4 !py-2 text-[0.82rem]"
            aria-label={`Réserver : ${service.name}`}
          >
            Réserver
          </Link>
        ) : (
          <Link
            href={`/contact?objet=rdv&soin=${service.id}`}
            className="btn btn-outline !px-4 !py-2 text-[0.82rem]"
            aria-label={`Demander : ${service.name}`}
          >
            Sur demande
          </Link>
        )}
      </div>
    </article>
  );
}

/** Ligne compacte « soin — durée — prix » (accueil, univers). */
export function ServiceLine({ service }: { service: Service }) {
  const href = service.durationMinutes ? `/rendez-vous?soin=${service.id}` : `/contact?objet=rdv&soin=${service.id}`;
  return (
    <li>
      <Link
        href={href}
        className="group flex items-baseline gap-3 rounded-lg py-2 text-[0.95rem] transition-colors hover:text-forest"
      >
        <span className="font-semibold">{service.name}</span>
        <span className="mb-1 flex-1 border-b border-dotted border-ink-soft/30" aria-hidden />
        <span className="whitespace-nowrap text-sm text-ink-soft">{service.durationLabel}</span>
        <span className="w-16 whitespace-nowrap text-right font-serif text-lg text-clay">{service.price}</span>
        <ArrowRight className="size-4 shrink-0 self-center text-forest opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      </Link>
    </li>
  );
}
