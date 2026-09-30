'use client'

import { useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button, Segmented, Sheet, inputClass } from './ui'

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const pad = (n: number) => String(n).padStart(2, '0')

type Parts = { h: number; m: number; pm: boolean }

/** "20:30" → { h: 8, m: 30, pm: true } */
function parse(v: string): Parts {
  const [hh = 0, mm = 0] = v.split(':').map(Number)
  return { h: hh % 12 || 12, m: mm, pm: hh >= 12 }
}

function format({ h, m, pm }: Parts) {
  return `${pad((h % 12) + (pm ? 12 : 0))}:${pad(m)}`
}

function display(v: string) {
  const { h, m, pm } = parse(v)
  return `${h}:${pad(m)} ${pm ? 'PM' : 'AM'}`
}

/**
 * A time input that opens a bottom sheet. The native `type="time"` popup is a
 * desktop dropdown on Chrome that spills off a phone-width screen and ignores
 * the app's type and colours.
 */
export function TimeField({ label: title, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Parts>(() => parse(value))
  // A minute saved off the 5-minute grid still shows as picked.
  const minutes = MINUTES.includes(draft.m) ? MINUTES : [...MINUTES, draft.m].sort((a, b) => a - b)

  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-ink-2">{title}</span>
      <button
        type="button"
        onClick={() => {
          setDraft(parse(value))
          setOpen(true)
        }}
        className={cn(inputClass, 'num flex items-center justify-between text-left font-bold')}
      >
        {display(value)}
        <Clock className="size-4 text-muted" />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        <p className="num text-center text-4xl font-extrabold tracking-tight">
          {draft.h}:{pad(draft.m)} <span className="text-2xl text-muted">{draft.pm ? 'PM' : 'AM'}</span>
        </p>

        <Segmented
          className="mt-4"
          value={draft.pm ? 'pm' : 'am'}
          onChange={(v) => setDraft({ ...draft, pm: v === 'pm' })}
          options={[
            { value: 'am', label: 'AM' },
            { value: 'pm', label: 'PM' },
          ]}
        />

        <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-muted">Hour</p>
        <div className="grid grid-cols-6 gap-2">
          {HOURS.map((h) => (
            <Cell key={h} active={draft.h === h} onClick={() => setDraft({ ...draft, h })}>
              {h}
            </Cell>
          ))}
        </div>

        <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-muted">Minute</p>
        <div className="grid grid-cols-6 gap-2">
          {minutes.map((m) => (
            <Cell key={m} active={draft.m === m} onClick={() => setDraft({ ...draft, m })}>
              {pad(m)}
            </Cell>
          ))}
        </div>

        <Button
          size="lg"
          className="mt-6 w-full"
          onClick={() => {
            onChange(format(draft))
            setOpen(false)
          }}
        >
          Set {display(format(draft))}
        </Button>
      </Sheet>
    </div>
  )
}

function Cell({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'num h-11 rounded-xl border text-[15px] font-extrabold transition-colors',
        active ? 'border-brand bg-brand text-white' : 'border-line-strong bg-card text-ink hover:border-ink-2'
      )}
    >
      {children}
    </button>
  )
}
