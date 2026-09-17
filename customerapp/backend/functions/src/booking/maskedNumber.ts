import { HttpsError } from 'firebase-functions/v2/https'
import { z } from 'zod'
import { bookingSchema, COL, DOC, TRACKABLE_STATUSES } from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'

/**
 * A number the customer can ring that reaches their expert without either side
 * learning the other's.
 *
 * Masking is a telephony product — a provider allocates a temporary number,
 * bridges the two legs, and releases it afterwards. There is no way to do it
 * from inside Firebase, and nothing here pretends otherwise: if no provider is
 * configured, this says so plainly and the screen offers support instead.
 *
 * Handing back the support line labelled as the expert's number would be worse
 * than saying no. The customer would ring it expecting the person outside their
 * house.
 *
 * DECISION NEEDED: pick a provider (Exotel and Knowlarity are the usual ones in
 * India), put its credentials in `config/private`, and implement `allocate`
 * below. Until then the Call button does not appear on a booking.
 */

const maskingConfigSchema = z.object({
  provider: z.string().min(1),
  /** Everything else the provider needs lives beside this and never leaves. */
})

/** Only while somebody is actually on their way or at the door. */
const REACHABLE = [...TRACKABLE_STATUSES, 'arrived', 'in_progress'] as const

export const getMaskedNumber = defineCallable(
  'getMaskedNumber',
  async ({ bookingId }, caller) => {
    const snap = await db().collection(COL.bookings).doc(bookingId).get()
    const parsed = bookingSchema.safeParse({ id: snap.id, ...snap.data() })
    if (!snap.exists || !parsed.success || parsed.data.uid !== caller.uid) {
      throw new HttpsError('not-found', 'We could not find that booking.')
    }
    const booking = parsed.data

    if (!REACHABLE.includes(booking.status as (typeof REACHABLE)[number])) {
      throw new HttpsError(
        'failed-precondition',
        'You can call your expert once they are on the way.'
      )
    }
    if (!booking.technicianId) {
      throw new HttpsError(
        'failed-precondition',
        'No expert has been assigned to this booking yet.'
      )
    }

    // `config/private` is readable by no client rule at all, which is where
    // provider credentials belong.
    const configSnap = await db()
      .collection(COL.config)
      .doc(DOC.privateConfig)
      .get()
    const masking = maskingConfigSchema.safeParse(configSnap.data()?.masking)

    if (!masking.success) {
      throw new HttpsError(
        'failed-precondition',
        'Calling your expert directly is not available yet. Support can pass a message on for you.'
      )
    }

    // The seam the provider plugs into. It allocates a number for this pair,
    // for this booking, and the provider expires it when the job closes.
    throw new HttpsError(
      'unimplemented',
      'Calling your expert directly is not available yet. Support can pass a message on for you.'
    )
  }
)
