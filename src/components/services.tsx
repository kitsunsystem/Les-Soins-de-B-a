import Link from "next/link";
import { Baby, Clock, Eye, Leaf, Sparkles } from "lucide-react";
import type { Category, Service } from "@/lib/content";

const icons = { leaf: Leaf, sparkles: Sparkles, baby: Baby, eye: Eye };

export function CategoryIcon({ icon, className = "size-6" }: { icon: Category["icon"]; className?: string }) {
  const Icon = icons[icon];
  return <Icon className={className} aria-hidden strokeWidth={1.5} />;
}

export function ServiceCard({ service }: { service: Service }) {
  const bookable = service.durationMinutes !== null;
  return (
    <article className="card flex h-full flex-col p-6 transition-transform duration-300 hover:-translate-y-0.5">
      <h3 className="text-2xl">{service.name}</h3>
      <p className="mt-2 flex-1 text-sm text-ink-soft">{service.description}</p>
      <div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs text-ink-soft">
            <Clock className="size-3.5" aria-hidden />
            {service.durationLabel}
          </p>
          <p className="font-serif text-2xl text-rose-deep">{service.price}</p>
        </div>
        {bookable ? (
          <Link
            href={`/rendez-vous?soin=${service.id}`}
            className="btn btn-outline !px-4 !py-2 text-xs"
            aria-label={`Réserver : ${service.name}`}
          >
            Réserver
          </Link>
        ) : (
          <Link
            href={`/contact?objet=rdv&soin=${service.id}`}
            className="btn btn-outline !px-4 !py-2 text-xs"
            aria-label={`Demander : ${service.name}`}
          >
            Sur demande
          </Link>
        )}
      </div>
    </article>
  );
}
