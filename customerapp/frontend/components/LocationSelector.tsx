'use client'

import { ChevronDown, MapPin } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * The pill at the top of Home: "Service at · Home · Kondapur". Tapping it opens
 * the location screen.
 *
 * The wording is "Service at", not "Delivering to" — nothing is being
 * delivered, and the difference matters to someone deciding whether this app
 * covers their address.
 */

export interface LocationSelectorProps {
  /** The saved address label, when the customer picked one: Home, Office. */
  label?: string
  /** The area and city, or just the pincode before an address is saved. */
  area?: string
  onClick: () => void
  /** Set while the pincode is being checked against serviceAreas. */
  loading?: boolean
  className?: string
}

export function LocationSelector({
  label,
  area,
  onClick,
  loading = false,
  className,
}: LocationSelectorProps) {
  const chosen = Boolean(area)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-11 max-w-full items-center gap-1.5 rounded-pill px-1 text-left',
        'hover:bg-surface',
        className
      )}
      aria-label={
        chosen
          ? `Service at ${label ? `${label}, ` : ''}${area}. Change location`
          : 'Set your location'
      }
    >
      <MapPin className="size-4 shrink-0 text-ink" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-[11px] leading-none text-muted">
          Service at
        </span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-ink">
          {loading
            ? 'Checking…'
            : chosen
              ? [label, area].filter(Boolean).join(' · ')
              : 'Set location'}
        </span>
      </span>
      <ChevronDown className="size-4 shrink-0 text-muted" aria-hidden="true" />
    </button>
  )
}
