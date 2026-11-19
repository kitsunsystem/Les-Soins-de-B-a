"use server";

import { redirect } from "next/navigation";
import { BookingError, cancelByClient } from "@/lib/bookings";

export async function cancelAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  let error = "";
  try {
    await cancelByClient(token);
  } catch (e) {
    error = e instanceof BookingError ? e.message : "Une erreur est survenue.";
    if (!(e instanceof BookingError)) console.error("[annulation]", e);
  }
  const q = new URLSearchParams({ token });
  if (error) q.set("erreur", error);
  redirect(`/rendez-vous/annulation?${q.toString()}`);
}
