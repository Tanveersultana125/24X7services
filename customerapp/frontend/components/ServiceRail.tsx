'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { formatPaise } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * A sideways row of bookable things: what people book most, and then one row
 * per appliance.
 *
 * A rail rather than a grid because these rows are browsable, not a decision —
 * a customer who already knows they want an AC service taps it from here, and
 * everyone else keeps scrolling down past it. A grid of four services per
 * appliance would push the fifth appliance two screens down.
 *
 * Each card carries two separate targets, side by side rather than nested: the
 * picture and the name open the appliance, where the full description and the
 * warranty live, and the button starts the booking. Nesting the second inside
 * the first is the usual way this is built and it leaves a screen reader with
 * one control that does two things.
 */

export interface ServiceRailItem {
  id: string
  name: string
  /** The appliance photo. These rails are never about a specific unit. */
  image?: string
  /** Where the name and the picture go — the appliance page. */
  href: Route
  /** "About 1 hr", or whatever else is worth knowing before a slot is picked. */
  note?: string
  /** What the number underneath is: "Visit fee", "From". */
  priceLabel: string
  /** Paise. Formatted here so no caller has to remember to. */
  price: number
  onBook: () => void
}

export function ServiceRail({
  items,
  className,
}: {
  items: readonly ServiceRailItem[]
  className?: string
}) {
  if (items.length === 0) return null

  return (
    <ul
      className={cn(
        'no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 lg:mx-0 lg:px-0',
        className
      )}
    >
      {items.map((item) => (
        <li key={item.id} className="flex w-40 shrink-0 snap-start flex-col">
          <Link href={item.href} className="group block">
            <span className="relative block aspect-square overflow-hidden rounded-card bg-surface transition-colors duration-[var(--duration-fast)] group-hover:bg-border">
              {item.image ? (
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-contain p-5"
                />
              ) : null}
            </span>
            <span className="mt-2.5 block line-clamp-2 text-sm font-semibold leading-snug text-ink">
              {item.name}
            </span>
          </Link>

          {item.note ? (
            <p className="mt-1 text-xs text-muted">{item.note}</p>
          ) : null}

          {/* Pushed to the bottom so the prices line up across cards whose
              names ran to one line and cards whose names ran to two. */}
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <span className="min-w-0">
              <span className="block text-[11px] leading-none text-muted">
                {item.priceLabel}
              </span>
              <span className="mt-1 block text-sm font-bold text-ink">
                {formatPaise(item.price)}
              </span>
            </span>
            <button
              type="button"
              onClick={item.onBook}
              aria-label={`Book ${item.name}`}
              className="inline-flex h-11 shrink-0 items-center rounded-pill border border-brand px-3.5 text-sm font-semibold text-brand transition-colors duration-[var(--duration-fast)] hover:bg-brand hover:text-bg"
            >
              Book
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** "About 1 hr 30 mins" — the line under a rail card's name. */
export function durationNote(minutes: number | undefined): string | undefined {
  if (minutes === undefined || minutes <= 0) return undefined
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `About ${rest} mins`
  const hourPart = `${hours} hr${hours > 1 ? 's' : ''}`
  return rest === 0 ? `About ${hourPart}` : `About ${hourPart} ${rest} mins`
}
