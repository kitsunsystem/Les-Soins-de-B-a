"use client";

import { useActionState, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { bookableServices, categories } from "@/lib/content";
import { addAppointmentAction, type ActionState } from "../actions";

export type ClientOption = { id: string; name: string; email: string; phone: string };

const label = (c: ClientOption) => `${c.name}${c.phone ? ` · ${c.phone}` : c.email ? ` · ${c.email}` : ""}`;

/**
 * Ajout manuel d'un rendez-vous (pris par téléphone…) ou d'un créneau bloqué.
 * - dans l'agenda : `date` fixée, choix d'un client existant ou saisie d'un nouveau ;
 * - sur une fiche client : `client` fixé, date à choisir.
 */
export function AddAppointmentForm({
  date,
  defaultTime,
  clients = [],
  client,
}: {
  date?: string;
  defaultTime: string;
  clients?: ClientOption[];
  client?: ClientOption;
}) {
  const firstService = bookableServices[0];
  const [serviceId, setServiceId] = useState(client ? firstService.id : "blocage");
  const [duration, setDuration] = useState(client ? (firstService.durationMinutes ?? 60) : 60);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<ClientOption | null>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const blocked = serviceId === "blocage";

  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const res = await addAppointmentAction(prev, fd);
    if (res?.ok) {
      setServiceId(client ? firstService.id : "blocage");
      setDuration(client ? (firstService.durationMinutes ?? 60) : 60);
      setSearch("");
      setPicked(null);
      if (detailsRef.current) detailsRef.current.open = false;
    }
    return res;
  }, null);

  const current = client ?? picked;
  const idp = client ? "c" : "m";

  return (
    <div className={client ? "" : "mt-5 border-t border-line pt-4"}>
      <details ref={detailsRef}>
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-bold text-forest">
          <Plus className="size-4" aria-hidden />
          {client ? "Ajouter un rendez-vous pour ce client" : "Ajouter un rendez-vous ou bloquer un créneau"}
        </summary>
        <form action={action} className="mt-4 space-y-3 text-sm">
          {date && <input type="hidden" name="date" value={date} />}
          {current && <input type="hidden" name="clientId" value={current.id} />}

          <div>
            <label htmlFor={`${idp}-service`} className="label text-xs">
              Type
            </label>
            <select
              id={`${idp}-service`}
              name="serviceId"
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                const s = bookableServices.find((x) => x.id === e.target.value);
                if (s?.durationMinutes) setDuration(s.durationMinutes);
              }}
              className="field !py-1.5 text-sm"
            >
              {!client && <option value="blocage">Créneau bloqué (indisponible)</option>}
              {categories.map((c) => (
                <optgroup key={c.id} label={c.name}>
                  {bookableServices
                    .filter((s) => s.category === c.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className={`grid gap-3 ${date ? "grid-cols-2" : "grid-cols-3"}`}>
            {!date && (
              <div>
                <label htmlFor={`${idp}-date`} className="label text-xs">
                  Date
                </label>
                <input id={`${idp}-date`} name="date" type="date" required className="field !py-1.5" />
              </div>
            )}
            <div>
              <label htmlFor={`${idp}-time`} className="label text-xs">
                Heure
              </label>
              <input
                id={`${idp}-time`}
                name="time"
                type="time"
                step={300}
                required
                defaultValue={defaultTime}
                className="field !py-1.5"
              />
            </div>
            <div>
              <label htmlFor={`${idp}-duration`} className="label text-xs">
                Durée (min)
              </label>
              <input
                id={`${idp}-duration`}
                name="duration"
                type="number"
                min={5}
                max={600}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="field !py-1.5"
              />
            </div>
          </div>

          {!blocked && !client && (
            <div className="space-y-3 rounded-xl bg-sand/50 p-3">
              {clients.length > 0 && (
                <div>
                  <label htmlFor="m-search" className="label text-xs">
                    Client existant
                  </label>
                  <input
                    id="m-search"
                    list="m-clients"
                    value={search}
                    placeholder="Rechercher par nom ou téléphone…"
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPicked(clients.find((c) => label(c) === e.target.value) ?? null);
                    }}
                    className="field !py-1.5"
                  />
                  <datalist id="m-clients">
                    {clients.map((c) => (
                      <option key={c.id} value={label(c)} />
                    ))}
                  </datalist>
                  <p className="mt-1 text-xs text-ink-soft">
                    {picked
                      ? `Rendez-vous rattaché à la fiche de ${picked.name}.`
                      : "Ou saisissez un nouveau client ci-dessous."}
                  </p>
                </div>
              )}
              {!picked && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="m-name" className="label text-xs">
                      Nom du client
                    </label>
                    <input id="m-name" name="clientName" maxLength={120} className="field !py-1.5" />
                  </div>
                  <div>
                    <label htmlFor="m-email" className="label text-xs">
                      Email
                    </label>
                    <input id="m-email" name="clientEmail" type="email" className="field !py-1.5" />
                  </div>
                  <div>
                    <label htmlFor="m-phone" className="label text-xs">
                      Téléphone
                    </label>
                    <input id="m-phone" name="clientPhone" type="tel" maxLength={30} className="field !py-1.5" />
                  </div>
                </div>
              )}
            </div>
          )}
          {current && (
            <>
              <input type="hidden" name="clientName" value={current.name} />
              <input type="hidden" name="clientEmail" value={current.email} />
              <input type="hidden" name="clientPhone" value={current.phone} />
            </>
          )}

          <div>
            <label htmlFor={`${idp}-note`} className="label text-xs">
              Note (facultatif)
            </label>
            <input id={`${idp}-note`} name="note" maxLength={1000} className="field !py-1.5" />
          </div>
          {!blocked && (
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="notify" className="accent-forest" />
              Envoyer la confirmation par email au client
            </label>
          )}
          {state?.error && (
            <p role="alert" className="text-xs text-clay-dark">
              {state.error}
            </p>
          )}
          <button type="submit" disabled={pending} className="btn btn-primary !px-4 !py-1.5 text-xs">
            {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            {blocked ? "Bloquer ce créneau" : "Ajouter le rendez-vous"}
          </button>
        </form>
      </details>
      {state?.ok && (
        <p role="status" className="mt-2 text-xs font-semibold text-forest">
          {state.ok}
        </p>
      )}
    </div>
  );
}
