import "server-only";
import { adminContact, sendEmail } from "./brevo";
import type { Appointment } from "./db/schema";
import { buildIcs } from "./ics";
import { site } from "./site";
import { formatDateTime, parisDateStr } from "./time";
import { adminDayPath, cancelPath, getBaseUrl } from "./urls";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const nl2br = (s: string) => esc(s).replace(/\r?\n/g, "<br>");

const C = { bg: "#f8f4ee", card: "#fffdf9", text: "#26352e", muted: "#56655d", rose: "#345445", clay: "#b4694a", line: "#e6ddd0" };

function layout(base: string, title: string, body: string) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:Helvetica,Arial,sans-serif;color:${C.text};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.card};border-radius:16px;border:1px solid ${C.line};">
<tr><td style="padding:32px 32px 8px;text-align:center;">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;color:${C.text};">${esc(site.name)}</div>
<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.clay};margin-top:6px;">${esc(site.tagline)}</div>
</td></tr>
<tr><td style="padding:16px 32px 32px;font-size:15px;line-height:1.6;">${body}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid ${C.line};font-size:12px;color:${C.muted};text-align:center;line-height:1.6;">
${esc(site.name)} — ${esc(site.owner)} · Cabinet à ${esc(site.city)}<br>
Tél. ${esc(site.phone)} · <a href="${base}" style="color:${C.rose};">${base.replace(/^https?:\/\//, "")}</a>
</td></tr></table></td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<p style="text-align:center;margin:28px 0;"><a href="${href}" style="display:inline-block;background:${C.rose};color:#fff;text-decoration:none;padding:12px 26px;border-radius:999px;font-size:15px;">${esc(label)}</a></p>`;
}

function recap(a: Appointment) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};border-radius:12px;margin:20px 0;">
<tr><td style="padding:16px 20px;font-size:15px;line-height:1.7;">
<strong>${esc(a.serviceName)}</strong><br>
${esc(formatDateTime(a.startsAt))}<br>
Durée : ${a.durationMinutes} min<br>
Lieu : cabinet à ${esc(site.city)} (${esc(site.addressNote.toLowerCase())})
</td></tr></table>`;
}

const cancelNote = (base: string, a: Appointment) =>
  `<p style="font-size:13px;color:${C.muted};">Un empêchement ? Merci de prévenir au moins 24 h à l'avance : <a href="${base}${cancelPath(a.cancelToken)}" style="color:${C.rose};">annuler mon rendez-vous</a> ou appeler le ${esc(site.phone)}.</p>`;

const client = (a: Appointment) => (a.clientEmail ? [{ email: a.clientEmail, name: a.clientName }] : []);

function icsAttachment(base: string, a: Appointment) {
  const ics = buildIcs({
    uid: a.id,
    start: a.startsAt,
    end: a.endsAt,
    summary: `${a.serviceName} — ${site.name}`,
    description: `Rendez-vous avec ${site.owner}. Tél. ${site.phone}. Annulation : ${base}${cancelPath(a.cancelToken)}`,
    location: `Cabinet ${site.name}, ${site.city}`,
  });
  return [{ name: "rendez-vous.ics", content: Buffer.from(ics).toString("base64") }];
}

/** Email au client juste après sa demande (en attente, ou confirmée si la confirmation est automatique). */
export async function mailBookingReceived(a: Appointment) {
  const base = await getBaseUrl();
  const confirmed = a.status === "confirmed";
  const subject = confirmed ? "Votre rendez-vous est confirmé" : "Votre demande de rendez-vous est bien reçue";
  const body = confirmed
    ? `<p>Bonjour ${esc(a.clientName)},</p><p>Merci pour votre confiance ! Votre rendez-vous est <strong>confirmé</strong> :</p>${recap(a)}<p>L'adresse exacte du cabinet vous sera communiquée par téléphone ou par email avant la séance. Vous trouverez ce rendez-vous en pièce jointe pour l'ajouter à votre agenda.</p>${cancelNote(base, a)}<p>À très bientôt,<br>Béatrice</p>`
    : `<p>Bonjour ${esc(a.clientName)},</p><p>Merci pour votre demande ! Le créneau ci-dessous est réservé pour vous en attendant ma confirmation :</p>${recap(a)}<p>Je reviens vers vous très rapidement par email pour confirmer le rendez-vous.</p>${cancelNote(base, a)}<p>À très bientôt,<br>Béatrice</p>`;
  return sendEmail({
    to: client(a),
    subject,
    html: layout(base, subject, body),
    attachments: confirmed ? icsAttachment(base, a) : undefined,
    tags: ["rdv-demande"],
  });
}

/** Notification à Béa pour chaque nouvelle demande. */
export async function mailBookingAdmin(a: Appointment) {
  const base = await getBaseUrl();
  const admin = adminContact();
  if (!admin) return false;
  const pending = a.status === "pending";
  const subject = `${pending ? "Nouvelle demande" : "Nouveau rendez-vous"} : ${a.serviceName} — ${formatDateTime(a.startsAt)}`;
  const body = `<p>${pending ? "Une nouvelle demande de rendez-vous attend votre confirmation." : "Un nouveau rendez-vous a été réservé (confirmation automatique)."}</p>${recap(a)}
<p><strong>Client :</strong> ${esc(a.clientName)}<br><strong>Email :</strong> ${esc(a.clientEmail || "—")}<br><strong>Téléphone :</strong> ${esc(a.clientPhone || "—")}</p>
${a.message ? `<p><strong>Message :</strong><br>${nl2br(a.message)}</p>` : ""}
${button(`${base}${adminDayPath(parisDateStr(a.startsAt))}`, pending ? "Confirmer ou refuser" : "Voir l'agenda")}`;
  return sendEmail({
    to: [admin],
    replyTo: a.clientEmail ? { email: a.clientEmail, name: a.clientName } : undefined,
    subject,
    html: layout(base, subject, body),
    tags: ["rdv-admin"],
  });
}

export async function mailBookingConfirmed(a: Appointment) {
  const base = await getBaseUrl();
  const subject = "Votre rendez-vous est confirmé";
  const body = `<p>Bonjour ${esc(a.clientName)},</p><p>J'ai le plaisir de vous confirmer votre rendez-vous :</p>${recap(a)}<p>L'adresse exacte du cabinet vous sera communiquée avant la séance. Le règlement s'effectue en fin de séance (${esc(site.payment.toLowerCase())}). Vous trouverez ce rendez-vous en pièce jointe pour l'ajouter à votre agenda.</p>${cancelNote(base, a)}<p>À très bientôt,<br>Béatrice</p>`;
  return sendEmail({ to: client(a), subject, html: layout(base, subject, body), attachments: icsAttachment(base, a), tags: ["rdv-confirme"] });
}

export async function mailBookingDeclined(a: Appointment, reason: string) {
  const base = await getBaseUrl();
  const subject = "Votre demande de rendez-vous";
  const body = `<p>Bonjour ${esc(a.clientName)},</p><p>Je suis désolée, je ne suis malheureusement pas disponible pour le créneau demandé :</p>${recap(a)}${reason ? `<p>${nl2br(reason)}</p>` : ""}<p>N'hésitez pas à choisir un autre créneau en ligne ou à m'appeler au ${esc(site.phone)}.</p>${button(`${base}/rendez-vous`, "Choisir un autre créneau")}<p>Belle journée,<br>Béatrice</p>`;
  return sendEmail({ to: client(a), subject, html: layout(base, subject, body), tags: ["rdv-refuse"] });
}

export async function mailCancelledByAdmin(a: Appointment, reason: string) {
  const base = await getBaseUrl();
  const subject = "Annulation de votre rendez-vous";
  const body = `<p>Bonjour ${esc(a.clientName)},</p><p>Je suis au regret de devoir annuler le rendez-vous suivant :</p>${recap(a)}${reason ? `<p>${nl2br(reason)}</p>` : ""}<p>Toutes mes excuses pour ce désagrément. Vous pouvez reprendre rendez-vous en ligne ou m'appeler au ${esc(site.phone)}.</p>${button(`${base}/rendez-vous`, "Reprendre rendez-vous")}<p>Béatrice</p>`;
  return sendEmail({ to: client(a), subject, html: layout(base, subject, body), tags: ["rdv-annule"] });
}

export async function mailCancelledByClient(a: Appointment) {
  const base = await getBaseUrl();
  const admin = adminContact();
  const subject = "Votre rendez-vous est annulé";
  const body = `<p>Bonjour ${esc(a.clientName)},</p><p>Votre rendez-vous a bien été annulé :</p>${recap(a)}<p>Au plaisir de vous accueillir une prochaine fois.</p>${button(`${base}/rendez-vous`, "Reprendre rendez-vous")}<p>Béatrice</p>`;
  await sendEmail({ to: client(a), subject, html: layout(base, subject, body), tags: ["rdv-annule-client"] });
  if (admin) {
    const s2 = `Annulation : ${a.clientName} — ${formatDateTime(a.startsAt)}`;
    await sendEmail({
      to: [admin],
      subject: s2,
      html: layout(base, s2, `<p>${esc(a.clientName)} a annulé son rendez-vous en ligne. Le créneau est de nouveau disponible.</p>${recap(a)}`),
      tags: ["rdv-annule-admin"],
    });
  }
}

export async function mailReminder(a: Appointment) {
  const base = await getBaseUrl();
  const subject = "Rappel : votre rendez-vous de demain";
  const body = `<p>Bonjour ${esc(a.clientName)},</p><p>Petit rappel de votre rendez-vous :</p>${recap(a)}<p>Pensez à venir dans une tenue confortable. Le règlement s'effectue en fin de séance (${esc(site.payment.toLowerCase())}).</p>${cancelNote(base, a)}<p>À demain,<br>Béatrice</p>`;
  return sendEmail({ to: client(a), subject, html: layout(base, subject, body), tags: ["rdv-rappel"] });
}

export async function mailContact(data: { name: string; email: string; phone: string; subject: string; message: string }) {
  const base = await getBaseUrl();
  const admin = adminContact();
  if (!admin) {
    console.info("[contact] ADMIN_EMAIL non défini : message non transmis.", data.subject);
    return false;
  }
  const subject = `Message du site : ${data.subject} — ${data.name}`;
  const body = `<p><strong>Nom :</strong> ${esc(data.name)}<br><strong>Email :</strong> ${esc(data.email)}<br><strong>Téléphone :</strong> ${esc(data.phone || "—")}<br><strong>Objet :</strong> ${esc(data.subject)}</p><p>${nl2br(data.message)}</p><p style="font-size:13px;color:${C.muted};">Répondez directement à cet email pour écrire à ${esc(data.name)}.</p>`;
  const ok = await sendEmail({
    to: [admin],
    replyTo: { email: data.email, name: data.name },
    subject,
    html: layout(base, subject, body),
    tags: ["contact"],
  });
  const ackSubject = "Votre message est bien arrivé";
  await sendEmail({
    to: [{ email: data.email, name: data.name }],
    subject: ackSubject,
    html: layout(base, 
      ackSubject,
      `<p>Bonjour ${esc(data.name)},</p><p>Merci pour votre message, je vous réponds dans les meilleurs délais.</p><p style="color:${C.muted};font-size:14px;border-left:3px solid ${C.line};padding-left:12px;">${nl2br(data.message)}</p><p>Belle journée,<br>Béatrice</p>`,
    ),
    tags: ["contact-accuse"],
  });
  return ok;
}
