/** URL publique du site, utilisée dans les emails (liens d'annulation, espace admin…). */
export function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const cancelUrl = (token: string) => `${baseUrl()}/rendez-vous/annulation?token=${encodeURIComponent(token)}`;
export const adminDayUrl = (date: string) => `${baseUrl()}/admin?jour=${date}`;
