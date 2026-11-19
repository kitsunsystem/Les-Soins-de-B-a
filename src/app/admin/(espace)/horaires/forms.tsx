"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import type { Settings } from "@/lib/db/schema";
import { closePeriodAction, saveSettingsAction } from "../../actions";

export function ClosePeriodForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(closePeriodAction, null);
  return (
    <form action={action} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1.3fr_auto] sm:items-end">
      <div>
        <label htmlFor="p-from" className="label text-xs">
          Du
        </label>
        <input id="p-from" name="from" type="date" min={today} required className="field !py-1.5" />
      </div>
      <div>
        <label htmlFor="p-to" className="label text-xs">
          Au (inclus)
        </label>
        <input id="p-to" name="to" type="date" min={today} required className="field !py-1.5" />
      </div>
      <div>
        <label htmlFor="p-note" className="label text-xs">
          Motif
        </label>
        <input id="p-note" name="note" placeholder="Congés" maxLength={200} className="field !py-1.5" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary !py-2 text-sm">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Fermer
      </button>
      {(state?.ok || state?.error) && (
        <p role={state.error ? "alert" : "status"} className={`text-sm sm:col-span-4 ${state.error ? "text-rose-darker" : "text-[#3f5a48]"}`}>
          {state.error ?? state.ok}
        </p>
      )}
    </form>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(saveSettingsAction, null);
  return (
    <form action={action} className="mt-5 space-y-4 text-sm">
      <label className="flex items-start gap-3 rounded-xl border border-line bg-white p-3">
        <input type="checkbox" name="bookingEnabled" defaultChecked={settings.bookingEnabled} className="mt-1 size-4 accent-rose-deep" />
        <span>
          <span className="font-medium">Réservation en ligne activée</span>
          <span className="block text-xs text-ink-soft">Décochez pour suspendre temporairement les réservations.</span>
        </span>
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-line bg-white p-3">
        <input type="checkbox" name="autoConfirm" defaultChecked={settings.autoConfirm} className="mt-1 size-4 accent-rose-deep" />
        <span>
          <span className="font-medium">Confirmation automatique</span>
          <span className="block text-xs text-ink-soft">
            Sinon, chaque demande reste « en attente » jusqu&apos;à ce que vous la confirmiez (recommandé).
          </span>
        </span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="s-step" className="label text-xs">
            Intervalle entre créneaux
          </label>
          <select id="s-step" name="slotStepMinutes" defaultValue={settings.slotStepMinutes} className="field !py-1.5">
            {[15, 20, 30, 45, 60].map((n) => (
              <option key={n} value={n}>
                {n} min
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="s-buffer" className="label text-xs">
            Pause entre deux soins
          </label>
          <select id="s-buffer" name="bufferMinutes" defaultValue={settings.bufferMinutes} className="field !py-1.5">
            {[0, 5, 10, 15, 20, 30, 45, 60].map((n) => (
              <option key={n} value={n}>
                {n} min
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="s-notice" className="label text-xs">
            Délai minimum (heures)
          </label>
          <input id="s-notice" name="minNoticeHours" type="number" min={0} max={336} defaultValue={settings.minNoticeHours} className="field !py-1.5" />
        </div>
        <div>
          <label htmlFor="s-ahead" className="label text-xs">
            Réservable jusqu&apos;à (jours)
          </label>
          <input id="s-ahead" name="maxDaysAhead" type="number" min={1} max={365} defaultValue={settings.maxDaysAhead} className="field !py-1.5" />
        </div>
      </div>

      <div>
        <label htmlFor="s-msg" className="label text-xs">
          Message affiché sur la page de réservation (facultatif)
        </label>
        <textarea
          id="s-msg"
          name="bookingNotice"
          rows={2}
          maxLength={500}
          defaultValue={settings.bookingNotice}
          placeholder="Ex. Cabinet fermé du 22 au 30 décembre — belles fêtes !"
          className="field"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary !py-2 text-sm">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Enregistrer les réglages
        </button>
        {(state?.ok || state?.error) && (
          <span role={state.error ? "alert" : "status"} className={state.error ? "text-rose-darker" : "text-[#3f5a48]"}>
            {state.error ?? state.ok}
          </span>
        )}
      </div>
    </form>
  );
}
