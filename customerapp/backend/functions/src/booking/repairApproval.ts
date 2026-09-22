import { HttpsError } from 'firebase-functions/v2/https'
import {
  bookingSchema,
  businessConfigSchema,
  catalogServiceSchema,
  COL,
  DOC,
  repairItemTotal,
  repairRequestSchema,
  SUB,
  type RepairRequestStatus,
} from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'
import { priceBooking } from '../lib/pricing'
import { coverDiscount } from '../lib/cover'
import { applyTransition, writeEvent } from '../lib/transition'

/**
 * The customer's answer to "this also needs doing".
 *
 * This is the promise the whole app is built around — repairs start only after
 * the customer approves them — so it is the one callable where the money moves
 * because of something a customer decided rather than something the business
 * did. Three answers are possible and all three are ordinary: all of it, some
 * of it, none of it.
 *
 * The price is recomputed from the approved items rather than adjusted, and the
 * items themselves are read from the request document the technician raised,
 * not from the request body. A client that could send its own item prices could
 * approve a compressor replacement for one rupee.
 *
 * Declining everything is not a cancellation. The expert has still visited and
 * inspected, the visit fee still stands, and the job goes back to being worked
 * on — which usually means being put back together and left as it was found.
 */
export const respondToRepairRequest = defineCallable(
  'respondToRepairRequest',
  async ({ bookingId, requestId, approvedItemIds }, caller) => {
    const bookingRef = db().collection(COL.bookings).doc(bookingId)
    const requestRef = bookingRef.collection(SUB.repairRequests).doc(requestId)

    return db().runTransaction(async (tx) => {
      const [bookingSnap, requestSnap, configSnap] = await Promise.all([
        tx.get(bookingRef),
        tx.get(requestRef),
        tx.get(db().collection(COL.config).doc(DOC.businessConfig)),
      ])

      const booking = bookingSchema.safeParse({
        id: bookingSnap.id,
        ...bookingSnap.data(),
      })
      if (
        !bookingSnap.exists ||
        !booking.success ||
        booking.data.uid !== caller.uid
      ) {
        throw new HttpsError('not-found', 'We could not find that booking.')
      }

      const request = repairRequestSchema.safeParse({
        id: requestSnap.id,
        ...requestSnap.data(),
      })
      if (!requestSnap.exists || !request.success) {
        throw new HttpsError('not-found', 'We could not find that request.')
      }

      if (request.data.status !== 'pending') {
        throw new HttpsError(
          'failed-precondition',
          'You have already answered this request.'
        )
      }
      if (booking.data.status !== 'awaiting_approval') {
        throw new HttpsError(
          'failed-precondition',
          'This booking is not waiting on an approval.'
        )
      }

      // Every id must be one of the items actually quoted. Anything else is a
      // client inventing a line to approve.
      const quoted = new Map(request.data.items.map((item) => [item.id, item]))
      const approved = [...new Set(approvedItemIds)]
      for (const id of approved) {
        if (!quoted.has(id)) {
          throw new HttpsError('invalid-argument', 'That item is not in this quote.')
        }
      }

      const serviceSnap = await tx.get(
        db()
          .collection(COL.catalogServices)
          .doc(`${booking.data.applianceId}_${booking.data.serviceKey}`)
      )
      const service = catalogServiceSchema.safeParse({
        id: serviceSnap.id,
        ...serviceSnap.data(),
      })
      const config = businessConfigSchema.parse(configSnap.data())
      if (!service.success) {
        throw new HttpsError(
          'failed-precondition',
          'We could not price this repair. Please contact support.'
        )
      }

      // Priced from the quoted items, summed here, on top of the visit fee the
      // catalog decides. The client sent ids and nothing else.
      const additional = approved
        .map((id) => repairItemTotal(quoted.get(id)!))
        .reduce((total, amount) => total + amount, 0)

      // Read off the booking, not off the account. What covered this job is
      // what was true when it was booked; a membership that lapsed in between
      // must not re-price a repair the customer is being asked to approve.
      const cover = {
        membership: booking.data.cover?.membership ?? false,
        ...(booking.data.cover?.userPlanId
          ? { userPlanId: booking.data.cover.userPlanId }
          : {}),
      }

      const price = priceBooking({
        service: service.data,
        config,
        additional,
        discount: coverDiscount(service.data.visitFee, additional, cover),
        paid: booking.data.price.paid,
      })

      const outcome: RepairRequestStatus =
        approved.length === 0
          ? 'declined'
          : approved.length === request.data.items.length
            ? 'approved'
            : 'partially_approved'

      const now = Date.now()

      tx.update(requestRef, {
        status: outcome,
        approvedItemIds: approved,
        respondedAt: now,
      })

      applyTransition(
        tx,
        bookingRef,
        'awaiting_approval',
        'in_progress',
        {
          title:
            outcome === 'declined'
              ? 'Repair declined'
              : outcome === 'approved'
                ? 'Repair approved'
                : 'Part of the repair approved',
          note:
            outcome === 'declined'
              ? 'No additional work will be done. You still pay only the visit fee.'
              : `${approved.length} of ${request.data.items.length} items approved. Work is resuming.`,
          stage: outcome === 'declined' ? 'testing' : 'repair',
        },
        {
          // Approving a repair raises the total above what has been paid, so
          // the booking stops being "paid" and becomes "partially paid" —
          // otherwise the balance owed has nothing saying it is owed.
          extra: {
            price,
            ...(price.due > 0 && price.paid > 0
              ? { 'payment.status': 'partially_paid' }
              : {}),
          },
          at: now,
        }
      )

      // A second line, because "what it now costs" is a different fact from
      // "what you decided" and a customer scanning the timeline looks for both.
      if (additional > 0) {
        writeEvent(
          tx,
          bookingRef,
          'in_progress',
          {
            title: 'Amount updated',
            note: 'Your total now includes the repairs you approved.',
          },
          now + 1
        )
      }

      return { price }
    })
  }
)
