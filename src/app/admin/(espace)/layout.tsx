import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = {
  title: "Espace Béa",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-dvh bg-sand/60">
      <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="leading-none">
              <span className="block font-serif text-2xl">Espace Béa</span>
              <span className="text-xs text-ink-soft">Rendez-vous & disponibilités</span>
            </Link>
            <AdminNav />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" target="_blank" className="btn btn-outline !px-3 !py-1.5 text-xs">
              <ExternalLink className="size-3.5" aria-hidden />
              Voir le site
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-outline !px-3 !py-1.5 text-xs">
                <LogOut className="size-3.5" aria-hidden />
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}
