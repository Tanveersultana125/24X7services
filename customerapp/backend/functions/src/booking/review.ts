import { HttpsError } from 'firebase-functions/v2/https'
import { FieldValue } from 'firebase-admin/firestore'
import {
  bookingSchema,
  COL,
  serviceDocId,
  type Review,
  type ServiceReview,
} from '@app/shared'
import { logger } from 'firebase-functions'
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
 * The same is true of the service's rating, and `serviceRating()` in the
 * shared package is where the two are chosen between: the real average wins
 * the moment there is one review behind it, and the seeded pair is what a
 * screen falls back to until then.
 *
 * A review also leaves a public half behind it. `serviceReviews` carries the
 * score, the words and a first name, and nothing else — no uid, no booking
 * id, no full name. It is a separate document rather than a rule hiding
 * fields, because a rule cannot hide a field: a client that may read a
 * document reads all of it.
 */
export const submitReview = defineCallable(
  'submitReview',
  async ({ bookingId, rating, techRating, tags, text }, caller) => {
    const bookingRef = db().collection(COL.bookings).doc(bookingId)
    const reviewRef = db().collection(COL.reviews).doc()

    const booking = await db().runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef)
      const parsed = bookingSchema.safeParse({ id: snap.id, ...snap.data() })

      if (!snap.exists || !parsed.success || parsed.data.uid !== caller.uid) {
        throw new HttpsError('not-found', 'We could not find that booking.')
      }
      const found = parsed.data

      if (found.status !== 'completed') {
        throw new HttpsError(
          'failed-precondition',
          'You can review a job once it is finished.'
        )
      }
      if (found.reviewId) {
        throw new HttpsError(
          'failed-precondition',
          'You have already reviewed this job.'
        )
      }

      const review: Review = {
        id: reviewRef.id,
        bookingId,
        uid: found.uid,
        rating,
        tags,
        // Copied off the booking, so "what do people say about AC repair" is
        // one query rather than a scan of every booking ever made.
        applianceId: found.applianceId,
        serviceKey: found.serviceKey,
        createdAt: Date.now(),
        ...(techRating === undefined ? {} : { techRating }),
        ...(text === undefined || text.length === 0 ? {} : { text }),
        ...(found.technicianId === undefined
          ? {}
          : { technicianId: found.technicianId }),
      }

      tx.set(reviewRef, review)
      // Written on the booking in the same transaction, which is what makes
      // "only once" hold under a double tap.
      tx.update(bookingRef, { reviewId: reviewRef.id, updatedAt: Date.now() })

      return {
        technicianId: found.technicianId,
        applianceId: found.applianceId,
        serviceKey: found.serviceKey,
        uid: found.uid,
      }
    })

    if (booking.technicianId && techRating !== undefined) {
      await recordTechnicianRating(booking.technicianId, techRating)
    }

    // Both outside the transaction that claims the review, and neither able to
    // fail it. A rating that did not roll up is a number that is briefly low;
    // a review that could not be filed because a rollup threw is a customer
    // who cannot say what happened to them.
    await publishReview(reviewRef.id, {
      applianceId: booking.applianceId,
      serviceKey: booking.serviceKey,
      uid: booking.uid,
      rating,
      ...(text === undefined || text.length === 0 ? {} : { text }),
    })
    await recordServiceRating(booking.applianceId, booking.serviceKey, rating)

    return { reviewId: reviewRef.id }
  }
)

/**
 * Write the half of the review that goes on a public page.
 *
 * The name is the customer's first name and nothing more. Somebody reviewing
 * their washing machine did not agree to have their full name on a page about
 * washing machines, and a surname plus a city is most of an identification.
 * No name on the profile at all reads as "A customer", which is true and is
 * better than an empty space that looks like a bug.
 */
async function publishReview(
  reviewId: string,
  input: {
    applianceId: ServiceReview['applianceId']
    serviceKey: ServiceReview['serviceKey']
    uid: string
    rating: number
    text?: string
  }
): Promise<void> {
  try {
    const profile = await db().collection(COL.users).doc(input.uid).get()
    const full = String(profile.get('name') ?? '').trim()
    const first = full.split(/\s+/)[0] ?? ''

    const published: ServiceReview = {
      id: reviewId,
      applianceId: input.applianceId,
      serviceKey: input.serviceKey,
      rating: input.rating,
      authorName: first.length > 0 ? first.slice(0, 40) : 'A customer',
      createdAt: Date.now(),
      ...(input.text ? { text: input.text } : {}),
    }

    await db().collection(COL.serviceReviews).doc(reviewId).set(published)
  } catch (error) {
    logger.error('submitReview: could not publish the public half', {
      reviewId,
      error,
    })
  }
}

/**
 * Keep a running count and sum on the service, and the average derived from
 * them — the same arrangement the technician rating uses, and for the same
 * reason: this number is on every service card, and recounting the reviews
 * collection per card is a query per card.
 */
async function recordServiceRating(
  applianceId: string,
  serviceKey: string,
  rating: number
): Promise<void> {
  const ref = db()
    .collection(COL.catalogServices)
    .doc(serviceDocId(applianceId, serviceKey))

  try {
    await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) return

      const stats = snap.data()?.reviewStats as
        | { count?: number; sum?: number }
        | undefined
      const count = Number(stats?.count ?? 0) + 1
      const sum = Number(stats?.sum ?? 0) + rating

      tx.update(ref, {
        reviewStats: {
          count,
          sum,
          // One decimal, which is all a star rating ever shows.
          average: Math.round((sum / count) * 10) / 10,
        },
      })
    })
  } catch (error) {
    logger.error('submitReview: could not roll the service rating up', {
      applianceId,
      serviceKey,
      error,
    })
  }
}

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
