'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import {
  CalendarDays,
  FileText,
  MapPin,
  Navigation,
  ShieldCheck,
  Star,
  Wrench,
} from 'lucide-react'
import {
  ACTIVE_STATUSES,
  TRACKABLE_STATUSES,
  type Booking,
  type BookingEvent,
} from '@app/shared'

import { BookingShell } from '@/components/BookingShell'
import { StatusBadge } from '@/components/StatusBadge'
import { StatusTimeline } from '@/components/StatusTimeline'
import { TechnicianCard } from '@/components/TechnicianCard'
import { PriceSummary } from '@/components/PriceSummary'
import { JobOtpPanel } from '@/components/JobOtpPanel'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/lib/auth'
import { CheckoutDismissed } from '@/lib/checkout'
import { friendlyError } from '@/lib/callables'
import { payBooking } from '@/lib/payBooking'
import {
  formatPaise,
  formatSlotWindow,
  relativeDateLabel,
  shortAddress,
} from '@/lib/format'
import { STATUS_PRESENTATION } from '@/lib/status'

/**
 * Everything about one booking, and every door out of it.
 *
 * The screen changes shape with the status, because what a customer wants from
 * a booking is different at every stage: before the visit it is when and where,
 * during it it is where the expert is, and after it is the invoice and the
 * warranty. Whatever matters most right now is the first thing on the screen
 * and the only full-width button.
 */
export function DetailScreen() {
  return (
    <BookingShell title="Your booking" backFallback="/bookings">
      {({ booking, events }) => (
        <Detail booking={booking} events={events} />
      )}
    </BookingShell>
  )
}

function Detail({
  booking,
  events,
}: {
  booking: Booking
  events: BookingEvent[]
}) {
  const { user } = useAuth()
  const toast = useToast()
  const [paying, setPaying] = useState(false)

  const presentation = STATUS_PRESENTATION[booking.status]
  const live = ACTIVE_STATUSES.includes(booking.status)
  const trackable = TRACKABLE_STATUSES.includes(booking.status)

  async function settle(): Promise<void> {
    setPaying(true)
    try {
      const outcome = await payBooking(
        booking.id,
        booking.status === 'pending_payment' ? 'visit_fee' : 'final_due',
        {
          name: user?.displayName ?? undefined,
          phone: user?.phoneNumber ?? undefined,
        }
      )
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
      <section className="mt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-ink">
              {booking.displayId}
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              {presentation.description}
            </p>
          </div>
          <StatusBadge status={booking.status} />
        </div>
      </section>

      {/* The one thing to do right now, whatever that is. */}
      {booking.status === 'awaiting_approval' ? (
        <PrimaryAction
          href={`/bookings/approval?id=${booking.id}` as Route}
          label="Review the quote"
          note="Work is paused until you answer."
          icon={Wrench}
        />
      ) : trackable ? (
        <PrimaryAction
          href={`/bookings/track?id=${booking.id}` as Route}
          label="Track your expert"
          note={
            booking.etaMinutes
              ? `About ${booking.etaMinutes} minutes away.`
              : 'See where they are on the way.'
          }
          icon={Navigation}
        />
      ) : booking.status === 'in_progress' ? (
        <PrimaryAction
          href={`/bookings/progress?id=${booking.id}` as Route}
          label="See progress"
          note="Follow the job as it happens."
          icon={Wrench}
        />
      ) : null}

      {booking.status === 'pending_payment' || booking.price.due > 0 ? (
        <Card className="mt-4 p-4">
          <p className="text-sm font-semibold text-ink">
            {booking.status === 'pending_payment'
              ? 'Your slot is held until the visit fee is paid'
              : 'There is a balance to settle'}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {booking.status === 'pending_payment'
              ? 'Pay now to confirm this booking.'
              : 'Pay the remaining amount for this job.'}
          </p>
          <Button className="mt-3" fullWidth loading={paying} onClick={settle}>
            Pay {formatPaise(booking.price.due || booking.price.total)}
          </Button>
        </Card>
      ) : null}

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

      <Card className="mt-6 flex flex-col gap-4 p-4">
        <Row icon={CalendarDays} label="When">
          {relativeDateLabel(booking.slot.date)},{' '}
          {formatSlotWindow(booking.slot.start, booking.slot.end)}
        </Row>
        <Row icon={MapPin} label="Where">
          {shortAddress(booking.address)}
          {booking.address.landmark ? (
            <span className="block text-xs text-muted">
              Near {booking.address.landmark}
            </span>
          ) : null}
        </Row>
      </Card>

      {booking.status === 'completed' ? (
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <Secondary
            href={`/bookings/invoice?id=${booking.id}` as Route}
            label="Invoice"
            icon={FileText}
          />
          <Secondary
            href={`/bookings/warranty?id=${booking.id}` as Route}
            label="Warranty"
            icon={ShieldCheck}
          />
          <Secondary
            href={`/bookings/review?id=${booking.id}` as Route}
            label={booking.reviewId ? 'Your review' : 'Leave a review'}
            icon={Star}
          />
        </section>
      ) : null}

      <section className="mt-7">
        <h2 className="mb-3 text-sm font-semibold text-muted">What has happened</h2>
        <StatusTimeline events={events} live={live} />
      </section>

      <section className="mt-7">
        <h2 className="mb-3 text-sm font-semibold text-muted">The cost</h2>
        <PriceSummary price={booking.price} />
      </section>
    </>
  )
}

// ---------------------------------------------------------------------------

function PrimaryAction({
  href,
  label,
  note,
  icon: Icon,
}: {
  href: Route
  label: string
  note: string
  icon: typeof Wrench
}) {
  return (
    <Link
      href={href}
      className="mt-5 flex items-center gap-3 rounded-card bg-ink p-4 text-bg"
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">{label}</span>
        <span className="mt-0.5 block text-sm text-bg/70">{note}</span>
      </span>
    </Link>
  )
}

function Secondary({
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

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <div className="mt-0.5 text-sm font-medium leading-relaxed text-ink">
          {children}
        </div>
      </div>
    </div>
  )
}
