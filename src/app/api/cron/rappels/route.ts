import { NextResponse } from "next/server";
import { sendReminders } from "@/lib/bookings";

export const dynamic = "force-dynamic";

// Appelé chaque jour par Vercel Cron (voir vercel.json) : envoie un rappel la veille du rendez-vous.
// Vercel transmet automatiquement « Authorization: Bearer $CRON_SECRET ».
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json(await sendReminders());
}
