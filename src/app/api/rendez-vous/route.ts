import { NextResponse } from "next/server";
import { BookingError, createBooking } from "@/lib/bookings";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parisDateStr, parisTimeStr } from "@/lib/time";
import { bookingSchema, firstError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!rateLimit(`booking:${clientIp(request.headers)}`, 6, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de demandes. Merci de réessayer dans quelques minutes." }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }
  try {
    const result = await createBooking(parsed.data);
    if (result.kind === "deposit_required") {
      return NextResponse.json({ depositRequired: true, amount: result.amount, online: result.online });
    }
    if (result.kind === "payment") return NextResponse.json({ paymentUrl: result.url });
    return NextResponse.json({
      ok: true,
      status: result.appt.status,
      date: parisDateStr(result.appt.startsAt),
      time: parisTimeStr(result.appt.startsAt),
      deposit: result.appt.depositStatus === "manual" ? result.appt.depositCents / 100 : 0,
      admissionUrl: result.admissionUrl,
    });
  } catch (e) {
    if (e instanceof BookingError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    console.error("[rendez-vous]", e);
    return NextResponse.json(
      { error: "Une erreur est survenue. Merci de réessayer ou d'appeler directement." },
      { status: 500 },
    );
  }
}
