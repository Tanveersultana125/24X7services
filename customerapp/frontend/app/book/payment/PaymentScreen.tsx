'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { Lock, ShieldCheck } from 'lucide-react'
import { bookingDraftSchema, type PriceBreakdown } from '@app/shared'

import { BookingStep } from '@/components/BookingStep'
import { PriceSummary } from '@/components/PriceSummary'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ErrorState'
import { useToast } from '@/components/Toast'
import { callFn, friendlyError } from '@/lib/callables'
import { CHECKOUT_IS_SIMULATED, CheckoutDismissed, openCheckout } from '@/lib/checkout'
import { useAuth } from '@/lib/auth'
import { clearDraft, useBookingDraft } from '@/lib/bookingDraft'

/**
 * Taking the money, or not taking it yet.
 *
 * The order of operations is the whole design. The booking is created first,
 * inside a transaction that holds the slot and prices the job from the catalog;
 * only then is an order raised, for the amount the server decided. Nothing on
 * this screen tells the server what anything costs.
 *
 * Two failures matter and are handled differently. A customer who closes the
 * payment sheet still has a booking, held for a few minutes, and is told so
 * rather than being dropped back into an empty flow. A payment that goes
 * through but cannot be confirmed here is not a lost payment: the webhook is
 * what the booking's paid state really rests on, and the screen says the money
 * is accounted for rather than inviting a second attempt.
 */

type Stage = 'ready' | 'creating' | 'paying' | 'confirming' | 'held'

export function PaymentScreen() {
  const router = useRouter()
  const { draft } = useBookingDraft()
  const { user } = useAuth()
  const toast = useToast()

  const [stage, setStage] = useState<Stage>('ready')
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<{
    id: string
    displayId: string
    price: PriceBreakdown
  } | null>(null)

  const parsed = bookingDraftSchema.safeParse(draft)
  const payingNow = draft.paymentMode === 'online'
  const busy = stage !== 'ready' && stage !== 'held'

  function finish(bookingId: string): void {
    // The draft has become a booking; keeping it would offer the customer the
    // same job again next time they open the app.
    clearDraft()
    router.replace(`/book/confirmed?b=${bookingId}` as Route)
  }

  async function pay(): Promise<void> {
    if (!parsed.success) return
    setError(null)

    // A booking already exists from an earlier attempt on this screen — the
    // customer closed the sheet, or verification failed. Pay for that one
    // rather than creating a second.
    let current = booking
    if (!current) {
      setStage('creating')
      try {
        const created = await callFn('createBooking', { draft: parsed.data })
        current = {
          id: created.bookingId,
          displayId: created.displayId,
          price: created.price,
        }
        setBooking(current)

        if (!created.requiresPayment) {
          finish(created.bookingId)
          return
        }
      } catch (caught) {
        setStage('ready')
        setError(friendlyError(caught))
        return
      }
    }

    setStage('paying')
    try {
      const order = await callFn('createPaymentOrder', {
        bookingId: current.id,
        purpose: 'visit_fee',
      })

      const result = await openCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: order.amount,
        description: `Visit fee · ${order.bookingDisplayId}`,
        customerName: user?.displayName ?? undefined,
        customerPhone: user?.phoneNumber ?? undefined,
      })

      setStage('confirming')
      const verified = await callFn('verifyPayment', {
        bookingId: current.id,
        ...result,
      })

      if (verified.status === 'paid') {
        finish(current.id)
        return
      }

      // Razorpay took the money but the booking could not be confirmed — the
      // hold had already lapsed. Support settles this, not a retry.
      setStage('held')
      setError(
        'Your payment went through but the slot had already been released. ' +
          'Our support team will refund it and help you rebook.'
      )
    } catch (caught) {
      if (caught instanceof CheckoutDismissed) {
        setStage('held')
        toast.show('Payment cancelled. Your slot is held for a few minutes.')
        return
      }
      setStage('held')
      setError(friendlyError(caught))
    }
  }

  if (!parsed.success) {
    return (
      <BookingStep stepKey="payment" title="Payment">
        <ErrorState
          className="py-16"
          title="Something is missing"
          description="This booking is not complete. Please go back and check the earlier steps."
          onRetry={() => router.replace('/book/review')}
        />
      </BookingStep>
    )
  }

  return (
    <BookingStep
      stepKey="payment"
      title={payingNow ? 'Pay the visit fee' : 'Confirm your booking'}
      cta={{
        label: booking
          ? 'Try the payment again'
          : payingNow
            ? 'Pay now'
            : 'Confirm booking',
        onClick: () => void pay(),
        loading: busy,
        disabled: busy,
      }}
    >
      {booking ? (
        <PriceSummary className="mt-5" price={booking.price} showDue={false} />
      ) : (
        <Card className="mt-5 p-4">
          <p className="text-sm text-muted">
            {payingNow
              ? 'You pay the visit and inspection fee now. Everything else is quoted on site and starts only after you approve it.'
              : 'Nothing is charged now. You settle the visit fee and any approved repair when the job is done.'}
          </p>
        </Card>
      )}

      {booking ? (
        <p className="mt-3 text-sm text-muted">
          Booking <span className="font-semibold text-ink">{booking.displayId}</span>
          {stage === 'held'
            ? ' is held while you finish paying.'
            : ' has been created.'}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-card border border-error bg-error-soft px-4 py-3 text-sm leading-relaxed text-ink"
        >
          {error}
        </p>
      ) : null}

      {stage === 'held' ? (
        <Button
          className="mt-4"
          variant="ghost"
          fullWidth
          onClick={() => router.replace('/bookings')}
        >
          Finish later — go to my bookings
        </Button>
      ) : null}

      <Card className="mt-6 flex items-start gap-3 p-4">
        <Lock className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-muted">
          Payment is handled by Razorpay. Card and UPI details are entered in
          their window and never reach this app.
        </p>
      </Card>

      <Card className="mt-3 flex items-start gap-3 p-4">
        <ShieldCheck
          className="mt-0.5 size-4 shrink-0 text-muted"
          aria-hidden="true"
        />
        <p className="text-sm leading-relaxed text-muted">
          A GST invoice is issued when the job is complete, and every repair
          carries a service warranty.
        </p>
      </Card>

      {CHECKOUT_IS_SIMULATED && payingNow ? (
        <p className="mt-6 rounded-card border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-muted">
          Running against the emulator: no payment window opens and no money
          moves. Pressing pay signs a stand-in response the emulated functions
          accept, so the rest of the flow behaves exactly as it will in
          production.
        </p>
      ) : null}

    </BookingStep>
  )
}
