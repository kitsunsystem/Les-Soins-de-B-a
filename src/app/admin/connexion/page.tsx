import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminPasswordConfigured, isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion — Espace Béa", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="grid min-h-dvh place-items-center bg-sand px-4">
      <div className="card w-full max-w-sm p-8">
        <p className="text-center font-serif text-3xl">Les Soins de Béa</p>
        <p className="mt-2 text-center"><span className="eyebrow">Espace praticienne</span></p>
        {adminPasswordConfigured() ? (
          <LoginForm />
        ) : (
          <p className="mt-6 rounded-xl bg-sage-soft p-4 text-sm text-forest-dark">
            Aucun mot de passe n&apos;est configuré. Définissez la variable d&apos;environnement{" "}
            <code>ADMIN_PASSWORD</code> (voir README).
          </p>
        )}
      </div>
    </main>
  );
}
