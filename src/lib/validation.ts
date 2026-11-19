import { z } from "zod";
import { isDateStr, isTimeStr } from "./time";

const text = (max: number) => z.string().trim().max(max);

export const bookingSchema = z.object({
  serviceId: text(80).min(1),
  date: z.string().refine(isDateStr, "Date invalide"),
  time: z.string().refine(isTimeStr, "Heure invalide"),
  name: text(120).min(2, "Merci d'indiquer votre nom et prénom."),
  email: text(200).pipe(z.email("Adresse email invalide.")),
  phone: text(30).regex(/^[+\d][\d .-]{7,}$/, "Numéro de téléphone invalide."),
  message: text(2000).default(""),
  consent: z.literal(true, "Merci d'accepter l'utilisation de vos données pour traiter la demande."),
  website: z.string().max(0).optional(), // champ piège anti-robots
});

export const contactSchema = z.object({
  name: text(120).min(2, "Merci d'indiquer votre nom."),
  email: text(200).pipe(z.email("Adresse email invalide.")),
  phone: text(30).default(""),
  subject: text(80).min(1),
  message: text(5000).min(5, "Votre message est un peu court."),
  consent: z.literal(true, "Merci d'accepter l'utilisation de vos données pour vous recontacter."),
  website: z.string().max(0).optional(),
});

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides.";
}
