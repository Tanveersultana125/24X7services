'use client'

import { useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import type { ServiceReview } from '@app/shared'
import { BottomSheet } from '@/components/BottomSheet'
import { countNote } from '@/components/ServiceScore'
import { cn } from '@/lib/cn'

/**
 * What opens from the rating under an appliance's name: the score, how the
 * written reviews spread across the five stars, and the reviews themselves,
 * in a panel from the bottom — the way the marketplaces answer "4.78 out of
 * what?" without taking the customer off the page they are choosing on.
 *
 * Two different numbers are on it, and it says which is which. The score and
 * its count are every rating the services here have had; the bars and the
 * list are the ratings that came with words. Scaling the bars up to the big
 * count would be inventing a distribution nobody measured.
 *
 * The chips narrow the list rather than re-sort the page: the newest first by
 * default, the longest first under "Most detailed", or one service's alone.
 * Tapping a bar keeps only that many stars, and tapping it again lets go.
 */

type Order = 'recent' | 'detailed'

export function ReviewsSheet({
  open,
  onClose,
  title,
  rating,
  ratingCount,
  reviews,
  serviceNames,
}: {
  open: boolean
  onClose: () => void
  /** "Washing Machine reviews". */
  title: string
  rating?: number
  ratingCount?: number
  reviews: readonly ServiceReview[]
  /** Short names per service, for the chips and the line under each author. */
  serviceNames: ReadonlyMap<ServiceReview['serviceKey'], string>
}) {
  const [order, setOrder] = useState<Order>('recent')
  const [service, setService] = useState<ServiceReview['serviceKey'] | null>(
    null
  )
  const [stars, setStars] = useState<number | null>(null)

  const byStar = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]
    for (const review of reviews) {
      const index = Math.min(5, Math.max(1, Math.round(review.rating))) - 1
      counts[index] = (counts[index] ?? 0) + 1
    }
    return counts
  }, [reviews])
  const most = Math.max(1, ...byStar)

  const reviewedServices = useMemo(
    () => [...new Set(reviews.map((review) => review.serviceKey))],
    [reviews]
  )

  const shown = useMemo(() => {
    const kept = reviews.filter(
      (review) =>
        (service === null || review.serviceKey === service) &&
        (stars === null || Math.round(review.rating) === stars)
    )
    return [...kept].sort((a, b) =>
      order === 'detailed'
        ? (b.text?.length ?? 0) - (a.text?.length ?? 0)
        : b.createdAt - a.createdAt
    )
  }, [reviews, service, stars, order])

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      {rating !== undefined ? (
        <div>
          <p className="flex items-center gap-1.5 text-4xl font-bold text-ink">
            <Star className="size-7 fill-ink text-ink" aria-hidden="true" />
            {rating.toFixed(2)}
          </p>
          {ratingCount !== undefined ? (
            <p className="mt-1 text-base text-muted">
              {countNote(ratingCount)} ratings
            </p>
          ) : null}
        </div>
      ) : null}

      {reviews.length > 0 ? (
        <>
          <ul className="mt-5 flex flex-col gap-1" aria-label="Written reviews by stars">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = byStar[star - 1] ?? 0
              const on = stars === star
              return (
                <li key={star}>
                  <button
                    type="button"
                    onClick={() => setStars(on ? null : star)}
                    aria-pressed={on}
                    aria-label={`${star} stars, ${count} ${count === 1 ? 'review' : 'reviews'}`}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-md py-2 text-left',
                      stars !== null && !on && 'opacity-40'
                    )}
                  >
                    <span className="flex w-8 shrink-0 items-center gap-1 text-base text-ink">
                      <Star className="size-3.5 fill-ink text-ink" aria-hidden="true" />
                      {star}
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-pill bg-surface">
                      <span
                        className="block h-full rounded-pill bg-ink"
                        style={{ width: `${(count / most) * 100}%` }}
                      />
                    </span>
                    <span className="w-10 shrink-0 text-right text-base text-muted tabular-nums">
                      {count}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="mt-2 text-xs text-muted">
            From {reviews.length} written{' '}
            {reviews.length === 1 ? 'review' : 'reviews'}. Tap a bar to see
            only those.
          </p>
        </>
      ) : null}

      <div className="-mx-5 mt-6 h-2 bg-surface" aria-hidden="true" />

      <h3 className="mt-6 text-2xl font-bold text-ink">All reviews</h3>

      <div
        className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1"
        role="group"
        aria-label="Sort and filter reviews"
      >
        <Chip on={order === 'recent'} onClick={() => setOrder('recent')}>
          Most recent
        </Chip>
        <Chip on={order === 'detailed'} onClick={() => setOrder('detailed')}>
          Most detailed
        </Chip>
        {reviewedServices.length > 1
          ? reviewedServices.map((key) => (
              <Chip
                key={key}
                on={service === key}
                onClick={() => setService(service === key ? null : key)}
              >
                {serviceNames.get(key) ?? key}
              </Chip>
            ))
          : null}
      </div>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          {reviews.length === 0
            ? 'No written reviews yet.'
            : 'No reviews match. Clear a filter to see more.'}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {shown.map((review) => (
            <li key={review.id} className="py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-ink">
                    {review.authorName}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {formatReviewDate(review.createdAt)}
                    {serviceNames.get(review.serviceKey) ? (
                      <>
                        {' · For '}
                        {serviceNames.get(review.serviceKey)}
                      </>
                    ) : null}
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-white',
                    review.rating >= 4
                      ? 'bg-success'
                      : review.rating >= 3
                        ? 'bg-warning'
                        : 'bg-error'
                  )}
                  aria-label={`${review.rating} out of 5`}
                >
                  <Star className="size-3.5 fill-white" aria-hidden="true" />
                  {review.rating}
                </span>
              </div>
              {review.text ? (
                <p className="mt-3 text-base leading-relaxed text-ink">
                  {review.text}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  )
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        'shrink-0 rounded-card border px-4 py-2.5 text-sm whitespace-nowrap transition-colors duration-[var(--duration-fast)]',
        on
          ? 'border-ink bg-ink text-bg'
          : 'border-border bg-bg text-muted hover:border-ink hover:text-ink'
      )}
    >
      {children}
    </button>
  )
}

/** "Sep 26, 2026", as the list reads it. */
function formatReviewDate(ms: number): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ms))
}
