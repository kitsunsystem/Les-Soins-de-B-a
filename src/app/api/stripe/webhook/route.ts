import { NextResponse } from "next/server";
import { confirmDepositPayment, releaseHold } from "@/lib/bookings";
import { verifyStripeSignature } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Notifications Stripe (à déclarer dans Stripe : Développeurs → Webhooks → https://<site>/api/stripe/webhook,
 * événements checkout.session.completed et checkout.session.expired). Signature vérifiée avec STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = await request.text();
  if (!secret || !verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }
  const event = JSON.parse(payload) as { type: string; data: { object: { id: string; metadata?: Record<string, string> } } };
  const session = event.data.object;
  try {
    if (event.type === "checkout.session.completed") await confirmDepositPayment(session.id);
    if (event.type === "checkout.session.expired" && session.metadata?.appointment_id) {
      await releaseHold(session.metadata.appointment_id);
    }
  } catch (e) {
    console.error("[stripe] notification", event.type, e);
    return NextResponse.json({ error: "Erreur de traitement" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
