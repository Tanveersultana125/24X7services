import { Check } from 'lucide-react'
import type { BookingEvent } from '@app/shared'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * What has happened to a booking, in order.
 *
 * It renders the `events` subcollection rather than deriving steps from the
 * current status, so a booking that went through awaiting_approval and back
 * shows both passes instead of a tidy line that never happened.
 *
 * The list is ordered oldest-first and marked as such, because a timeline read
 * out of order tells a different story.
 */

export interface StatusTimelineProps {
  events: readonly BookingEvent[]
  /** Highlights the last entry as the state the booking is in right now. */
  live?: boolean
  className?: string
}

export function StatusTimeline({
  events,
  live = false,
  className,
}: StatusTimelineProps) {
  if (events.length === 0) return null

  return (
    <ol className={cn('flex flex-col', className)}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1
        const isCurrent = live && isLast

        return (
          <li key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border-2',
                  isCurrent
                    ? 'border-brand bg-bg'
                    : 'border-brand bg-brand text-bg'
                )}
                aria-hidden="true"
              >
                {isCurrent ? (
                  <span className="size-2 rounded-full bg-brand" />
                ) : (
                  <Check className="size-3.5" strokeWidth={3} />
                )}
              </span>
              {/* The connector stops at the last entry so the line does not
                  trail off into a step that has not happened. */}
              {!isLast ? (
                <span className="w-0.5 flex-1 bg-border" aria-hidden="true" />
              ) : null}
            </div>

            <div className={cn('min-w-0 flex-1', isLast ? 'pb-0' : 'pb-5')}>
              <p
                className={cn(
                  'text-sm',
                  isCurrent ? 'font-semibold text-ink' : 'font-medium text-ink'
                )}
              >
                {event.title}
              </p>
              {event.note ? (
                <p className="mt-0.5 text-sm text-muted">{event.note}</p>
              ) : null}
              <p className="mt-0.5 text-xs text-muted">
                {formatDateTime(event.at)}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
