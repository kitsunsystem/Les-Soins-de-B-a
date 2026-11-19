import "server-only";

// Envoi d'emails transactionnels via l'API Brevo (ex-Sendinblue).
// Documentation : https://developers.brevo.com/reference/sendtransacemail

export type Contact = { email: string; name?: string };

export type Mail = {
  to: Contact[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: Contact;
  attachments?: { name: string; content: string }[];
  tags?: string[];
};

export function brevoConfigured() {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
}

export async function sendEmail(mail: Mail): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const recipients = mail.to.filter((c) => c.email);
  if (recipients.length === 0) return false;

  if (!apiKey || !senderEmail) {
    console.info(
      `[email non envoyé — Brevo non configuré] À : ${recipients.map((r) => r.email).join(", ")} | Objet : ${mail.subject}`,
    );
    return false;
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME || "Les Soins de Béa" },
        to: recipients,
        subject: mail.subject,
        htmlContent: mail.html,
        textContent: mail.text,
        replyTo: mail.replyTo,
        attachment: mail.attachments,
        tags: mail.tags,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[brevo] Échec d'envoi (${res.status}) : ${await res.text()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[brevo] Erreur réseau :", e);
    return false;
  }
}

/** Adresse qui reçoit les notifications (nouvelles demandes, messages de contact). */
export function adminContact(): Contact | null {
  const email = process.env.ADMIN_EMAIL;
  return email ? { email, name: "Béatrice" } : null;
}
