import { HttpsError } from 'firebase-functions/v2/https'
import { z } from 'zod'
import { bookingSchema, COL, DOC, SUB, type BookingStatus } from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'

/**
 * The code the customer reads out to the expert.
 *
 * Two of them, at the two moments worth proving: one before any work starts, so
 * a job cannot be marked as begun at an address nobody visited, and one before
 * the expert leaves, so a job cannot be marked complete over a customer who
 * does not agree that it is.
 *
 * Each is released only in the statuses where it means something. Handing over
 * the completion code while the expert is still on the way would let a job be
 * closed from the van.
 *
 * DECISION NEEDED: the Phase 1 note said these would be stored hashed. They are
 * not, and cannot be while the customer has to be able to read one back — a
 * hash they could reverse is not a hash. What protects them is that
 * `bookings/{id}/private` is denied to every client in the rules, in both
 * directions, and that a job OTP is worth nothing after the visit. If that is
 * not judged enough, the answer is a second factor on the technician side
 * rather than hashing something that has to be readable.
 */

const otpDocSchema = z.object({
  start: z.string().length(4),
  complete: z.string().length(4),
})

/** When each code may be shown. */
const RELEASE: Record<'start' | 'complete', readonly BookingStatus[]> = {
  start: ['assigned', 'en_route', 'arrived'],
  complete: ['in_progress', 'awaiting_approval'],
}

const NOT_YET: Record<'start' | 'complete', string> = {
  start: 'Your start code appears once an expert is on the way.',
  complete: 'Your completion code appears once work has started.',
}

export const getJobOtp = defineCallable(
  'getJobOtp',
  async ({ bookingId, kind }, caller) => {
    const bookingRef = db().collection(COL.bookings).doc(bookingId)
    const snap = await bookingRef.get()
    const parsed = bookingSchema.safeParse({ id: snap.id, ...snap.data() })

    // Not "forbidden": saying that would confirm the booking exists.
    if (!snap.exists || !parsed.success || parsed.data.uid !== caller.uid) {
      throw new HttpsError('not-found', 'We could not find that booking.')
    }
    const booking = parsed.data

    if (!RELEASE[kind].includes(booking.status)) {
      throw new HttpsError('failed-precondition', NOT_YET[kind])
    }

    const otpSnap = await bookingRef.collection(SUB.private).doc(DOC.otp).get()
    const otp = otpDocSchema.safeParse(otpSnap.data())
    if (!otp.success) {
      throw new HttpsError(
        'failed-precondition',
        'No code has been issued for this booking yet.'
      )
    }

    // Recorded so the timeline can show when the customer was given it — which
    // is the only evidence either side has if the code is later disputed.
    const field = kind === 'start' ? 'otp.startShownAt' : 'otp.completeShownAt'
    await bookingRef.update({ [field]: Date.now(), updatedAt: Date.now() })

    return { otp: kind === 'start' ? otp.data.start : otp.data.complete }
  }
)
