'use client'

import { ChevronDown, MapPin } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * The first line of Home: where the work is going to happen.
 *
 * Two lines, the area on top in the larger type. That is the part a customer
 * scans to check the app is pointed at the right place — the city and pincode
 * underneath are only there to settle it when two areas share a name. An
 * eyebrow reading "Service at" in small grey caps used to sit above both, which
 * spent the most prominent line on a label nobody needs to read twice.
 *
 * The wording elsewhere stays "service", not "delivery" — nothing is being
 * delivered, and the difference matters to someone deciding whether this app
 * covers their address.
 */

export interface LocationSelectorProps {
  /** The area: the line someone actually reads. */
  area?: string
  /** City and pincode, under it. */
  detail?: string
  onClick: () => void
  /** Set while the pincode is being checked against serviceAreas. */
  loading?: boolean
  /** For the brand-coloured header on Home: white text instead of ink. */
  onDark?: boolean
  className?: string
}

export function LocationSelector({
  area,
  detail,
  onClick,
  loading = false,
  onDark = false,
  className,
}: LocationSelectorProps) {
  const chosen = Boolean(area)

  const headline = loading ? 'Checking…' : chosen ? area : 'Set your location'
  const sub = loading
    ? undefined
    : chosen
      ? detail
      : 'So we can check whether we cover it'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex max-w-full items-start gap-1.5 rounded-card px-1 py-1 text-left',
        onDark ? 'hover:bg-bg/10' : 'hover:bg-surface',
        className
      )}
      aria-label={
        chosen
          ? `Service at ${[area, detail].filter(Boolean).join(', ')}. Change location`
          : 'Set your location'
      }
    >
      <MapPin
        className={cn(
          'mt-0.5 size-5 shrink-0',
          onDark ? 'text-bg' : 'text-brand'
        )}
        aria-hidden="true"
      />
      <span className="min-w-0">
        <span
          className={cn(
            'block truncate text-lg font-bold leading-tight',
            onDark ? 'text-bg' : 'text-ink'
          )}
        >
          {headline}
        </span>
        {sub ? (
          <span className="mt-0.5 flex items-center gap-1">
            <span
              className={cn(
                'min-w-0 truncate text-sm',
                onDark ? 'text-bg/75' : 'text-muted'
              )}
            >
              {sub}
            </span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0',
                onDark ? 'text-bg/75' : 'text-muted'
              )}
              aria-hidden="true"
            />
          </span>
        ) : null}
      </span>
    </button>
  )
}
