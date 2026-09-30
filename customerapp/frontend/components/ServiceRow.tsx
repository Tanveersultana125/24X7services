'use client'

import Image from 'next/image'
import { Star } from 'lucide-react'
import { countNote } from '@/components/ServiceScore'
import { cn } from '@/lib/cn'

/**
 * One thing to book in an appliance page's list, laid out as the marketplaces
 * lay theirs out: the words on the left — name, score, price, a rule, what it
 * covers, "View details" — and the picture on the right with "Add" sitting
 * across its bottom edge and the count of options under that.
 *
 * It holds no opinions about what it is showing. A service and a yearly plan
 * both render through it; the caller hands it the lines and the button.
 *
 * Two things to press, as on `ServiceCard`: the action, and anywhere else on
 * the row, which opens the details. The row is not a button with the action
 * inside — a button inside a button is invalid and a screen reader cannot say
 * where one ends — so the open-the-details button is stretched across the row
 * underneath, and the action sits above it.
 */

export interface ServiceRowProps {
  id?: string
  title: string
  rating?: number
  reviewCount?: number
  /** "Starts at ₹299", with any struck-through price already inside it. */
  price: React.ReactNode
  /** A green line under the price: "Save 22% on separate visits". */
  offer?: string
  points: readonly string[]
  photo?: string
  /** Rendered over the picture's bottom edge. */
  action: React.ReactNode
  /** "7 options", under the action. */
  actionNote?: string
  onOpen: () => void
  /** Spoken for the stretched open-the-details button. */
  openLabel: string
  className?: string
}

export function ServiceRow({
  id,
  title,
  rating,
  reviewCount,
  price,
  offer,
  points,
  photo,
  action,
  actionNote,
  onOpen,
  openLabel,
  className,
}: ServiceRowProps) {
  return (
    <div
      id={id}
      className={cn('group relative isolate flex gap-4 py-6', className)}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={openLabel}
        className="absolute inset-0 z-10 rounded-card"
      />

      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold leading-snug text-ink">{title}</h3>

        {rating !== undefined && reviewCount !== undefined ? (
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted underline decoration-border decoration-dotted underline-offset-4">
            <Star className="size-3.5 fill-ink text-ink" aria-hidden="true" />
            <span>
              {rating.toFixed(2)} ({countNote(reviewCount)} reviews)
            </span>
          </p>
        ) : null}

        <p className="mt-2 text-sm font-semibold text-ink">{price}</p>
        {offer ? (
          <p className="mt-1 text-sm font-medium text-success">{offer}</p>
        ) : null}

        {points.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-1.5 border-t border-dashed border-border pt-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-muted"
                />
                <span className="text-sm leading-relaxed text-muted">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <span
          aria-hidden="true"
          className="mt-3 inline-flex text-sm font-bold text-brand transition-colors duration-[var(--duration-fast)] group-hover:text-brand-deep"
        >
          View details
        </span>
      </div>

      {/* The picture, with the action across its foot. The column is as wide
          as the picture plus the half of the button that hangs below it. */}
      <div className="relative w-[36%] max-w-40 shrink-0">
        <span className="relative block aspect-square overflow-hidden rounded-card bg-plate">
          {photo ? (
            <Image
              src={photo}
              alt=""
              fill
              sizes="(min-width: 640px) 160px, 36vw"
              className="object-cover"
            />
          ) : null}
        </span>
        <div className="relative z-20 -mt-5 flex flex-col items-center">
          {action}
          {actionNote ? (
            <span className="mt-1 text-xs text-muted">{actionNote}</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
