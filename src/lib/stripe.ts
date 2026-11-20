import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Paiement des acomptes par Stripe Checkout (API REST, sans SDK : compatible Cloudflare Workers).
// Variables : STRIPE_SECRET_KEY (clé secrète) et STRIPE_WEBHOOK_SECRET (signature des notifications).

const API = () => (process.env.STRIPE_API_BASE ?? "https://api.stripe.com").replace(/\/$/, "");

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

type StripeObject = Record<string, unknown> & { id: string };

async function call<T = StripeObject>(path: string, params?: Record<string, string>, method = "POST"): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe n'est pas configuré (STRIPE_SECRET_KEY).");
  const res = await fetch(`${API()}/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params ? new URLSearchParams(params) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Stripe : ${json.error?.message ?? res.status}`);
  return json;
}

export type CheckoutSession = StripeObject & {
  url: string;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  status: "open" | "complete" | "expired";
  payment_intent: string | null;
  metadata: Record<string, string>;
  amount_total: number;
};

/** Page de paiement Stripe pour l'acompte d'un rendez-vous. */
export function createDepositCheckout(p: {
  appointmentId: string;
  amountCents: number;
  email: string;
  label: string;
  successUrl: string;
  cancelUrl: string;
  expiresAt: Date;
}) {
  return call<CheckoutSession>("checkout/sessions", {
    mode: "payment",
    locale: "fr",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(p.amountCents),
    "line_items[0][price_data][product_data][name]": `Acompte — ${p.label}`,
    "line_items[0][price_data][product_data][description]":
      "Déduit du prix de la séance. Non remboursable en cas d'annulation de votre part.",
    customer_email: p.email,
    client_reference_id: p.appointmentId,
    "metadata[appointment_id]": p.appointmentId,
    "payment_intent_data[metadata][appointment_id]": p.appointmentId,
    success_url: p.successUrl,
    cancel_url: p.cancelUrl,
    expires_at: String(Math.floor(p.expiresAt.getTime() / 1000)),
  });
}

export const retrieveCheckout = (id: string) =>
  call<CheckoutSession>(`checkout/sessions/${encodeURIComponent(id)}`, undefined, "GET");

export const refundPayment = (paymentIntent: string) => call("refunds", { payment_intent: paymentIntent });

/** Ferme une page de paiement encore ouverte (créneau libéré) : elle ne peut plus être payée. */
export const expireCheckout = (id: string) => call<CheckoutSession>(`checkout/sessions/${encodeURIComponent(id)}/expire`);

/**
 * Vérifie la signature d'une notification Stripe (en-tête « Stripe-Signature » : t=…,v1=…).
 * Tolérance de 5 minutes contre le rejeu.
 */
export function verifyStripeSignature(payload: string, header: string | null, secret: string, now = Date.now()): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    }),
  );
  const t = Number(parts.t);
  const signatures = header
    .split(",")
    .filter((kv) => kv.trim().startsWith("v1="))
    .map((kv) => kv.trim().slice(3));
  if (!t || !signatures.length || Math.abs(now / 1000 - t) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  return signatures.some(
    (sig) => sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected)),
  );
}
