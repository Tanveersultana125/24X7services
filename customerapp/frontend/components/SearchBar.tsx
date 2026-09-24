'use client'

import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * The search field on Home and on /search.
 *
 * On Home it is a button that navigates rather than a live field: a customer
 * typing into a box that sits above a scrolling page expects results, and a
 * static export cannot stream them in under the fold. Tapping opens /search,
 * where the field is real.
 */

export interface SearchBarProps {
  /** Rotates through these when the field is empty and not focused. */
  placeholders?: readonly string[]
  value?: string
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
  /** Renders as a button that calls onOpen instead of an editable field. */
  readOnly?: boolean
  onOpen?: () => void
  autoFocus?: boolean
  /** For the ink header on Home, where the default grey fill disappears. */
  onDark?: boolean
  className?: string
}

const DEFAULT_PLACEHOLDERS = [
  'Search "AC service"',
  'Search "fridge not cooling"',
  'Search "washing machine repair"',
  'Search "geyser installation"',
] as const

export function SearchBar({
  placeholders = DEFAULT_PLACEHOLDERS,
  value,
  onChange,
  onSubmit,
  readOnly = false,
  onOpen,
  autoFocus = false,
  onDark = false,
  className,
}: SearchBarProps) {
  const [index, setIndex] = useState(0)

  // The rotation is decoration. Anyone who has asked for less motion gets a
  // single fixed placeholder instead of a line that changes under them.
  useEffect(() => {
    if (placeholders.length < 2) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % placeholders.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [placeholders.length])

  const placeholder = placeholders[index] ?? placeholders[0] ?? 'Search'

  const shell =
    'flex min-h-12 w-full items-center gap-2.5 rounded-pill border px-4 text-left'

  if (readOnly) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          shell,
          onDark
            ? 'border-transparent bg-bg'
            : 'border-border bg-surface hover:border-brand',
          className
        )}
      >
        <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
        <span className="truncate text-sm text-muted">{placeholder}</span>
      </button>
    )
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.(value ?? '')
      }}
      className={cn(shell, 'border-border bg-bg focus-within:border-brand', className)}
    >
      <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
      <input
        type="search"
        // Native search inputs draw their own clear button in WebKit, which
        // sits next to ours and does something slightly different.
        autoComplete="off"
        autoFocus={autoFocus}
        aria-label="Search services, appliances and issues"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
        // No focus halo of its own (globals.css leaves search fields out): the
        // pill's border already turns brand on focus.
        className="min-h-0 flex-1 bg-transparent text-base text-ink outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange?.('')}
          aria-label="Clear search"
          className="-mr-2 flex size-11 items-center justify-center rounded-full text-muted hover:text-ink"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </form>
  )
}
