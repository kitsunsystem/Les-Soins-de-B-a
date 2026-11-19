import { NextResponse } from "next/server";
import { mailContact } from "@/lib/emails";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { contactSchema, firstError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!rateLimit(`contact:${clientIp(request.headers)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de messages. Merci de réessayer dans quelques minutes." }, { status: 429 });
  }
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }
  const sent = await mailContact(parsed.data);
  if (!sent && process.env.BREVO_API_KEY) {
    return NextResponse.json(
      { error: "Le message n'a pas pu être envoyé. Merci de réessayer ou d'appeler directement." },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
