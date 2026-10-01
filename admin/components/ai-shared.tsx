'use client'

import { cn } from '@/lib/cn'
import type { Tone } from '@/lib/status'
import type { AiCallLog } from '@/lib/types'
import { Chip } from './ui'

export const CALL_STATUS: Record<AiCallLog['status'], { label: string; tone: Tone }> = {
  completed: { label: 'Completed', tone: 'success' },
  escalated: { label: 'Escalated', tone: 'danger' },
  no_answer: { label: 'No answer', tone: 'warning' },
  voicemail: { label: 'Voicemail', tone: 'neutral' },
  failed: { label: 'Failed', tone: 'danger' },
}

export const SENTIMENT: Record<AiCallLog['sentiment'], { label: string; tone: Tone }> = {
  positive: { label: 'Positive', tone: 'success' },
  neutral: { label: 'Neutral', tone: 'neutral' },
  negative: { label: 'Negative', tone: 'danger' },
}

export function CallStatusChip({ status }: { status: AiCallLog['status'] }) {
  const s = CALL_STATUS[status]
  return <Chip tone={s.tone}>{s.label}</Chip>
}

/** 125 → "2:05". */
export const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

/** A field's name for the audit log when it changed between two versions. */
export function changedKeys<T extends object>(a: T, b: T, labels: Partial<Record<keyof T, string>>): string[] {
  return (Object.keys(b) as (keyof T)[]).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k])).map((k) => labels[k] ?? String(k))
}

export const clip = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

/** Selectable chip used for brands, appliances and languages. */
export function ToggleChip({ on, onClick, disabled, children }: { on: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        on ? 'border-brand bg-brand-soft text-brand' : 'border-line-strong bg-card text-muted hover:border-ink-2'
      )}
    >
      <span className={cn('size-1.5 rounded-full', on ? 'bg-brand' : 'bg-line-strong')} aria-hidden />
      {children}
    </button>
  )
}

/** A sticky bar that appears once a draft differs from what is saved. */
export function SaveBar({ dirty, onSave, onReset, disabled }: { dirty: boolean; onSave: () => void; onReset: () => void; disabled?: boolean }) {
  return (
    <div className="sticky bottom-3 z-20 mt-5 flex items-center justify-between gap-3 rounded-card border border-line bg-card/95 px-4 py-3 shadow-float backdrop-blur">
      <p className="text-[13px] font-semibold text-muted">{disabled ? 'View only — your role can’t change AI settings.' : dirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!dirty || disabled}
          onClick={onReset}
          className="h-9 rounded-lg px-3 text-sm font-bold text-ink-2 hover:bg-canvas disabled:cursor-not-allowed disabled:text-faint"
        >
          Reset
        </button>
        <button
          type="button"
          disabled={!dirty || disabled}
          onClick={onSave}
          className="h-9 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-muted"
        >
          Save changes
        </button>
      </div>
    </div>
  )
}
