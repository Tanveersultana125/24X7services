import type { Route } from 'next'
import { CalendarDays, ChevronRight, MapPin } from 'lucide-react'
import type { Booking } from '@app/shared'
import { CardLink } from '@/components/ui/Card'
import { StatusBadge } from '@/components/StatusBadge'
import { formatPaise, formatSlotWindow, relativeDateLabel } from '@/lib/format'
import { STATUS_PRESENTATION } from '@/lib/status'
import { cn } from '@/lib/cn'

/**
 * One booking in the list. It leads with what the customer is looking for — the
 * service and when someone is coming — and puts the reference last, because the
 * reference only matters once they are talking to support about it.
 */

export interface BookingCardProps {
  booking: Pick<
    Booking,
    | 'id'
    | 'displayId'
    | 'status'
    | 'slot'
    | 'price'
    | 'address'
    | 'technicianSnapshot'
  >
  /** The catalog name for the booked service, resolved by the caller. */
  serviceName: string
  className?: string
}

export function BookingCard({
  booking,
  serviceName,
  className,
}: BookingCardProps) {
  const { description } = STATUS_PRESENTATION[booking.status]

  return (
    <CardLink
      href={`/bookings/detail?id=${booking.id}` as Route}
      ariaLabel={`${serviceName}, ${booking.displayId}`}
      className={cn('p-4', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-ink">
            {serviceName}
          </h3>
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <dl className="mt-3 flex flex-col gap-1.5 text-sm">
        <div className="flex items-center gap-2">
          <dt className="sr-only">Slot</dt>
          <CalendarDays className="size-4 shrink-0 text-muted" aria-hidden="true" />
          <dd className="text-ink">
            {relativeDateLabel(booking.slot.date)},{' '}
            {formatSlotWindow(booking.slot.start, booking.slot.end)}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="sr-only">Address</dt>
          <MapPin className="size-4 shrink-0 text-muted" aria-hidden="true" />
          <dd className="truncate text-muted">
            {booking.address.area}, {booking.address.city}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted">{booking.displayId}</span>
        <span className="flex items-center gap-1 text-sm font-semibold text-ink">
          {formatPaise(booking.price.total)}
          <ChevronRight className="size-4 text-muted" aria-hidden="true" />
        </span>
      </div>
    </CardLink>
  )
}
