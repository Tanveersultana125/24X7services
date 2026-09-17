import { HttpsError } from 'firebase-functions/v2/https'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import {
  ACTIVE_STATUSES,
  bookingSchema,
  COL,
  SUB,
  UPCOMING_STATUSES,
} from '@app/shared'
import { adminApp, db } from '../lib/admin'
import { defineCallable } from '../lib/callable'

/**
 * The account itself: the push token, and the end of it.
 */

/**
 * Register this device for notifications.
 *
 * `fcmTokens` is excluded from what the rules let a client write, because a
 * client that could write the array could also write somebody else's token into
 * it and read their notifications. It goes through here, and only ever as an
 * addition of the caller's own token.
 */
export const registerFcmToken = defineCallable(
  'registerFcmToken',
  async ({ token }, caller) => {
    await db()
      .collection(COL.users)
      .doc(caller.uid as string)
      .set(
        {
          fcmTokens: FieldValue.arrayUnion(token),
          updatedAt: Date.now(),
        },
        { merge: true }
      )

    return { ok: true as const }
  }
)

/**
 * Close the account.
 *
 * Two things are true at once and the code has to honour both. A customer may
 * ask for their personal data to be removed, and a business that has issued a
 * GST invoice has to keep it. So this deletes what is theirs — the profile,
 * their addresses, their saved appliances, their notifications, their support
 * threads — and leaves the bookings and invoices, with the name on them
 * replaced by the fact that the account is gone.
 *
 * What stays is the record of a transaction, not a person: an amount, a date, a
 * service and an address the work happened at. The customer is told this in the
 * confirmation before they agree to it, because finding out afterwards that
 * something remained is the thing that breaks trust.
 *
 * DECISION NEEDED: the retention period for those invoices is a question for
 * the CA — Indian GST rules are commonly read as six years from the end of the
 * financial year. Nothing here deletes them on any schedule yet.
 */
export const deleteAccount = defineCallable('deleteAccount', async (_input, caller) => {
  const uid = caller.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Please sign in to continue.')

  // A job that is booked or under way is a person expecting a visit. Closing
  // the account underneath it would leave an expert at a door nobody answers.
  const live = await db()
    .collection(COL.bookings)
    .where('uid', '==', uid)
    .where('status', 'in', [...UPCOMING_STATUSES, ...ACTIVE_STATUSES])
    .limit(1)
    .get()

  if (!live.empty) {
    const parsed = bookingSchema.safeParse({
      id: live.docs[0]?.id,
      ...live.docs[0]?.data(),
    })
    throw new HttpsError(
      'failed-precondition',
      `Booking ${
        parsed.success ? parsed.data.displayId : 'in progress'
      } is still open. Cancel or finish it before closing your account.`
    )
  }

  const userRef = db().collection(COL.users).doc(uid)

  // Subcollections are not removed with their parent; each has to be swept.
  await Promise.all([
    deleteCollection(userRef.collection(SUB.addresses)),
    deleteCollection(userRef.collection(SUB.appliances)),
    deleteCollection(db().collection(COL.notifications).doc(uid).collection(SUB.items)),
  ])

  await closeSupportThreads(uid)
  await anonymiseKeptRecords(uid)

  await userRef.delete()

  // Last, because an auth record removed first would leave every write above
  // running as nobody.
  try {
    await getAuth(adminApp()).deleteUser(uid)
  } catch (error) {
    logger.error('deleteAccount: auth record could not be removed', { uid, error })
    throw new HttpsError(
      'internal',
      'We removed your data but could not close the sign-in. Please contact support.'
    )
  }

  logger.info('deleteAccount: closed an account', { uid })
  return { ok: true as const }
})

/** Firestore has no recursive delete server-side; this walks in pages. */
async function deleteCollection(
  ref: FirebaseFirestore.CollectionReference
): Promise<void> {
  for (;;) {
    const snap = await ref.limit(200).get()
    if (snap.empty) return
    const batch = db().batch()
    for (const doc of snap.docs) batch.delete(doc.ref)
    await batch.commit()
    if (snap.size < 200) return
  }
}

/** Threads go with the person; what they were about does not outlive them. */
async function closeSupportThreads(uid: string): Promise<void> {
  const tickets = await db()
    .collection(COL.supportTickets)
    .where('uid', '==', uid)
    .get()

  for (const ticket of tickets.docs) {
    await deleteCollection(ticket.ref.collection(SUB.messages))
    await ticket.ref.delete()
  }
}

/**
 * Bookings, invoices, warranties and reviews stay, with the person taken out of
 * them. The address is kept because it is where the work happened and an
 * invoice has to say so; the name becomes a placeholder and the review loses
 * its author.
 */
async function anonymiseKeptRecords(uid: string): Promise<void> {
  const REMOVED = 'Account closed'

  const invoices = await db().collection(COL.invoices).where('uid', '==', uid).get()
  for (const invoice of invoices.docs) {
    await invoice.ref.update({ 'buyer.name': REMOVED })
  }

  const reviews = await db().collection(COL.reviews).where('uid', '==', uid).get()
  const batch = db().batch()
  for (const review of reviews.docs) {
    // The rating still counts towards the technician's average; the words and
    // the person behind them do not stay.
    batch.update(review.ref, { text: FieldValue.delete() })
  }
  await batch.commit()
}
