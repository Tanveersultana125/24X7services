import { HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { COL, formatPaise, giftCardSchema } from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'
import { issueCredit, movementId } from '../lib/wallet'

/**
 * Redeeming a gift card.
 *
 * The card is the code, so the only thing this has to get right is that one
 * code becomes money exactly once. It does that in two steps rather than one,
 * and the order of them is the whole design:
 *
 *   1. Claim the card in a transaction — mark it redeemed, by this account.
 *   2. Credit the balance, with a movement id built from the code.
 *
 * If the second step fails, the card is claimed and the money has not arrived.
 * That is why a card already redeemed *by the person asking* is allowed
 * straight back through: the retry finds its own claim, credits again, and the
 * credit is idempotent on the same movement id, so the balance moves once. A
 * card claimed by somebody else is refused, which is what a spent card is.
 *
 * Doing it the other way round — credit first, then mark — would credit a card
 * that two people redeemed simultaneously twice before either mark landed.
 */

/** One code, one movement, however many times this is called. */
function giftMovementId(code: string): string {
  return movementId(['gift', code])
}

export const redeemGiftCard = defineCallable(
  'redeemGiftCard',
  async ({ code }, caller) => {
    const uid = caller.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Please sign in first.')

    const ref = db().collection(COL.giftCards).doc(code)

    const amount = await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const parsed = giftCardSchema.safeParse(snap.data())

      // A code that does not exist and a code somebody else has spent are the
      // same sentence on purpose. Telling them apart is an oracle for finding
      // live codes by asking.
      if (!snap.exists || !parsed.success) {
        throw new HttpsError(
          'not-found',
          'That code is not a gift card we issued. Check it and try again.'
        )
      }
      const card = parsed.data

      if (card.status === 'redeemed' && card.redeemedBy !== uid) {
        throw new HttpsError(
          'failed-precondition',
          'That gift card has already been used.'
        )
      }

      if (card.status !== 'redeemed') {
        tx.set(
          ref,
          { status: 'redeemed', redeemedBy: uid, redeemedAt: Date.now() },
          { merge: true }
        )
      }

      return card.amount
    })

    // Outside the transaction, and idempotent on the code — see the note above.
    const result = await issueCredit({
      uid,
      amount,
      reason: 'gift_card',
      note: `${formatPaise(amount)} gift card`,
      id: giftMovementId(code),
    })

    logger.info('redeemGiftCard: a card became credits', {
      uid,
      applied: result.applied,
    })

    return { amount, balance: result.balance }
  }
)
