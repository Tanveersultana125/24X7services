import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions'
import { bookingSchema, COL, slotDaySchema, slotDocId } from '@app/shared'
import { db } from '../lib/admin'
import { REGION } from '../lib/options'
import { findWindow } from '../lib/slots'
import { applyTransition } from '../lib/transition'

/**
 * Give back the slots nobody paid for.
 *
 * A booking created for online payment holds a place in its window for
 * `slotHoldMinutes`. Without this, an abandoned checkout keeps that place
 * forever: the window reads as full to everyone else, and the day quietly
 * stops selling.
 *
 * The outcome is `cancelled`, not `failed`. Nothing failed — the customer
 * started a booking and did not finish it, and a status that reads as a payment
 * error would send them to support over something they chose.
 */

/** Short enough that a released slot comes back while the day is still useful. */
const EVERY_FIVE_MINUTES = 'every 5 minutes'

/** A sweep that falls behind is better than one that times out holding a lock. */
const BATCH = 50

export const expireSlotHolds = onSchedule(
  {
    schedule: EVERY_FIVE_MINUTES,
    region: REGION,
    timeZone: 'Asia/Kolkata',
  },
  async () => {
    const result = await sweepExpiredHolds()
    logger.info('expireSlotHolds: swept expired holds', result)
  }
)

/**
 * The sweep itself, separate from the schedule that runs it.
 *
 * Split out because a scheduled function cannot be invoked in the emulator —
 * the schedule is what it is attached to, not something that can be asked to
 * run — and a job that gives slots back to customers is not one to ship
 * having only read it.
 */
export async function sweepExpiredHolds(
  now: number = Date.now()
): Promise<{ considered: number; released: number }> {
  const due = await db()
    .collection(COL.bookings)
    .where('status', '==', 'pending_payment')
    .where('holdExpiresAt', '<=', now)
    .limit(BATCH)
    .get()

  let released = 0
  for (const doc of due.docs) {
    try {
      if (await releaseOne(doc.id, now)) released += 1
    } catch (error) {
      // One stuck booking must not stop the rest of the sweep.
      logger.error('expireSlotHolds: could not release a hold', {
        bookingId: doc.id,
        error,
      })
    }
  }

  return { considered: due.size, released }
}

/**
 * Re-read inside a transaction rather than trusting the query. Between the
 * query and here the customer may have paid — and confirming then cancelling
 * the same booking is worse than leaving the hold a few minutes longer.
 */
async function releaseOne(bookingId: string, now: number): Promise<boolean> {
  const bookingRef = db().collection(COL.bookings).doc(bookingId)

  return db().runTransaction(async (tx) => {
    const snap = await tx.get(bookingRef)
    const parsed = bookingSchema.safeParse({ id: snap.id, ...snap.data() })
    if (!parsed.success) return false

    const booking = parsed.data
    if (booking.status !== 'pending_payment') return false
    if (booking.payment.status === 'paid') return false
    if ((booking.holdExpiresAt ?? Infinity) > now) return false

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
              ? { ...window, held: window.held - 1 }
              : window
          ),
        })
      }
    }

    applyTransition(
      tx,
      bookingRef,
      'pending_payment',
      'cancelled',
      {
        title: 'Slot released',
        note: 'The visit fee was not paid in time, so the slot was given back.',
      },
      {
        extra: {
          'payment.status': 'failed',
          cancellation: {
            reason: 'The slot was not paid for in time and has been released.',
            cancelledAt: now,
            cancelledBy: 'system',
            feeCharged: 0,
            refundPaise: 0,
            refundDays: 0,
          },
        },
        at: now,
      }
    )

    return true
  })
}
