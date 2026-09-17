'use client'

import { Clock, MapPin } from 'lucide-react'
import { TRACKABLE_STATUSES, type Booking } from '@app/shared'

import { BookingShell } from '@/components/BookingShell'
import { TrackingMap } from '@/components/TrackingMap'
import { TechnicianCard } from '@/components/TechnicianCard'
import { StatusBadge } from '@/components/StatusBadge'
import { JobOtpPanel } from '@/components/JobOtpPanel'
import { Card } from '@/components/ui/Card'
import { useTracking } from '@/lib/useTracking'
import { relativeTime, shortAddress } from '@/lib/format'
import { STATUS_PRESENTATION } from '@/lib/status'

/**
 * Where the expert is.
 *
 * The ETA leads, because it is the only thing on this screen anyone is actually
 * waiting for — the map shows it, the number says it. Both come from the
 * tracking document the technician's side writes; nothing here estimates
 * anything, so the app never contradicts what the expert was told.
 *
 * "Last updated" is shown rather than hidden. A position that stopped moving
 * ten minutes ago is worth knowing about, and a stale marker with no timestamp
 * is how a customer ends up waiting at a window for someone who is stuck in
 * traffic with no signal.
 */
export function TrackScreen() {
  return (
    <BookingShell title="Track your expert">
      {({ booking }) => <Track booking={booking} />}
    </BookingShell>
  )
}

function Track({ booking }: { booking: Booking }) {
  const tracking = useTracking(booking.id)
  const onTheWay = TRACKABLE_STATUSES.includes(booking.status)
  const eta = tracking?.etaMinutes ?? booking.etaMinutes

  return (
    <>
      <div className="mt-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-ink">
            {STATUS_PRESENTATION[booking.status].label}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {STATUS_PRESENTATION[booking.status].description}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <TrackingMap
        className="mt-5"
        technician={tracking?.techLocation}
        customer={tracking?.customerLocation ?? booking.address.geo}
      />

      <Card className="mt-4 flex flex-col gap-4 p-4">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Arriving in</p>
            <p className="mt-0.5 text-lg font-bold text-ink">
              {!onTheWay
                ? '—'
                : eta === undefined
                  ? 'Working it out'
                  : eta <= 1
                    ? 'Any moment'
                    : `About ${eta} minutes`}
            </p>
            {tracking?.updatedAt ? (
              <p className="mt-0.5 text-xs text-muted">
                Updated {relativeTime(tracking.updatedAt)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Coming to</p>
            <p className="mt-0.5 text-sm font-medium leading-relaxed text-ink">
              {shortAddress(booking.address)}
            </p>
          </div>
        </div>
      </Card>

      {booking.technicianSnapshot ? (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-muted">Your expert</h2>
          <TechnicianCard
            technician={booking.technicianSnapshot}
            maskedNumber={booking.contact?.maskedNumber}
          />
        </section>
      ) : null}

      <JobOtpPanel className="mt-6" booking={booking} />

      {!onTheWay ? (
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Live tracking appears while your expert is on the way. Right now this
          booking is {STATUS_PRESENTATION[booking.status].label.toLowerCase()}.
        </p>
      ) : null}
    </>
  )
}
