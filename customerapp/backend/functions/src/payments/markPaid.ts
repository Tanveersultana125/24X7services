import { FieldValue } from 'firebase-admin/firestore'
import {
  bookingSchema,
  COL,
  slotDaySchema,
  slotDocId,
  type PriceBreakdown,
} from '@app/shared'
import { db } from '../lib/admin'
import { findWindow } from '../lib/slots'
import { applyTransition, writeEvent } from '../lib/transition'

/**
 * A booking is paid for. Called from two places that both have to be able to
 * run second without doing any harm.
 *
 * `verifyPayment` runs when the customer's checkout returns, which is fast but
 * not guaranteed — they close the app, the page reloads, the network drops.
 * The webhook runs when Razorpay says the money was captured, which is slower
 * but always happens. Whichever lands first does the work; the other finds a
 * booking that is already paid and returns what it finds.
 *
 * Two different payments arrive here. The visit fee, which turns a held slot
 * into a confirmed booking, and the balance after a completed job, which
 * changes no status at all — settling a bill is not a state transition, and
 * moving a finished job back to `confirmed` would undo it.
 */

export interface MarkPaidResult {
  /** False when the booking was already paid before this call. */
  changed: boolean
  price: PriceBreakdown
  status: 'paid' | 'gone'
}

export async function markBookingPaid(
  bookingId: string,
  razorpayPaymentId: string
): Promise<MarkPaidResult> {
  const bookingRef = db().collection(COL.bookings).doc(bookingId)

  return db().runTransaction(async (tx) => {
    const snap = await tx.get(bookingRef)
    const parsed = bookingSchema.safeParse({ id: snap.id, ...snap.data() })
    if (!snap.exists || !parsed.success) {
      throw new Error(`markBookingPaid: booking ${bookingId} is not readable`)
    }
    const booking = parsed.data

    // Nothing owed is the definition of settled — the payment flag says only
    // that money came in once, which stops being the same thing the moment an
    // approved repair raises the total.
    if (booking.price.due <= 0) {
      return { changed: false, price: booking.price, status: 'paid' as const }
    }

    // The hold lapsed and the sweep released the slot before the money landed.
    // Confirming now would put a job in a window that has since been given
    // away, so the payment stands as a refund to make rather than a booking.
    if (booking.status === 'cancelled' || booking.status === 'refunded') {
      return { changed: false, price: booking.price, status: 'gone' as const }
    }

    const now = Date.now()
    const price: PriceBreakdown = {
      ...booking.price,
      paid: booking.price.total,
      due: 0,
    }

    const settlingTheBalance = booking.status !== 'pending_payment'

    if (settlingTheBalance) {
      // Nothing about the job changes; the customer has simply paid for it.
      tx.update(bookingRef, {
        price,
        'payment.status': 'paid',
        'payment.razorpayPaymentId': razorpayPaymentId,
        updatedAt: now,
      })
      writeEvent(
        tx,
        bookingRef,
        booking.status,
        {
          title: 'Payment received',
          note: 'Your balance is settled. Thank you.',
        },
        now
      )
      return { changed: true, price, status: 'paid' as const }
    }

    // Turn the hold into a booking. The place was already counted against the
    // window when the booking was created, so this moves it rather than adding.
    const slotRef = db()
      .collection(COL.slots)
      .doc(slotDocId(booking.address.pincode, booking.slot.date))
    const slotSnap = await tx.get(slotRef)
    const day = slotDaySchema.safeParse(slotSnap.data())
    if (day.success) {
      const found = findWindow(day.data, booking.slot.start, booking.slot.end)
      if (found && found.window.held > 0) {
        tx.update(slotRef, {
          windows: day.data.windows.map((window, index) =>
            index === found.index
              ? {
                  ...window,
                  held: window.held - 1,
                  booked: window.booked + 1,
                }
              : window
          ),
        })
      }
    }

    applyTransition(
      tx,
      bookingRef,
      'pending_payment',
      'confirmed',
      {
        title: 'Booking confirmed',
        note: 'Visit fee received. An expert will be assigned before your slot.',
      },
      {
        extra: {
          price,
          'payment.status': 'paid',
          'payment.razorpayPaymentId': razorpayPaymentId,
          // The slot is no longer held against the clock; it is booked. Deleted
          // rather than zeroed, so the expiry sweep's query cannot match it.
          holdExpiresAt: FieldValue.delete(),
        },
        at: now,
      }
    )

    return { changed: true, price, status: 'paid' as const }
  })
}
