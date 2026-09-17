'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { Check, FileText, ShieldCheck, Star } from 'lucide-react'
import type { Booking, BookingEvent } from '@app/shared'

import { BookingShell } from '@/components/BookingShell'
import { PriceSummary } from '@/components/PriceSummary'
import { StatusTimeline } from '@/components/StatusTimeline'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/EmptyState'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/lib/auth'
import { CheckoutDismissed } from '@/lib/checkout'
import { friendlyError } from '@/lib/callables'
import { payBooking } from '@/lib/payBooking'
import { formatPaise } from '@/lib/format'

/**
 * The job, closed out.
 *
 * What is left after a visit is three things, and they are the three things on
 * this screen: what it cost, the paperwork it produced, and the chance to say
 * how it went. Anything still owed is the first thing, because a bill nobody
 * mentions is a bill that turns into a phone call.
 */
export function CompletedScreen() {
  return (
    <BookingShell title="Job complete">
      {({ booking, events }) => (
        <Completed booking={booking} events={events} />
      )}
    </BookingShell>
  )
}

function Completed({
  booking,
  events,
}: {
  booking: Booking
  events: BookingEvent[]
}) {
  const { user } = useAuth()
  const toast = useToast()
  const [paying, setPaying] = useState(false)

  if (booking.status !== 'completed') {
    return (
      <EmptyState
        className="py-16"
        icon={Check}
        title="Not finished yet"
        description="This screen fills in once your expert marks the job complete."
        action={{
          label: 'See the booking',
          href: `/bookings/detail?id=${booking.id}` as Route,
        }}
      />
    )
  }

  async function settle(): Promise<void> {
    setPaying(true)
    try {
      const outcome = await payBooking(booking.id, 'final_due', {
        name: user?.displayName ?? undefined,
        phone: user?.phoneNumber ?? undefined,
      })
      if (outcome.kind === 'paid') {
        toast.show('Payment received. Thank you.', { tone: 'success' })
      } else if (outcome.kind === 'unsettled') {
        toast.show(
          'Your payment went through but we could not update the booking. Support will sort it out.',
          { tone: 'error' }
        )
      }
    } catch (error) {
      if (!(error instanceof CheckoutDismissed)) {
        toast.show(friendlyError(error), { tone: 'error' })
      }
    } finally {
      setPaying(false)
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-soft">
          <Check className="size-7 text-success" aria-hidden="true" />
        </span>
        <h1 className="mt-3 text-2xl font-bold text-ink">All done</h1>
        <p className="mt-1 text-sm text-muted">
          {booking.displayId}
          {booking.technicianSnapshot
            ? ` · ${booking.technicianSnapshot.name}`
            : ''}
        </p>
      </div>

      {booking.price.due > 0 ? (
        <Card className="mt-6 border-warning p-4">
          <p className="text-sm font-semibold text-ink">
            {formatPaise(booking.price.due)} still to pay
          </p>
          <p className="mt-0.5 text-sm text-muted">
            The visit fee and everything you approved.
          </p>
          <Button className="mt-3" fullWidth loading={paying} onClick={settle}>
            Pay {formatPaise(booking.price.due)}
          </Button>
        </Card>
      ) : null}

      <PriceSummary className="mt-6" price={booking.price} />

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Action
          href={`/bookings/invoice?id=${booking.id}` as Route}
          label="Invoice"
          icon={FileText}
        />
        <Action
          href={`/bookings/warranty?id=${booking.id}` as Route}
          label="Warranty"
          icon={ShieldCheck}
        />
        <Action
          href={`/bookings/review?id=${booking.id}` as Route}
          label={booking.reviewId ? 'Your review' : 'Rate this job'}
          icon={Star}
        />
      </section>

      <section className="mt-7">
        <h2 className="mb-3 text-sm font-semibold text-muted">
          What happened
        </h2>
        <StatusTimeline events={events} />
      </section>
    </>
  )
}

function Action({
  href,
  label,
  icon: Icon,
}: {
  href: Route
  label: string
  icon: typeof FileText
}) {
  return (
    <Link
      href={href}
      className="flex min-h-12 items-center justify-center gap-2 rounded-card border border-border text-sm font-semibold text-ink hover:border-ink"
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </Link>
  )
}
