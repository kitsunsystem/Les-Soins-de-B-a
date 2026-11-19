import { NextResponse } from "next/server";
import { getMonthAvailability } from "@/lib/bookings";
import { getService } from "@/lib/content";
import { isMonthStr } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("soin");
  const month = searchParams.get("mois");
  if (!getService(serviceId) || !isMonthStr(month)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }
  const { days, settings } = await getMonthAvailability(serviceId!, month);
  return NextResponse.json(
    {
      days,
      enabled: settings.bookingEnabled,
      notice: settings.bookingNotice,
      maxDaysAhead: settings.maxDaysAhead,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
