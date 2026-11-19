import { isAdmin } from "@/lib/auth";
import { exportClientsCsv } from "@/lib/clients";
import { parisDateStr } from "@/lib/time";

export const dynamic = "force-dynamic";

/** Export CSV des fiches clients (compatible Excel), réservé à l'admin. */
export async function GET() {
  if (!(await isAdmin())) return new Response("Non autorisé", { status: 401 });
  const csv = await exportClientsCsv();
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clients-${parisDateStr(new Date())}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
