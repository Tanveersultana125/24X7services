import { HttpsError } from 'firebase-functions/v2/https'
import {
  bookingSchema,
  businessConfigSchema,
  COL,
  DOC,
  slotDaySchema,
  slotDocId,
  type BookingStatus,
  type SlotWindow,
} from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'
import { findWindow, freeIn, windowHasPassed } from '../lib/slots'
import { writeEvent } from '../lib/transition'

/**
 * Moving a booking to a different window.
 *
 * Rescheduling is two slot movements that have to happen together: the old
 * window gives a place back and the new one takes it. Done separately, a
 * failure between them either double-books the customer or loses them their
 * slot entirely, so both happen in one transaction against documents read
 * inside it.
 *
 * The limit exists because each move costs somebody a route. It is a number in
 * the business config rather than a constant here, and the customer is told how
 * many they have left every time they use one.
 *
 * DECISION NEEDED: an assigned booking that moves keeps its expert, who may not
 * be free in the new window. There is no way back to `confirmed` in the state
 * machine, so `assignTechnician` cannot re-run — either that transition is
 * added, or operations pick these up by hand. As it stands the customer keeps
 * the name they were given and may be sent someone else on the day.
 */

/** A booking can be moved right up until an expert sets out. */
const MOVABLE: readonly BookingStatus[] = [
  'pending_payment',
  'confirmed',
  'assigned',
]

export const rescheduleBooking = defineCallable(
  'rescheduleBooking',
  async ({ bookingId, slot }, caller) => {
    const bookingRef = db().collection(COL.bookings).doc(bookingId)

    return db().runTransaction(async (tx) => {
      const [bookingSnap, configSnap] = await Promise.all([
        tx.get(bookingRef),
        tx.get(db().collection(COL.config).doc(DOC.businessConfig)),
      ])

      const parsed = bookingSchema.safeParse({
        id: bookingSnap.id,
        ...bookingSnap.data(),
      })
      if (!bookingSnap.exists || !parsed.success || parsed.data.uid !== caller.uid) {
        throw new HttpsError('not-found', 'We could not find that booking.')
      }
      const booking = parsed.data
      const config = businessConfigSchema.parse(configSnap.data())

      if (!MOVABLE.includes(booking.status)) {
        throw new HttpsError(
          'failed-precondition',
          'This booking has already started. Please talk to support to change it.'
        )
      }

      const used = booking.rescheduleCount
      if (used >= config.rescheduleLimit) {
        throw new HttpsError(
          'failed-precondition',
          `A booking can be moved ${config.rescheduleLimit} times. Please talk to support.`
        )
      }

      const sameWindow =
        booking.slot.date === slot.date &&
        booking.slot.start === slot.start &&
        booking.slot.end === slot.end
      if (sameWindow) {
        throw new HttpsError(
          'invalid-argument',
          'That is the slot you already have.'
        )
      }

      const pincode = booking.address.pincode
      const fromId = slotDocId(pincode, booking.slot.date)
      const toId = slotDocId(pincode, slot.date)
      const fromRef = db().collection(COL.slots).doc(fromId)
      const toRef = db().collection(COL.slots).doc(toId)

      // Moving inside one day is the same document twice. Reading it once and
      // applying both changes to one array is the only way that lands; two
      // writes to the same ref in a transaction would have the second win.
      const sameDay = fromId === toId
      const fromSnap = await tx.get(fromRef)
      const toSnap = sameDay ? fromSnap : await tx.get(toRef)

      const fromDay = slotDaySchema.safeParse(fromSnap.data())
      const toDay = slotDaySchema.safeParse(toSnap.data())

      if (!toDay.success) {
        throw new HttpsError(
          'failed-precondition',
          'That day is not open for booking. Please pick another.'
        )
      }

      const target = findWindow(toDay.data, slot.start, slot.end)
      if (!target) {
        throw new HttpsError(
          'failed-precondition',
          'That time window is no longer offered. Please pick another.'
        )
      }
      if (windowHasPassed(slot.date, target.window)) {
        throw new HttpsError(
          'failed-precondition',
          'That time has passed. Please pick a later window.'
        )
      }
      if (freeIn(target.window) <= 0) {
        throw new HttpsError(
          'failed-precondition',
          'That window just filled up. Please pick another.'
        )
      }

      // An unpaid booking holds its old place; a paid one has taken it. The new
      // window is claimed the same way, so the count means the same thing
      // before and after the move.
      const heldRatherThanBooked = booking.status === 'pending_payment'
      const release = (window: SlotWindow): SlotWindow =>
        heldRatherThanBooked
          ? { ...window, held: Math.max(0, window.held - 1) }
          : { ...window, booked: Math.max(0, window.booked - 1) }
      const claim = (window: SlotWindow): SlotWindow =>
        heldRatherThanBooked
          ? { ...window, held: window.held + 1 }
          : { ...window, booked: window.booked + 1 }

      const origin = fromDay.success
        ? findWindow(fromDay.data, booking.slot.start, booking.slot.end)
        : null

      if (sameDay) {
        tx.update(toRef, {
          windows: toDay.data.windows.map((window, index) => {
            let next = window
            if (origin && index === origin.index) next = release(next)
            if (index === target.index) next = claim(next)
            return next
          }),
        })
      } else {
        if (fromDay.success && origin) {
          tx.update(fromRef, {
            windows: fromDay.data.windows.map((window, index) =>
              index === origin.index ? release(window) : window
            ),
          })
        }
        tx.update(toRef, {
          windows: toDay.data.windows.map((window, index) =>
            index === target.index ? claim(window) : window
          ),
        })
      }

      const left = config.rescheduleLimit - (used + 1)
      const now = Date.now()

      // The status does not change — a moved booking is the same booking — so
      // this is a timeline entry beside a plain update rather than a transition.
      tx.update(bookingRef, {
        slot,
        rescheduleCount: used + 1,
        updatedAt: now,
      })
      writeEvent(
        tx,
        bookingRef,
        booking.status,
        {
          title: 'Slot moved',
          note:
            left === 0
              ? 'This was your last free change. Anything further goes through support.'
              : `You can move this booking ${left} more time${left === 1 ? '' : 's'}.`,
        },
        now
      )

      return { slot, reschedulesLeft: Math.max(0, left) }
    })
  }
)
