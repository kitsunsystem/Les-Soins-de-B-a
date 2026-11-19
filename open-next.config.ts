import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Les pages publiques sont pré-générées au build et servies depuis les assets statiques du Worker
// (pas de revalidation nécessaire : le contenu change à chaque déploiement).
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
