"use client";

import { useActionState, useRef, useState } from "react";
import { Check, Copy, FileSpreadsheet, Loader2, Save, Send, UserPlus } from "lucide-react";
import { prestationsJournal } from "@/lib/content";
import type { Client, SessionNote } from "@/lib/db/schema";
import { normalizeKey, parseWorkbook } from "@/lib/import-excel";
import {
  createClientAction,
  importWorkbookAction,
  saveSessionNoteAction,
  sendAdmissionLinkAction,
  updateClientAction,
  type ActionState,
} from "../../actions";

function Status({ state }: { state: ActionState }) {
  if (!state) return null;
  return state.error ? (
    <span role="alert" className="text-sm text-clay-dark">
      {state.error}
    </span>
  ) : (
    <span role="status" className="text-sm text-forest">
      {state.ok}
    </span>
  );
}

function Input({
  id,
  name,
  label,
  defaultValue,
  type = "text",
  className = "",
  ...rest
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string | number | null;
  type?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label text-xs">
        {label}
      </label>
      <input id={id} name={name} type={type} defaultValue={defaultValue ?? ""} className="field !py-2" {...rest} />
    </div>
  );
}

function Area({ id, name, label, defaultValue, rows = 3, placeholder }: { id: string; name: string; label: string; defaultValue?: string; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={id} className="label text-xs">
        {label}
      </label>
      <textarea id={id} name={name} rows={rows} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="field text-sm" />
    </div>
  );
}

/** Champs de la fiche, dans l'ordre de l'annuaire Excel. */
function Fields({ c, idp, full = true }: { c?: Partial<Client>; idp: string; full?: boolean }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input id={`${idp}-last`} name="lastName" label="Nom" defaultValue={c?.lastName || (c && !c.firstName ? c.name : "")} maxLength={80} />
        <Input id={`${idp}-first`} name="firstName" label="Prénom" defaultValue={c?.firstName} maxLength={80} />
        <Input id={`${idp}-phone`} name="phone" label="Téléphone" type="tel" defaultValue={c?.phone} maxLength={30} />
        <Input id={`${idp}-email`} name="email" label="Email" type="email" defaultValue={c?.email} />
        <Input id={`${idp}-birth`} name="birthdate" label="Date de naissance" type="date" defaultValue={c?.birthdate} />
        <Input id={`${idp}-first-visit`} name="firstVisit" label="Date 1ère venue" type="date" defaultValue={c?.firstVisit} />
        {full && (
          <>
            <Input id={`${idp}-address`} name="address" label="Adresse" defaultValue={c?.address} maxLength={300} className="sm:col-span-2" />
            <Input id={`${idp}-job`} name="profession" label="Profession" defaultValue={c?.profession} maxLength={120} />
            <Input id={`${idp}-found`} name="howFound" label="Comment m'a connue" defaultValue={c?.howFound} maxLength={200} />
          </>
        )}
      </div>
      {full && (
        <>
          <Area id={`${idp}-motive`} name="motive" label="Motif initial / objectif" defaultValue={c?.motive} rows={2} />
          <Area
            id={`${idp}-vig`}
            name="vigilance"
            label="Points de vigilance (contre-indications)"
            defaultValue={c?.vigilance}
            rows={2}
            placeholder="Rempli automatiquement par la fiche d'admission en ligne"
          />
        </>
      )}
      <div>
        <label htmlFor={`${idp}-notes`} className="label text-xs">
          Notes générales (privées)
        </label>
        <textarea
          id={`${idp}-notes`}
          name="notes"
          rows={full ? 4 : 2}
          maxLength={5000}
          defaultValue={c?.notes}
          placeholder="Préférences, ressentis, comment elle/il m'a connue…"
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
      <form action={action} className="card mt-3 space-y-3 p-5 md:absolute md:right-0 md:z-20 md:w-[30rem]">
        <Fields idp="n" full={false} />
        <Status state={state} />
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
      <div>
        <label htmlFor="e-deposit" className="label text-xs">
          Acompte à la réservation
        </label>
        <select id="e-deposit" name="depositPolicy" defaultValue={client.depositPolicy} className="field !py-2 text-sm">
          <option value="auto">Automatique (selon ses annulations et absences)</option>
          <option value="always">Toujours demander un acompte</option>
          <option value="never">Ne jamais demander d&apos;acompte</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary !px-4 !py-2 text-sm">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
          Enregistrer
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

/** Lien personnel vers la fiche d'admission : à copier, ou à envoyer par email. */
export function AdmissionLink({ clientId, token, url, hasEmail }: { clientId: string; token: string; url: string; hasEmail: boolean }) {
  const [copied, setCopied] = useState(false);
  const [state, action, pending] = useActionState(sendAdmissionLinkAction, null);
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input readOnly value={url} aria-label="Lien de la fiche d'admission" className="field !py-1.5 text-xs" onFocus={(e) => e.target.select()} />
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="btn btn-outline shrink-0 !px-3 !py-1.5 text-xs"
        >
          {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      {hasEmail && (
        <form action={action} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="clientId" value={clientId} />
          <input type="hidden" name="token" value={token} />
          <button type="submit" disabled={pending} className="btn btn-outline !px-3 !py-1.5 text-xs">
            {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Send className="size-3.5" aria-hidden />}
            Envoyer le lien par email
          </button>
          <Status state={state} />
        </form>
      )}
    </div>
  );
}

/** Compte-rendu de séance (une ligne du journal, comme la feuille « Séances » du classeur). */
export function SessionNoteForm({
  clientId,
  note,
  defaults,
  submitLabel = "Ajouter au journal",
}: {
  clientId: string;
  note?: SessionNote;
  defaults?: { appointmentId?: string; date?: string; prestation?: string; durationMinutes?: number | null };
  submitLabel?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const res = await saveSessionNoteAction(prev, fd);
    if (res?.ok && !note) formRef.current?.reset();
    return res;
  }, null);
  const idp = note ? `sn-${note.id.slice(0, 6)}` : "sn-new";
  const v = note ?? defaults;
  return (
    <form ref={formRef} action={action} className="space-y-3 text-sm">
      <input type="hidden" name="clientId" value={clientId} />
      {note && <input type="hidden" name="id" value={note.id} />}
      {(note?.appointmentId || defaults?.appointmentId) && (
        <input type="hidden" name="appointmentId" value={note?.appointmentId ?? defaults?.appointmentId ?? ""} />
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Input id={`${idp}-date`} name="date" label="Date" type="date" required defaultValue={v?.date} />
        <div>
          <label htmlFor={`${idp}-presta`} className="label text-xs">
            Prestation
          </label>
          <select id={`${idp}-presta`} name="prestation" defaultValue={v?.prestation || "Réflexologie"} className="field !py-2">
            {prestationsJournal.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <Input id={`${idp}-dur`} name="durationMinutes" label="Durée (min)" type="number" min={5} max={600} defaultValue={v?.durationMinutes ?? ""} />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input id={`${idp}-motive`} name="motive" label="Motif du jour" defaultValue={note?.motive} maxLength={1000} />
        <div>
          <label htmlFor={`${idp}-change`} className="label text-xs">
            Changement signalé ?
          </label>
          <select id={`${idp}-change`} name="changeReported" defaultValue={note?.changeReported ? "oui" : "non"} className="field !py-2">
            <option value="non">Non</option>
            <option value="oui">Oui — voir observations</option>
          </select>
        </div>
      </div>
      <Area id={`${idp}-obs`} name="observations" label="Observations" defaultValue={note?.observations} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Area id={`${idp}-feel`} name="feeling" label="Ressenti du client" defaultValue={note?.feeling} rows={2} />
        <Area id={`${idp}-advice`} name="advice" label="Conseils donnés" defaultValue={note?.advice} rows={2} />
      </div>
      <Input id={`${idp}-next`} name="nextSession" label="Prochaine séance (date conseillée)" type="date" defaultValue={note?.nextSession} className="sm:max-w-xs" />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary !px-4 !py-2 text-sm">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
          {submitLabel}
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

const chunk = <T,>(list: T[], size: number) =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

/** Import du classeur « Suivi clientes » : lu dans le navigateur, puis envoyé ligne à ligne au site. */
export function ImportForm() {
  const [preview, setPreview] = useState<ReturnType<typeof parseWorkbook> | null>(null);
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [state, setState] = useState<ActionState>(null);
  const [importing, setImporting] = useState(false);

  async function onFile(file: File | undefined) {
    setState(null);
    setPreview(null);
    if (!file) return;
    setFileName(file.name);
    setReading(true);
    try {
      const { default: readExcelFile } = await import("read-excel-file/browser");
      const sheets = await readExcelFile(file);
      setPreview(parseWorkbook(sheets as { sheet: string; data: unknown[][] }[]));
    } catch {
      setState({ error: "Fichier illisible : choisissez le classeur Excel (.xlsx) « Suivi clientes »." });
    } finally {
      setReading(false);
    }
  }

  return (
    <details className="group">
      <summary className="btn btn-outline cursor-pointer list-none !px-4 !py-2 text-sm">
        <FileSpreadsheet className="size-4" aria-hidden />
        Importer le classeur Excel
      </summary>
      <div className="card mt-3 space-y-3 p-5 text-sm md:w-[34rem]">
        <p className="text-ink-soft">
          Choisissez le classeur « Suivi clientes » (.xlsx). L&apos;annuaire crée ou complète les fiches (sans doublon : même
          email, téléphone ou nom), le journal des séances s&apos;ajoute à l&apos;historique. Vous pouvez réimporter le
          fichier plus tard : rien ne sera dupliqué.
        </p>
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:font-semibold file:text-white"
          aria-label="Classeur Excel à importer"
        />
        {reading && (
          <p className="flex items-center gap-2 text-ink-soft">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Lecture de {fileName}…
          </p>
        )}
        {preview && (
          <div className="space-y-2 rounded-xl bg-sand/60 p-3">
            <p>
              <strong>{preview.clients.length}</strong> personne(s) dans l&apos;annuaire, <strong>{preview.sessions.length}</strong>{" "}
              séance(s) dans le journal.
            </p>
            {preview.warnings.length > 0 && (
              <ul className="list-disc pl-5 text-xs text-clay-dark">
                {preview.warnings.slice(0, 8).map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
            <button
              type="button"
              disabled={importing || (!preview.clients.length && !preview.sessions.length)}
              onClick={async () => {
                setImporting(true);
                // Envoi par paquets : l'annuaire d'abord, puis le journal (rattaché par « Nom Prénom »).
                const total = { created: 0, updated: 0, sessionsAdded: 0 };
                const parts = [
                  ...chunk(preview.clients, 300).map((clients) => ({ clients, sessions: [] })),
                  // Chaque paquet de séances emporte les lignes d'annuaire concernées : rattachement exact,
                  // même entre homonymes (aucune donnée n'est réécrite).
                  ...chunk(preview.sessions, 400).map((sessions) => {
                    const keys = new Set(sessions.map((x) => normalizeKey(x.clientKey)));
                    return { clients: preview.clients.filter((c) => keys.has(normalizeKey(c.key))), sessions };
                  }),
                ];
                let error = "";
                for (const part of parts) {
                  const res = await importWorkbookAction(part).catch(() => ({ error: "L'envoi a échoué. Réessayez : rien ne sera dupliqué." }));
                  if (res?.error || !("summary" in res) || !res.summary) {
                    error = res?.error ?? "Import interrompu.";
                    break;
                  }
                  total.created += res.summary.created;
                  total.updated += res.summary.updated;
                  total.sessionsAdded += res.summary.sessionsAdded;
                }
                const done = `${total.created} fiche(s) créée(s), ${total.updated} complétée(s), ${total.sessionsAdded} séance(s) ajoutée(s) au journal.`;
                setState(error ? { error: `${error} Déjà importé : ${done}` } : { ok: `Import terminé : ${done}` });
                setImporting(false);
                setPreview(null);
              }}
              className="btn btn-primary !px-4 !py-2 text-sm"
            >
              {importing && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Importer
            </button>
          </div>
        )}
        <Status state={state} />
      </div>
    </details>
  );
}
