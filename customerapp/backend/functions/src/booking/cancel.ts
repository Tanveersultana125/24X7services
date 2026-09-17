import { HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import {
  bookingSchema,
  businessConfigSchema,
  COL,
  DOC,
  slotDaySchema,
  slotDocId,
  type Booking,
  type BookingStatus,
  type BusinessConfig,
} from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'
import { findWindow, windowStartsAt } from '../lib/slots'
import { applyTransition } from '../lib/transition'
import { PAYMENT_SECRETS, refundPayment } from '../lib/razorpay'

/**
 * Calling it off.
 *
 * The cost of cancelling is shown before it is charged. `previewCancellation`
 * and `cancelBooking` compute it the same way, from the same policy, so the
 * figure on the confirmation dialog is the figure that comes off the refund —
 * a cancellation screen that guesses and a callable that decides are how a
 * customer ends up arguing about ninety-nine rupees.
 *
 * Only a booking nobody has travelled for can be cancelled here. Once an expert
 * is on their way there is a person in a van to account for, and that is a
 * conversation with support rather than a button.
 */

/** A customer may call off a booking up to the point someone sets out. */
const CANCELLABLE: readonly BookingStatus[] = [
  'pending_payment',
  'confirmed',
  'assigned',
]

interface Outcome {
  isFree: boolean
  feeCharged: number
  refundPaise: number
  refundDays: number
}

/**
 * What cancelling costs, from the policy and the clock.
 *
 * The fee can never exceed what was actually paid. Charging a cancellation fee
 * against a booking that has not paid anything would leave a debt behind a
 * cancelled job, and there is nothing in this system that collects one.
 */
function outcomeFor(booking: Booking, config: BusinessConfig): Outcome {
  const policy = config.cancellationPolicy
  const startsAt = windowStartsAt(booking.slot.date, booking.slot.start)
  const noticeMs = startsAt - Date.now()
  const isFree = noticeMs >= policy.freeUntilHours * 60 * 60 * 1000

  const feeCharged = isFree ? 0 : Math.min(policy.feePaise, booking.price.paid)

  return {
    isFree,
    feeCharged,
    refundPaise: Math.max(0, booking.price.paid - feeCharged),
    refundDays: policy.refundDays,
  }
}

async function readOwnBooking(
  bookingId: string,
  uid: string | null
): Promise<{ booking: Booking; config: BusinessConfig }> {
  const [snap, configSnap] = await Promise.all([
    db().collection(COL.bookings).doc(bookingId).get(),
    db().collection(COL.config).doc(DOC.businessConfig).get(),
  ])

  const parsed = bookingSchema.safeParse({ id: snap.id, ...snap.data() })
  if (!snap.exists || !parsed.success || parsed.data.uid !== uid) {
    throw new HttpsError('not-found', 'We could not find that booking.')
  }

  return {
    booking: parsed.data,
    config: businessConfigSchema.parse(configSnap.data()),
  }
}

export const previewCancellation = defineCallable(
  'previewCancellation',
  async ({ bookingId }, caller) => {
    const { booking, config } = await readOwnBooking(bookingId, caller.uid)

    if (!CANCELLABLE.includes(booking.status)) {
      throw new HttpsError(
        'failed-precondition',
        'This booking has already started. Please talk to support to change it.'
      )
    }

    return outcomeFor(booking, config)
  }
)

export const cancelBooking = defineCallable(
  'cancelBooking',
  async ({ bookingId, reason }, caller) => {
    const { booking, config } = await readOwnBooking(bookingId, caller.uid)

    if (!CANCELLABLE.includes(booking.status)) {
      throw new HttpsError(
        'failed-precondition',
        'This booking has already started. Please talk to support to change it.'
      )
    }

    const outcome = outcomeFor(booking, config)
    const bookingRef = db().collection(COL.bookings).doc(bookingId)

    await db().runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef)
      const current = bookingSchema.safeParse({ id: snap.id, ...snap.data() })
      if (!current.success) {
        throw new HttpsError('not-found', 'We could not find that booking.')
      }
      // Re-read: the sweep or an assignment may have moved it since the check.
      if (!CANCELLABLE.includes(current.data.status)) {
        throw new HttpsError(
          'failed-precondition',
          'This booking has already started. Please talk to support to change it.'
        )
      }

      // An unpaid booking is holding its place; a paid one has taken it. Give
      // back whichever it was, or the window stays full of a job nobody is
      // coming to.
      const wasHeld = current.data.status === 'pending_payment'
      const slotRef = db()
        .collection(COL.slots)
        .doc(slotDocId(current.data.address.pincode, current.data.slot.date))
      const slotSnap = await tx.get(slotRef)
      const day = slotDaySchema.safeParse(slotSnap.data())

      if (day.success) {
        const found = findWindow(
          day.data,
          current.data.slot.start,
          current.data.slot.end
        )
        if (found) {
          tx.update(slotRef, {
            windows: day.data.windows.map((window, index) =>
              index === found.index
                ? {
                    ...window,
                    held: wasHeld ? Math.max(0, window.held - 1) : window.held,
                    booked: wasHeld
                      ? window.booked
                      : Math.max(0, window.booked - 1),
                  }
                : window
            ),
          })
        }
      }

      const now = Date.now()
      applyTransition(
        tx,
        bookingRef,
        current.data.status,
        'cancelled',
        {
          title: 'Booking cancelled',
          note: outcome.isFree
            ? 'Cancelled in time — no fee.'
            : `Cancelled inside ${config.cancellationPolicy.freeUntilHours} hours of the slot.`,
        },
        {
          extra: {
            cancellation: {
              reason: reason.slice(0, 500),
              cancelledAt: now,
              cancelledBy: 'customer',
              feeCharged: outcome.feeCharged,
              refundPaise: outcome.refundPaise,
              refundDays: outcome.refundDays,
            },
            price: {
              ...current.data.price,
              // What stays with us is the fee; the rest is going back.
              total: outcome.feeCharged,
              due: 0,
            },
          },
          at: now,
        }
      )
    })

    // The money moves after the booking is safely cancelled. A refund issued
    // first and a transaction that then failed would be money out with nothing
    // recording why.
    if (outcome.refundPaise > 0) {
      await issueRefund(bookingId, booking, outcome.refundPaise)
    }

    return {
      feeCharged: outcome.feeCharged,
      refundPaise: outcome.refundPaise,
      refundDays: outcome.refundDays,
    }
  },
  { secrets: PAYMENT_SECRETS }
)

/**
 * Put the money back.
 *
 * A failure here is logged and swallowed rather than thrown: the booking is
 * already cancelled and the slot already released, and telling the customer the
 * cancellation failed would be untrue. What is owed is recorded on the booking,
 * so support can see it and finish it by hand.
 */
async function issueRefund(
  bookingId: string,
  booking: Booking,
  amountPaise: number
): Promise<void> {
  const paymentId = booking.payment.razorpayPaymentId
  if (!paymentId) {
    logger.warn('cancelBooking: nothing to refund against', { bookingId })
    return
  }

  const bookingRef = db().collection(COL.bookings).doc(bookingId)

  try {
    const refund = await refundPayment(paymentId, amountPaise, {
      bookingId,
      displayId: booking.displayId,
    })

    await db().runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef)
      const current = bookingSchema.safeParse({ id: snap.id, ...snap.data() })
      if (!current.success || current.data.status !== 'cancelled') return

      applyTransition(
        tx,
        bookingRef,
        'cancelled',
        'refunded',
        {
          title: 'Refund on its way',
          note: `${formatDays(booking)} — your bank decides exactly when it lands.`,
        },
        {
          extra: {
            'payment.status': 'refunded',
            'payment.refundId': refund.id,
          },
        }
      )
    })
  } catch (error) {
    logger.error('cancelBooking: refund failed, left for support', {
      bookingId,
      amountPaise,
      error,
    })
  }
}

function formatDays(booking: Booking): string {
  const days = booking.cancellation?.refundDays ?? 5
  return days === 1 ? 'Within 1 working day' : `Within ${days} working days`
}
