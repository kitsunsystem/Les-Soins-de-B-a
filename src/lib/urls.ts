import "server-only";
import { headers } from "next/headers";

/**
 * URL publique du site, utilisée dans les emails (liens d'annulation, espace admin…).
 * Priorité à la variable SITE_URL ; à défaut, le domaine de la requête en cours.
 */
export async function getBaseUrl(): Promise<string> {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.)/.test(host) ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // hors requête
  }
  return "http://localhost:3000";
}

export const cancelPath = (token: string) => `/rendez-vous/annulation?token=${encodeURIComponent(token)}`;
export const adminDayPath = (date: string) => `/admin?jour=${date}`;
