import { Star } from 'lucide-react'
import type { Review } from '@app/shared'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Chip'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * A review the customer left. Read-only — reviews go in through submitReview,
 * once, and only for a completed booking.
 */

export interface ReviewCardProps {
  review: Pick<Review, 'rating' | 'techRating' | 'tags' | 'text' | 'createdAt'>
  /** The service the review was left against, resolved by the caller. */
  serviceName?: string
  technicianName?: string
  className?: string
}

export function ReviewCard({
  review,
  serviceName,
  technicianName,
  className,
}: ReviewCardProps) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {serviceName ? (
            <h3 className="truncate text-sm font-semibold text-ink">
              {serviceName}
            </h3>
          ) : null}
          <p className="mt-0.5 text-xs text-muted">
            {relativeTime(review.createdAt)}
          </p>
        </div>
        <Stars value={review.rating} label="Service rating" />
      </div>

      {review.text ? (
        <p className="mt-3 text-sm leading-relaxed text-ink">{review.text}</p>
      ) : null}

      {review.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      ) : null}

      {review.techRating && technicianName ? (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted">{technicianName}</span>
          <Stars value={review.techRating} label="Technician rating" size="sm" />
        </div>
      ) : null}
    </Card>
  )
}

/**
 * The rating, drawn as filled and hollow stars with the number stated for
 * anyone who is not reading the shapes.
 */
export function Stars({
  value,
  label,
  size = 'md',
  className,
}: {
  value: number
  label: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      role="img"
      aria-label={`${label}: ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            size === 'sm' ? 'size-3' : 'size-3.5',
            n <= value ? 'fill-ink text-ink' : 'text-border'
          )}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}
