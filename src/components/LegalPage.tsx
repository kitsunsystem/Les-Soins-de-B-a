import type { ReactNode } from "react";
import { Ornament } from "./ui";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <section className="py-16 md:py-24">
      <div className="container-page max-w-3xl">
        <h1 className="text-center text-5xl">{title}</h1>
        <Ornament className="mt-5" />
        <p className="mt-4 text-center text-xs text-ink-soft">Dernière mise à jour : {updated}</p>
        <div className="prose-bea card mt-10 p-7 text-[0.95rem] text-ink-soft md:p-10 [&_h2]:text-ink [&_strong]:text-ink">
          {children}
        </div>
      </div>
    </section>
  );
}

/** Marque visiblement une information à compléter par la praticienne. */
export function Todo({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-sage-soft px-1 text-forest-dark">[{children}]</mark>;
}
