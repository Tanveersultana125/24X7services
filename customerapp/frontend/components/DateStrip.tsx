'use client'

import { useEffect, useRef } from 'react'
import { dayOfMonth, relativeDateLabel, weekdayShort } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * The horizontal row of dates above the slot grid.
 *
 * It is a radiogroup rather than a list of buttons: exactly one date is chosen
 * at a time, and that is what arrow-key navigation and the announcement should
 * reflect.
 */

export interface DateStripDay {
  date: string
  /** False when every window that day is full, which greys the chip out. */
  hasAvailability: boolean
}

export interface DateStripProps {
  days: readonly DateStripDay[]
  value?: string
  onChange: (date: string) => void
  className?: string
}

export function DateStrip({
  days,
  value,
  onChange,
  className,
}: DateStripProps) {
  const railRef = useRef<HTMLDivElement>(null)

  // A date chosen earlier in the flow can be a week along the rail.
  useEffect(() => {
    if (!value) return
    const selected = railRef.current?.querySelector<HTMLElement>(
      `[data-date="${value}"]`
    )
    selected?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [value])

  function onKeyDown(event: React.KeyboardEvent): void {
    const delta =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (delta === 0) return
    event.preventDefault()

    const currentIndex = days.findIndex((d) => d.date === value)
    // Skip over full days so the arrow keys never land on something unpickable.
    for (
      let i = currentIndex + delta;
      i >= 0 && i < days.length;
      i += delta
    ) {
      const candidate = days[i]
      if (candidate?.hasAvailability) {
        onChange(candidate.date)
        return
      }
    }
  }

  return (
    <div
      ref={railRef}
      role="radiogroup"
      aria-label="Choose a date"
      onKeyDown={onKeyDown}
      className={cn('no-scrollbar -mt-1 flex gap-2 overflow-x-auto pt-1 pb-1', className)}
    >
      {days.map((day) => {
        const selected = day.date === value
        return (
          <button
            key={day.date}
            type="button"
            role="radio"
            aria-checked={selected}
            data-date={day.date}
            disabled={!day.hasAvailability}
            // Only the selected chip is in the tab order; arrow keys move
            // between them, which is how a radio group is meant to behave.
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(day.date)}
            aria-label={
              day.hasAvailability
                ? relativeDateLabel(day.date)
                : `${relativeDateLabel(day.date)}, fully booked`
            }
            className={cn(
              'flex min-h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-card border',
              'transition-colors duration-[var(--duration-fast)]',
              !day.hasAvailability
                ? 'cursor-not-allowed border-border bg-surface text-muted'
                : selected
                  ? 'border-brand bg-brand text-bg'
                  : 'border-border bg-bg text-ink hover:border-brand'
            )}
          >
            <span className="text-[11px] uppercase tracking-wide opacity-70">
              {weekdayShort(day.date)}
            </span>
            <span className="text-lg font-bold leading-none">
              {dayOfMonth(day.date)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
