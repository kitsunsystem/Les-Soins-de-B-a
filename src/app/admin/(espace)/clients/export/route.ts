import { isAdmin } from "@/lib/auth";
import { exportClientsCsv, exportSessionsCsv } from "@/lib/clients";
import { parisDateStr } from "@/lib/time";

export const dynamic = "force-dynamic";

/**
 * Export CSV (compatible Excel), réservé à l'admin :
 * - par défaut l'annuaire des clients ;
 * - `?type=seances` le journal des séances.
 */
export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Non autorisé", { status: 401 });
  const sessions = new URL(req.url).searchParams.get("type") === "seances";
  const csv = sessions ? await exportSessionsCsv() : await exportClientsCsv();
  const name = `${sessions ? "seances" : "clients"}-${parisDateStr(new Date())}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
