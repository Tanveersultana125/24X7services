import { HttpsError } from 'firebase-functions/v2/https'
import { FieldValue } from 'firebase-admin/firestore'
import { bookingSchema, COL, type Review } from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'

/**
 * A review, once, and only for a job that actually happened.
 *
 * The rules refuse every client write to `reviews` precisely so those two
 * conditions can be checked somewhere that can see the booking. A review posted
 * against a booking that was never completed, or a second review on the same
 * job, are the two ways a ratings page stops meaning anything.
 *
 * The technician's own rating is not overwritten here. Every seeded rating is
 * fictional, and averaging real reviews into an invented starting figure would
 * produce a number nobody could explain. What is kept is the honest aggregate —
 * how many real reviews, and what they average — beside it.
 *
 * DECISION NEEDED: the displayed rating should switch from the seeded one to
 * `reviewStats.average` once there are enough real reviews to stand on. The
 * business decides what "enough" is.
 */
export const submitReview = defineCallable(
  'submitReview',
  async ({ bookingId, rating, techRating, tags, text }, caller) => {
    const bookingRef = db().collection(COL.bookings).doc(bookingId)
    const reviewRef = db().collection(COL.reviews).doc()

    const technicianId = await db().runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef)
      const parsed = bookingSchema.safeParse({ id: snap.id, ...snap.data() })

      if (!snap.exists || !parsed.success || parsed.data.uid !== caller.uid) {
        throw new HttpsError('not-found', 'We could not find that booking.')
      }
      const booking = parsed.data

      if (booking.status !== 'completed') {
        throw new HttpsError(
          'failed-precondition',
          'You can review a job once it is finished.'
        )
      }
      if (booking.reviewId) {
        throw new HttpsError(
          'failed-precondition',
          'You have already reviewed this job.'
        )
      }

      const review: Review = {
        id: reviewRef.id,
        bookingId,
        uid: booking.uid,
        rating,
        tags,
        createdAt: Date.now(),
        ...(techRating === undefined ? {} : { techRating }),
        ...(text === undefined || text.length === 0 ? {} : { text }),
        ...(booking.technicianId === undefined
          ? {}
          : { technicianId: booking.technicianId }),
      }

      tx.set(reviewRef, review)
      // Written on the booking in the same transaction, which is what makes
      // "only once" hold under a double tap.
      tx.update(bookingRef, { reviewId: reviewRef.id, updatedAt: Date.now() })

      return booking.technicianId
    })

    if (technicianId && techRating !== undefined) {
      await recordTechnicianRating(technicianId, techRating)
    }

    return { reviewId: reviewRef.id }
  }
)

/**
 * Keep a running count and sum on the public technician record, and the average
 * derived from them. Stored rather than computed on read, because the rating
 * appears on every technician card and recounting the reviews collection each
 * time is a query per card.
 */
async function recordTechnicianRating(
  technicianId: string,
  techRating: number
): Promise<void> {
  const ref = db().collection(COL.technicianPublic).doc(technicianId)

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) return

    const stats = snap.data()?.reviewStats as
      | { count?: number; sum?: number }
      | undefined
    const count = Number(stats?.count ?? 0) + 1
    const sum = Number(stats?.sum ?? 0) + techRating

    tx.update(ref, {
      reviewStats: {
        count,
        sum,
        // One decimal, which is all a star rating ever shows.
        average: Math.round((sum / count) * 10) / 10,
        updatedAt: FieldValue.serverTimestamp(),
      },
    })
  })
}
