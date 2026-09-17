'use client'

import { useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { CalendarCheck, Check, Clock, MapPin } from 'lucide-react'
import { bookingSchema, COL, type Booking } from '@app/shared'
import { doc, getDoc } from 'firebase/firestore'

import { Header } from '@/components/Header'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/StatusBadge'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth'
import {
  formatPaise,
  formatSlotWindow,
  relativeDateLabel,
  shortAddress,
} from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

/**
 * Done.
 *
 * It shows the reference first, because that is the thing a customer will be
 * asked for if they ring up, and then exactly what happens next in the order it
 * happens. No confetti and no "thank you for your order" — this is a stranger
 * coming to someone's home, and what they want to know is when, who, and what
 * it will cost.
 *
 * The booking is read back from Firestore rather than passed through the URL.
 * What is shown is what was actually written.
 */
export function ConfirmedScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const bookingId = params.get('b')
  const { user, ready } = useAuth()

  const load = useCallback(async (): Promise<Booking | null> => {
    if (!bookingId) return null
    const snap = await getDoc(doc(db(), COL.bookings, bookingId))
    const parsed = bookingSchema.safeParse({ id: snap.id, ...snap.data() })
    return parsed.success ? parsed.data : null
  }, [bookingId])

  const booking = useAsync(load)

  useEffect(() => {
    if (ready && !user) router.replace('/login')
  }, [ready, user, router])

  return (
    <div className="min-h-dvh bg-bg">
      {/* No back button: the flow behind this screen no longer exists. */}
      <Header showBack={false} />

      <main className="mx-auto w-full max-w-lg px-4 pb-16 lg:max-w-2xl">
        {booking.status === 'loading' ? (
          <SkeletonGroup label="Loading" className="mt-8 flex flex-col gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </SkeletonGroup>
        ) : booking.status === 'error' || !booking.data ? (
          <ErrorState
            className="py-20"
            kind="notFound"
            title="We could not find that booking"
            description="It may still be on its way. Your bookings list will have it."
            onRetry={booking.reload}
            retrying={booking.refreshing}
          />
        ) : (
          <Confirmed booking={booking.data} />
        )}
      </main>
    </div>
  )
}

function Confirmed({ booking }: { booking: Booking }) {
  const awaitingPayment = booking.status === 'pending_payment'

  return (
    <>
      <div className="mt-8 flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-soft">
          <Check className="size-7 text-success" aria-hidden="true" />
        </span>
        <h1 className="mt-3 text-2xl font-bold text-ink">
          {awaitingPayment ? 'Slot held' : 'Booking confirmed'}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Reference{' '}
          <span className="font-semibold text-ink">{booking.displayId}</span>
        </p>
        <StatusBadge className="mt-3" status={booking.status} />
      </div>

      <Card className="mt-6 flex flex-col gap-4 p-4">
        <Row
          icon={CalendarCheck}
          label="When"
          value={`${relativeDateLabel(booking.slot.date)}, ${formatSlotWindow(
            booking.slot.start,
            booking.slot.end
          )}`}
        />
        <Row
          icon={MapPin}
          label="Where"
          value={shortAddress(booking.address)}
        />
        <Row
          icon={Clock}
          label={
            booking.payment.status === 'paid' ? 'Visit fee paid' : 'Visit fee'
          }
          value={`${formatPaise(booking.price.visitFee)}${
            booking.payment.mode === 'pay_after_service'
              ? ' — due after the service'
              : ''
          }`}
        />
      </Card>

      <section className="mt-7">
        <h2 className="mb-2 text-sm font-semibold text-muted">What happens now</h2>
        <ol className="flex flex-col gap-2">
          {[
            'We assign a verified expert and tell you who is coming.',
            'They call before setting off, and you can follow them on the map.',
            'They inspect the appliance and quote any repair, itemised.',
            'Work starts only once you approve it. Then your invoice and warranty appear here.',
          ].map((step, index) => (
            <li key={step}>
              <Card className="flex items-start gap-3 p-4">
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-bg"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed text-ink">{step}</span>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-7 flex flex-col gap-3">
        <Link
          href={`/bookings/detail?id=${booking.id}` as Route}
          className="flex min-h-12 items-center justify-center rounded-pill bg-ink px-5 text-base font-semibold text-bg"
        >
          View this booking
        </Link>
        <Link
          href="/home"
          className="flex min-h-12 items-center justify-center rounded-pill border border-ink px-5 text-base font-semibold text-ink"
        >
          Back to home
        </Link>
      </div>
    </>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-0.5 text-sm font-medium leading-relaxed text-ink">
          {value}
        </p>
      </div>
    </div>
  )
}
