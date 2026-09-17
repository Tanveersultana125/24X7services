'use client'

import type { SlotOption } from '@app/shared'
import { formatSlotWindow } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * One bookable window. "Filling fast" is the honest reading of a window with
 * 20% or less of its capacity left — it is pressure the customer can act on,
 * not a number invented to create urgency, and an unavailable window says so
 * plainly instead of disappearing.
 */

export interface TimeSlotProps {
  slot: SlotOption
  selected?: boolean
  onSelect: (slot: SlotOption) => void
  className?: string
}

export function TimeSlot({
  slot,
  selected = false,
  onSelect,
  className,
}: TimeSlotProps) {
  const unavailable = slot.availability === 'unavailable'
  const label = formatSlotWindow(slot.start, slot.end)

  return (
    <button
      type="button"
      onClick={() => onSelect(slot)}
      disabled={unavailable}
      aria-pressed={selected}
      aria-label={
        unavailable
          ? `${label}, unavailable`
          : slot.availability === 'limited'
            ? `${label}, filling fast`
            : label
      }
      className={cn(
        'flex min-h-16 w-full flex-col items-center justify-center gap-0.5 rounded-card border px-3 py-2',
        'transition-colors duration-[var(--duration-fast)]',
        unavailable
          ? 'cursor-not-allowed border-border bg-surface text-muted'
          : selected
            ? 'border-brand bg-brand text-bg'
            : 'border-border bg-bg text-ink hover:border-brand',
        className
      )}
    >
      <span className="text-sm font-semibold">{label}</span>
      {unavailable ? (
        <span className="text-[11px]">Unavailable</span>
      ) : slot.availability === 'limited' ? (
        <span
          className={cn(
            'text-[11px] font-medium',
            selected ? 'text-bg/80' : 'text-warning'
          )}
        >
          Filling fast
        </span>
      ) : null}
    </button>
  )
}
