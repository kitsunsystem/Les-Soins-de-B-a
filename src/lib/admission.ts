import { z } from "zod";

// Fiche d'admission (reprise de la fiche papier « Fiche_admission_Soins_de_Bea.pdf »).
// Partagée entre le formulaire en ligne et l'affichage dans l'espace admin.

export const interestOptions = ["Réflexologie", "Kinésiologie", "Magnétisme", "Massage", "Pressothérapie", "Guidance"] as const;

export const healthQuestions = [
  { key: "treatment", question: "Suivez-vous actuellement un traitement médical ?", detail: "Si oui, lequel / lesquels" },
  {
    key: "surgery",
    question: "Avez-vous subi une opération ou une hospitalisation dans les 12 derniers mois ?",
    detail: "Si oui, précisez et indiquez la date",
  },
  { key: "allergies", question: "Avez-vous des allergies connues ?", detail: "Si oui, lesquelles (huiles, plantes, latex, autre)" },
  { key: "pregnancy", question: "Êtes-vous enceinte ou allaitez-vous ?", detail: "Si oui, à combien de semaines / mois" },
  { key: "pathology", question: "Êtes-vous suivie pour une pathologie particulière ?", detail: "Si oui, laquelle" },
] as const;

export const vigilanceOptions = [
  "Phlébite ou thrombose (actuelle ou passée)",
  "Trouble ou insuffisance cardiaque",
  "Pacemaker ou dispositif implanté",
  "Hypertension non contrôlée",
  "Cancer en cours de traitement",
  "Infection ou inflammation aiguë",
  "Plaie ouverte ou lésion cutanée",
  "Diabète",
  "Troubles de la circulation, œdèmes",
  "Épilepsie",
  "Prothèse (hanche, genou, autre)",
  "Problèmes rénaux",
] as const;

export const consentStatements = [
  { key: "accuracy", text: "Je certifie l'exactitude des informations ci-dessus et m'engage à signaler tout changement." },
  { key: "wellness", text: "J'ai compris qu'il s'agit de prestations de bien-être, sans visée médicale ni thérapeutique." },
  { key: "data", text: "Je consens au recueil et à la conservation de ces informations, y compris de santé." },
] as const;

export const beforeSigning = [
  "Les prestations proposées par Les Soins de Béa sont des pratiques de bien-être et de relaxation. Elles ne constituent ni un diagnostic, ni un traitement médical, et ne se substituent en aucun cas à une consultation, un avis ou un traitement médical.",
  "Béatrice Ribes n'est pas habilitée à établir un diagnostic, à prescrire, à modifier ou à interrompre un traitement. En cas de symptôme ou de doute concernant votre santé, consultez votre médecin.",
  "Vous ne devez jamais interrompre ni modifier un traitement en cours du fait des séances.",
  "Vous vous engagez à signaler tout changement de votre état de santé survenu depuis la signature de cette fiche, avant chaque nouvelle séance.",
];

const text = (max: number) => z.string().trim().max(max).default("");
const yesNo = z.object({ answer: z.enum(["oui", "non"], "Merci de répondre à chaque question de santé (oui ou non)."), detail: text(500) });

export const admissionSchema = z
  .object({
    lastName: text(80).pipe(z.string().min(1, "Merci d'indiquer votre nom.")),
    firstName: text(80).pipe(z.string().min(1, "Merci d'indiquer votre prénom.")),
    birthdate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de naissance invalide")]).default(""),
    phone: text(30),
    email: z.union([z.literal(""), z.email("Adresse email invalide")]).default(""),
    address: text(300),
    profession: text(120),
    howFound: text(200),
    interests: z.array(z.enum(interestOptions)).max(interestOptions.length).default([]),
    reason: text(3000),
    since: text(200),
    consultedBefore: text(300),
    expectations: text(3000),
    lifestyle: text(3000),
    health: z.object({
      treatment: yesNo,
      surgery: yesNo,
      allergies: yesNo,
      pregnancy: yesNo,
      pathology: yesNo,
    }),
    vigilance: z.array(z.enum(vigilanceOptions)).max(vigilanceOptions.length).default([]),
    noVigilance: z.boolean().default(false),
    otherInfo: text(3000),
    place: text(120),
    consents: z.object({ accuracy: z.literal(true), wellness: z.literal(true), data: z.literal(true) }, "Merci de cocher les trois cases de consentement."),
  })
  .refine((d) => d.noVigilance || d.vigilance.length > 0, {
    message: "Points de vigilance : cochez les situations qui vous concernent, ou « aucune de ces situations ».",
    path: ["vigilance"],
  })
  .refine((d) => !(d.noVigilance && d.vigilance.length > 0), {
    message: "Points de vigilance : vous avez coché des situations et « aucune » en même temps.",
    path: ["vigilance"],
  });

export type AdmissionData = z.infer<typeof admissionSchema>;

/** Résumé des points de vigilance (contre-indications et réponses « oui » aux questions de santé). */
export function vigilanceSummary(d: AdmissionData): string {
  const parts: string[] = [...d.vigilance];
  for (const q of healthQuestions) {
    const a = d.health[q.key];
    if (a.answer === "oui") {
      const label = {
        treatment: "Traitement en cours",
        surgery: "Opération / hospitalisation < 12 mois",
        allergies: "Allergies",
        pregnancy: "Enceinte ou allaitement",
        pathology: "Pathologie suivie",
      }[q.key];
      parts.push(a.detail ? `${label} : ${a.detail}` : label);
    }
  }
  return parts.length ? parts.join(" · ") : "Aucune contre-indication signalée";
}
