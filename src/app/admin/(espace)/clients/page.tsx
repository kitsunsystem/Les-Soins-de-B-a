import Link from "next/link";
import { CalendarClock, ClipboardCheck, Download, FileWarning, Search, UserPlus, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { crmStats, listClients } from "@/lib/clients";
import { formatDateStr, parisDateStr } from "@/lib/time";
import { ImportForm, NewClientForm } from "./forms";

const short = (d: Date) => formatDateStr(parisDateStr(d), { weekday: undefined, day: "numeric", month: "short", year: "numeric" });

export default async function ClientsPage({ searchParams }: PageProps<"/admin/clients">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const [clients, stats] = await Promise.all([listClients(q), crmStats()]);

  const kpis = [
    { label: "Clients", value: stats.total, icon: Users },
    { label: "Nouveaux (30 jours)", value: stats.newLast30, icon: UserPlus },
    { label: "Séances ce mois-ci", value: stats.sessionsThisMonth, icon: CalendarClock },
    { label: "Rendez-vous à venir", value: stats.upcoming, icon: CalendarClock },
    { label: "Fiches d'admission à recevoir", value: stats.missingAdmission, icon: FileWarning },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Clients</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Chaque réservation, rendez-vous ajouté, fiche d&apos;admission ou message de contact alimente automatiquement la fiche.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <ImportForm />
          <details className="relative">
            <summary className="btn btn-outline cursor-pointer list-none !px-4 !py-2 text-sm">
              <Download className="size-4" aria-hidden />
              Exporter
            </summary>
            <div className="card absolute right-0 z-20 mt-2 w-64 space-y-1 p-2 text-sm">
              <a href="/admin/clients/export" download className="block rounded-lg px-3 py-2 hover:bg-sand">
                Annuaire des clients (CSV / Excel)
              </a>
              <a href="/admin/clients/export?type=seances" download className="block rounded-lg px-3 py-2 hover:bg-sand">
                Journal des séances (CSV / Excel)
              </a>
            </div>
          </details>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kpis.map((k) => (
          <li key={k.label} className="card flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-xl bg-forest-soft text-forest">
              <k.icon className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block font-serif text-3xl leading-none">{k.value}</span>
              <span className="text-xs text-ink-soft">{k.label}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="card p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <form className="flex w-full max-w-md items-center gap-2" role="search">
            <label htmlFor="q" className="sr-only">
              Rechercher un client
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
              <input id="q" name="q" defaultValue={q} placeholder="Nom, email ou téléphone…" className="field !py-2 !pl-9" />
            </div>
            <button type="submit" className="btn btn-primary !px-4 !py-2 text-sm">
              Rechercher
            </button>
          </form>
          <NewClientForm />
        </div>

        {q && (
          <p className="mt-4 text-sm text-ink-soft">
            {clients.length} résultat{clients.length > 1 ? "s" : ""} pour « {q} » —{" "}
            <Link href="/admin/clients" className="text-forest underline">
              tout afficher
            </Link>
          </p>
        )}

        {clients.length === 0 ? (
          <p className="py-10 text-center text-ink-soft">
            {q ? "Aucun client ne correspond à cette recherche." : "Les fiches apparaîtront ici dès la première réservation — ou importez votre classeur Excel."}
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wider text-ink-soft">
                <tr>
                  <th scope="col" className="py-3 pr-4 font-semibold">Client</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Contact</th>
                  <th scope="col" className="py-3 pr-4 text-center font-semibold">Séances</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Dernière séance</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Prochain RDV</th>
                  <th scope="col" className="py-3 font-semibold">Fiche d&apos;admission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {clients.map((c) => (
                  <tr key={c.id} className="group hover:bg-sand/40">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/clients/${c.id}`} className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-clay-soft font-serif text-clay-dark">
                          {(c.lastName || c.name).charAt(0).toUpperCase()}
                        </span>
                        <span>
                          <span className="block font-bold text-ink group-hover:text-forest group-hover:underline">
                            {c.lastName ? (
                              <>
                                <span className="uppercase">{c.lastName}</span> {c.firstName}
                              </>
                            ) : (
                              c.name
                            )}
                          </span>
                          <span className="text-xs text-ink-soft">
                            {c.firstVisit ? `1re venue : ${c.firstVisit.split("-").reverse().join("/")}` : `Fiche du ${short(c.createdAt)}`}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-ink-soft">
                      {c.phone && <span className="block">{c.phone}</span>}
                      {c.email && <span className="block break-all text-xs">{c.email}</span>}
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span className="font-serif text-xl">{c.visits}</span>
                      {c.cancellations > 0 && (
                        <span className="block text-[0.7rem] text-clay-dark">
                          {c.cancellations} annul./abs.
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-ink-soft">{c.lastVisit ? short(c.lastVisit) : "—"}</td>
                    <td className="py-3 pr-4">
                      {c.nextVisit ? (
                        <span className="rounded-full bg-forest-soft px-2.5 py-1 text-xs font-semibold text-forest">
                          {short(c.nextVisit)}
                        </span>
                      ) : (
                        <span className="text-ink-soft">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      {c.admissionReceivedAt ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-forest">
                          <ClipboardCheck className="size-3.5" aria-hidden />
                          Reçue
                        </span>
                      ) : (
                        <span className="text-xs text-ink-soft">À recevoir</span>
                      )}
                      {c.vigilance && !/^aucune/i.test(c.vigilance.trim()) && (
                        <span className="mt-0.5 block text-[0.7rem] font-semibold text-clay-dark">Vigilance</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
