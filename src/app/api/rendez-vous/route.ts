import { NextResponse } from "next/server";
import { BookingError, createBooking } from "@/lib/bookings";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parisDateStr, parisTimeStr } from "@/lib/time";
import { bookingSchema, firstError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!rateLimit(`booking:${clientIp(request.headers)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de demandes. Merci de réessayer dans quelques minutes." }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }
  try {
    const appt = await createBooking(parsed.data);
    return NextResponse.json({
      ok: true,
      status: appt.status,
      date: parisDateStr(appt.startsAt),
      time: parisTimeStr(appt.startsAt),
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
