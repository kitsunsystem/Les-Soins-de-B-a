import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-linen px-4 text-center">
      <div>
        <p className="eyebrow">Page introuvable</p>
        <h1 className="mt-2 text-5xl">Cette page n&apos;existe pas</h1>
        <p className="mt-4 text-ink-soft">Elle a peut-être été déplacée. Revenons en douceur à l&apos;accueil.</p>
        <Link href="/" className="btn btn-primary mt-8">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
