"use client";

import { useActionState } from "react";
import { Loader2, Save, UserPlus } from "lucide-react";
import type { Client } from "@/lib/db/schema";
import { createClientAction, updateClientAction } from "../../actions";

function Fields({ c, idp }: { c?: Partial<Client>; idp: string }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${idp}-name`} className="label text-xs">
            Nom et prénom
          </label>
          <input id={`${idp}-name`} name="name" required minLength={2} maxLength={120} defaultValue={c?.name} className="field !py-2" />
        </div>
        <div>
          <label htmlFor={`${idp}-phone`} className="label text-xs">
            Téléphone
          </label>
          <input id={`${idp}-phone`} name="phone" type="tel" maxLength={30} defaultValue={c?.phone} className="field !py-2" />
        </div>
        <div>
          <label htmlFor={`${idp}-email`} className="label text-xs">
            Email
          </label>
          <input id={`${idp}-email`} name="email" type="email" defaultValue={c?.email} className="field !py-2" />
        </div>
        <div>
          <label htmlFor={`${idp}-birth`} className="label text-xs">
            Date de naissance
          </label>
          <input id={`${idp}-birth`} name="birthdate" type="date" defaultValue={c?.birthdate} className="field !py-2" />
        </div>
      </div>
      <div>
        <label htmlFor={`${idp}-notes`} className="label text-xs">
          Notes privées
        </label>
        <textarea
          id={`${idp}-notes`}
          name="notes"
          rows={c ? 7 : 3}
          maxLength={5000}
          defaultValue={c?.notes}
          placeholder="Préférences, points d'attention (grossesse, contre-indications…), ressentis des séances, comment elle/il m'a connue…"
          className="field text-sm"
        />
        <p className="mt-1 text-xs text-ink-soft">Visibles uniquement par vous, dans cet espace sécurisé.</p>
      </div>
    </>
  );
}

export function NewClientForm() {
  const [state, action, pending] = useActionState(createClientAction, null);
  return (
    <details className="group md:relative">
      <summary className="btn btn-accent cursor-pointer list-none !px-4 !py-2 text-sm">
        <UserPlus className="size-4" aria-hidden />
        Nouveau client
      </summary>
      <form
        action={action}
        className="card mt-3 space-y-3 p-5 md:absolute md:right-0 md:z-20 md:w-[28rem]"
      >
        <Fields idp="n" />
        {state?.error && (
          <p role="alert" className="alert-error">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary !px-4 !py-2 text-sm">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Créer la fiche
        </button>
      </form>
    </details>
  );
}

export function EditClientForm({ client }: { client: Client }) {
  const [state, action, pending] = useActionState(updateClientAction, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={client.id} />
      <Fields c={client} idp="e" />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary !px-4 !py-2 text-sm">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
          Enregistrer
        </button>
        {state?.ok && <span className="text-sm text-forest">{state.ok}</span>}
        {state?.error && (
          <span role="alert" className="text-sm text-clay-dark">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
