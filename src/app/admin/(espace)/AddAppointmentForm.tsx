"use client";

import { useActionState, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { bookableServices, categories } from "@/lib/content";
import { addAppointmentAction, type ActionState } from "../actions";

/** Ajout manuel : rendez-vous pris par téléphone, ou créneau bloqué. */
export function AddAppointmentForm({ date, defaultTime }: { date: string; defaultTime: string }) {
  const [serviceId, setServiceId] = useState("blocage");
  const [duration, setDuration] = useState(60);
  const formRef = useRef<HTMLFormElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const blocked = serviceId === "blocage";
  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const res = await addAppointmentAction(prev, fd);
    if (res?.ok) {
      setServiceId("blocage");
      setDuration(60);
      if (detailsRef.current) detailsRef.current.open = false;
    }
    return res;
  }, null);

  return (
    <details ref={detailsRef} className="mt-5 border-t border-line pt-4">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-rose-deep">
        <Plus className="size-4" aria-hidden />
        Ajouter un rendez-vous ou bloquer un créneau
      </summary>
      <form ref={formRef} action={action} className="mt-4 space-y-3 text-sm">
        <input type="hidden" name="date" value={date} />
        <div>
          <label htmlFor="m-service" className="label text-xs">
            Type
          </label>
          <select
            id="m-service"
            name="serviceId"
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              const s = bookableServices.find((x) => x.id === e.target.value);
              if (s?.durationMinutes) setDuration(s.durationMinutes);
            }}
            className="field !py-1.5 text-sm"
          >
            <option value="blocage">Créneau bloqué (indisponible)</option>
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="m-time" className="label text-xs">
              Heure
            </label>
            <input id="m-time" name="time" type="time" step={300} required defaultValue={defaultTime} className="field !py-1.5" />
          </div>
          <div>
            <label htmlFor="m-duration" className="label text-xs">
              Durée (min)
            </label>
            <input
              id="m-duration"
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
        {!blocked && (
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
        <div>
          <label htmlFor="m-note" className="label text-xs">
            Note (facultatif)
          </label>
          <input id="m-note" name="note" maxLength={1000} className="field !py-1.5" />
        </div>
        {!blocked && (
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="notify" className="accent-rose-deep" />
            Envoyer la confirmation par email au client
          </label>
        )}
        {state?.error && (
          <p role="alert" className="text-xs text-rose-darker">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary !px-4 !py-1.5 text-xs">
          {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
          {blocked ? "Bloquer ce créneau" : "Ajouter le rendez-vous"}
        </button>
      </form>
      {state?.ok && <p className="mt-2 text-xs text-[#3f5a48]">{state.ok}</p>}
    </details>
  );
}
