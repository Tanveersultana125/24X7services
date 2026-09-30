'use client'

import { useState } from 'react'
import { Check, Copy, Info, Package, Pencil, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { AiAnswer } from '@/lib/ai/types'

/** One assistant reply: lead line, structured sections, then the callouts. */
export function AnswerView({
  answer,
  onPick,
  onSaveNotes,
  notesSaved,
}: {
  answer: AiAnswer
  onPick?: (s: string) => void
  onSaveNotes?: (n: NonNullable<AiAnswer['notes']>) => void
  notesSaved?: boolean
}) {
  return (
    <div className="space-y-3 text-[14px] leading-relaxed text-ink">
      {answer.lead && <p className="font-semibold">{answer.lead}</p>}

      {answer.sections.map((s) => (
        <div key={s.heading}>
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">{s.heading}</p>
          {s.ordered ? (
            <ol className="space-y-1.5">
              {s.items.map((it, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="num mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-brand-soft text-[11px] font-extrabold text-brand">{i + 1}</span>
                  <span className="min-w-0">{it}</span>
                </li>
              ))}
            </ol>
          ) : (
            <ul className="space-y-1">
              {s.items.map((it, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-faint" />
                  <span className="min-w-0">{it}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {answer.parts && answer.parts.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">Possible parts</p>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
            {answer.parts.map((p) => (
              <li key={p.sku ?? p.name} className="flex items-center gap-2.5 px-3 py-2.5">
                <Package className={cn('size-4 shrink-0', p.likely ? 'text-brand' : 'text-faint')} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold">{p.name}</p>
                  {p.sku && <p className="num text-[11px] font-semibold text-faint">{p.sku}</p>}
                </div>
                {p.likely && <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[10.5px] font-extrabold text-brand">Most likely</span>}
                {p.inVan !== undefined && (
                  <span className={cn('rounded-md px-1.5 py-0.5 text-[10.5px] font-extrabold', p.inVan ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning')}>{p.inVan ? 'In van' : 'From hub'}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {answer.notes && <NotesCard notes={answer.notes} onSave={onSaveNotes} saved={notesSaved} />}
      {answer.customer && <CustomerCard {...answer.customer} />}

      {answer.safety && (
        <div className="flex gap-2.5 rounded-xl border border-warning/25 bg-warning-soft px-3 py-2.5 text-[13px]">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>
            <span className="font-extrabold">Safety · </span>
            {answer.safety}
          </p>
        </div>
      )}
      {answer.caution && (
        <p className="flex gap-2 text-[12.5px] font-medium text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {answer.caution}
        </p>
      )}

      {answer.suggestions && answer.suggestions.length > 0 && onPick && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {answer.suggestions.map((s) => (
            <button key={s} type="button" onClick={() => onPick(s)} className="h-8 rounded-pill border border-brand/25 bg-card px-3 text-[12.5px] font-bold text-brand hover:bg-brand-soft">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function NotesCard({ notes, onSave, saved }: { notes: NonNullable<AiAnswer['notes']>; onSave?: (n: NonNullable<AiAnswer['notes']>) => void; saved?: boolean }) {
  const [draft, setDraft] = useState(notes)
  const [editing, setEditing] = useState(false)
  const rows: [keyof typeof draft, string][] = [
    ['diagnosis', 'Diagnosis'],
    ['action', 'Action taken'],
    ['recommendation', 'Recommendation'],
  ]
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card">
      <div className="divide-y divide-line">
        {rows.map(([k, label]) => (
          <div key={k} className="px-3 py-2.5">
            <p className="text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-faint">{label}</p>
            {editing ? (
              <textarea
                value={draft[k]}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                rows={2}
                className="mt-1 w-full resize-none rounded-lg border border-line-strong bg-card px-2.5 py-2 text-[13.5px] focus:border-brand"
              />
            ) : (
              <p className="mt-0.5 text-[13.5px] font-semibold">{draft[k]}</p>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-line bg-canvas/60 p-2">
        <button type="button" onClick={() => setEditing((e) => !e)} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-card text-[13px] font-extrabold">
          <Pencil className="size-3.5" /> {editing ? 'Done' : 'Edit'}
        </button>
        {onSave && (
          <button
            type="button"
            onClick={() => {
              setEditing(false)
              onSave(draft)
            }}
            className={cn('flex h-10 flex-[1.4] items-center justify-center gap-1.5 rounded-lg text-[13px] font-extrabold text-white', saved ? 'bg-success' : 'bg-brand hover:bg-brand-deep')}
          >
            {saved ? (
              <>
                <Check className="size-4" /> Saved to job
              </>
            ) : (
              'Save to Job'
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function CustomerCard({ technical, simple }: { technical: string; simple: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card">
      <div className="px-3 py-2.5">
        <p className="text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-faint">Technical</p>
        <p className="mt-0.5 text-[13px] font-medium text-muted">{technical}</p>
      </div>
      <div className="border-t border-line bg-success-soft/50 px-3 py-2.5">
        <p className="text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-success">For the customer</p>
        <p className="mt-0.5 text-[14px] font-semibold">{simple}</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(simple)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
          } catch {
            /* clipboard blocked */
          }
        }}
        className="flex h-10 w-full items-center justify-center gap-1.5 border-t border-line text-[13px] font-extrabold text-brand hover:bg-brand-soft"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? 'Copied' : 'Copy for customer'}
      </button>
    </div>
  )
}
