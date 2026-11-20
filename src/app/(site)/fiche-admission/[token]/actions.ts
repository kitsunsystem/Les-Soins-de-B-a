"use server";

import { headers } from "next/headers";
import { admissionSchema } from "@/lib/admission";
import { saveAdmission } from "@/lib/clients";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { firstError } from "@/lib/validation";

export type AdmissionState = { ok?: true; error?: string };

/** Enregistre la fiche d'admission remplie en ligne dans la fiche client. */
export async function submitAdmission(token: string, data: unknown): Promise<AdmissionState> {
  if (!/^[a-f0-9]{24,64}$/.test(token)) return { error: "Ce lien n'est pas valide." };
  if (!rateLimit(`admission:${clientIp(await headers())}`, 8, 60 * 60_000)) {
    return { error: "Trop d'envois. Merci de réessayer un peu plus tard." };
  }
  const parsed = admissionSchema.safeParse(data);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const id = await saveAdmission(token, parsed.data);
  if (!id) return { error: "Ce lien n'est plus valide. Merci de contacter Béatrice." };
  return { ok: true };
}
