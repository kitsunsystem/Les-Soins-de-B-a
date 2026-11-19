// Fichiers importés comme ressources par le bundler de Remotion (ils deviennent des URL).
declare module "*.webp" {
  const src: string;
  export default src;
}
declare module "*.jpg" {
  const src: string;
  export default src;
}
declare module "*.png" {
  const src: string;
  export default src;
}
declare module "*.woff2" {
  const src: string;
  export default src;
}

// `src/lib/site.ts` (partagé avec le site) lit `process.env`, que Remotion fournit dans le navigateur.
declare const process: { env: Record<string, string | undefined> };
