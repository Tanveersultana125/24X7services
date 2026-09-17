'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * A selectable pill: appliance type, an issue, a review tag, a filter.
 *
 * Selection is carried by aria-pressed rather than colour alone, because in a
 * monochrome system "selected" and "unselected" are a black fill against a
 * white one — legible to look at, invisible to a screen reader.
 */

export interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'> {
  selected?: boolean
  /** Renders a tick inside the pill when selected. Off for single-choice rows. */
  showCheck?: boolean
}

export function Chip({
  selected = false,
  showCheck = false,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 rounded-pill border px-4 py-2',
        'text-sm font-medium whitespace-nowrap',
        'transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]',
        'disabled:cursor-not-allowed disabled:border-border disabled:text-muted',
        selected
          ? 'border-ink bg-ink text-bg'
          : 'border-border bg-bg text-ink hover:border-ink',
        className
      )}
      {...props}
    >
      {showCheck && selected ? (
        <Check className="size-4 shrink-0" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  )
}

/** A non-interactive pill, for read-only tags on a review or a booking. */
export function Tag({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill border border-border bg-surface px-3 py-1 text-xs font-medium text-ink',
        className
      )}
    >
      {children}
    </span>
  )
}
