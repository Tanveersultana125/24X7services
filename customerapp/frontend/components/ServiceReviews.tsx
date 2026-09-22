'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import type { ServiceReview } from '@app/shared'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * What people said about this service.
 *
 * The breakdown is above the list because it is the honest summary and the
 * list is the evidence: five bars say at a glance whether a 4.6 is everybody
 * agreeing or two camps averaging out, and those are very different services
 * to book. The counts are drawn from the reviews on screen, so the bars and
 * the rows underneath cannot disagree.
 *
 * Nothing is filtered and nothing is sorted by sentiment. The list is newest
 * first, ones and fives together, because a page that quietly floats its good
 * reviews is a page whose good reviews stop meaning anything. The bad ones
 * are also the ones that tell somebody what actually goes wrong here, which is
 * the question they came to this section with.
 *
 * Ten at a time. A service with two hundred reviews is two hundred rows
 * between the customer and the button that books it.
 */

const PAGE = 10

export function ServiceReviews({
  reviews,
  className,
}: {
  reviews: readonly ServiceReview[]
  className?: string
}) {
  const [shown, setShown] = useState(PAGE)

  if (reviews.length === 0) return null

  const total = reviews.length
  const sum = reviews.reduce((all, review) => all + review.rating, 0)
  const average = Math.round((sum / total) * 10) / 10

  // Five buckets, five to one, in the order a breakdown is always read.
  const buckets = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((review) => review.rating === star).length,
  }))

  return (
    <section className={cn('mt-8', className)}>
      <h2 className="text-xl font-bold text-ink">What customers said</h2>

      <div className="mt-3 flex items-start gap-5">
        <div className="shrink-0 text-center">
          <p className="flex items-center gap-1 text-3xl font-bold text-ink">
            <Star className="size-6 fill-ink text-ink" aria-hidden="true" />
            {average.toFixed(1)}
          </p>
          <p className="mt-0.5 text-xs text-muted tabular-nums">
            {total} {total === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        <ul className="min-w-0 flex-1">
          {buckets.map((bucket) => (
            <li key={bucket.star} className="flex items-center gap-2 py-0.5">
              <span className="w-3 shrink-0 text-xs text-muted tabular-nums">
                {bucket.star}
              </span>
              <Star
                className="size-3 shrink-0 fill-muted text-muted"
                aria-hidden="true"
              />
              <span
                aria-hidden="true"
                className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-pill bg-surface"
              >
                <span
                  className="block h-full rounded-pill bg-ink"
                  style={{ width: `${(bucket.count / total) * 100}%` }}
                />
              </span>
              <span className="w-8 shrink-0 text-right text-xs text-muted tabular-nums">
                {bucket.count}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="mt-5 divide-y divide-border border-t border-border">
        {reviews.slice(0, shown).map((review) => (
          <li key={review.id} className="py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-base font-semibold text-ink">
                {review.authorName}
              </p>
              <Score rating={review.rating} />
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {relativeTime(review.createdAt)}
            </p>
            {review.text ? (
              <p className="mt-2 text-sm leading-relaxed text-ink">
                {review.text}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {shown < total ? (
        <button
          type="button"
          onClick={() => setShown((count) => count + PAGE)}
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-card border border-border text-sm font-semibold text-ink hover:border-brand hover:text-brand"
        >
          Show more reviews
        </button>
      ) : null}
    </section>
  )
}

/**
 * The score on one review.
 *
 * Green or red rather than a row of stars: at this size five stars is a smear,
 * and the only thing anybody reads off a single review's score is whether it
 * went well. The number is there for everyone who cannot tell the two colours
 * apart.
 */
function Score({ rating }: { rating: number }) {
  const good = rating >= 4
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-card px-2 py-1 text-xs font-bold',
        good ? 'bg-success text-white' : 'bg-error text-white'
      )}
    >
      <Star className="size-3 fill-current" aria-hidden="true" />
      {rating}
    </span>
  )
}
