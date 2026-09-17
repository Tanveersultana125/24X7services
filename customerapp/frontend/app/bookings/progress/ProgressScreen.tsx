'use client'

import { Check, Loader2 } from 'lucide-react'
import type { Booking, BookingEvent, BookingStage } from '@app/shared'

import { BookingShell } from '@/components/BookingShell'
import { StatusTimeline } from '@/components/StatusTimeline'
import { JobOtpPanel } from '@/components/JobOtpPanel'
import { Card } from '@/components/ui/Card'
import { STAGE_LABEL, STAGE_ORDER } from '@/lib/status'
import { cn } from '@/lib/cn'

/**
 * The job, as it happens.
 *
 * Four stages, in order, with the one underway marked. It is deliberately not a
 * percentage: nobody can say a repair is 40% done, and a bar that creeps
 * forward on a timer is a bar that lies when the job runs long.
 *
 * A stage the booking has passed is ticked, the current one spins, and the rest
 * wait. That is all a customer sitting in the next room needs from this screen —
 * that something is happening and roughly where it has got to.
 */

const STAGE_NOTE: Record<BookingStage, string> = {
  inspection: 'Your expert is looking at the appliance.',
  diagnosis: 'Working out what is causing the fault.',
  repair: 'Carrying out the work you approved.',
  testing: 'Checking it works before packing up.',
}

export function ProgressScreen() {
  return (
    <BookingShell title="Job progress">
      {({ booking, events }) => <Progress booking={booking} events={events} />}
    </BookingShell>
  )
}

function Progress({
  booking,
  events,
}: {
  booking: Booking
  events: BookingEvent[]
}) {
  const working =
    booking.status === 'in_progress' || booking.status === 'awaiting_approval'
  const currentIndex = booking.stage ? STAGE_ORDER.indexOf(booking.stage) : -1
  const finished = booking.status === 'completed'

  return (
    <>
      <p className="mt-5 text-sm leading-relaxed text-muted">
        {finished
          ? 'This job is finished. Your invoice and warranty are on the booking.'
          : working
            ? 'Your expert is working on the appliance. Nothing is charged beyond the visit fee unless you approve it.'
            : 'Work has not started yet. This screen fills in once your expert begins.'}
      </p>

      <ol className="mt-5 flex flex-col gap-2">
        {STAGE_ORDER.map((stage, index) => {
          const done = finished || (currentIndex >= 0 && index < currentIndex)
          const current = working && index === currentIndex
          return (
            <li key={stage}>
              <Card
                className={cn(
                  'flex items-start gap-3 p-4',
                  current && 'border-ink'
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border-2',
                    done || current ? 'border-ink' : 'border-border',
                    done && 'bg-ink text-bg'
                  )}
                  aria-hidden="true"
                >
                  {done ? (
                    <Check className="size-3.5" strokeWidth={3} />
                  ) : current ? (
                    <Loader2 className="size-3.5 animate-spin text-ink" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-sm',
                      current || done
                        ? 'font-semibold text-ink'
                        : 'font-medium text-muted'
                    )}
                  >
                    {STAGE_LABEL[stage]}
                  </span>
                  {current ? (
                    <span className="mt-0.5 block text-sm text-muted">
                      {STAGE_NOTE[stage]}
                    </span>
                  ) : null}
                </span>
              </Card>
            </li>
          )
        })}
      </ol>

      {booking.status === 'awaiting_approval' ? (
        <Card className="mt-5 border-warning bg-warning-soft p-4">
          <p className="text-sm font-semibold text-ink">
            Work is paused, waiting on you
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted">
            Your expert has found something else and sent a quote. Nothing
            further happens until you answer it.
          </p>
        </Card>
      ) : null}

      <JobOtpPanel className="mt-6" booking={booking} />

      <section className="mt-7">
        <h2 className="mb-3 text-sm font-semibold text-muted">What has happened</h2>
        <StatusTimeline events={events} live={working} />
      </section>
    </>
  )
}
