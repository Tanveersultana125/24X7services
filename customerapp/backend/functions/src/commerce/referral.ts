import { randomInt } from 'node:crypto'
import { HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { FieldValue } from 'firebase-admin/firestore'
import {
  COL,
  REFERRAL_CODE_ALPHABET,
  REFERRAL_REWARD,
  REFERRAL_WELCOME,
  formatPaise,
  referralSchema,
  type Referral,
} from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'
import { issueCredit, movementId } from '../lib/wallet'

/**
 * Referrals: the code a customer hands out, and the moment it pays.
 *
 * Nobody is paid for a sign-up. Both sides are paid when the person who used
 * the code has had a job *finished* — see `rewardReferral`, which the booking
 * completion trigger calls. Every earlier moment is one that can be
 * manufactured from a second SIM, and this is the only place in the app where
 * creating an account is worth money.
 *
 * Three documents hold it up:
 *
 *   - `referrals/{uid}` — this account's own code, whose code it used, and
 *     whether that has been paid. Both halves on one document, because they are
 *     one fact about one account and keeping them apart is how a reward gets
 *     paid twice.
 *   - `referralCodes/{code}` — the reverse lookup. Created with `create`, so
 *     two accounts cannot end up sharing a code.
 *   - the wallet ledger, where the credits land, idempotent on the uid.
 */

const CODE_LENGTH = 6
/** Enough tries that failing all of them means something else is wrong. */
const CODE_ATTEMPTS = 8

function referralCode(): string {
  const body = Array.from(
    { length: CODE_LENGTH },
    () => REFERRAL_CODE_ALPHABET[randomInt(REFERRAL_CODE_ALPHABET.length)] ?? 'A'
  ).join('')
  return `24X7-${body}`
}

/**
 * This account's referral record, made on first sight.
 *
 * The code is claimed with `create` on the lookup document, which fails if it
 * is taken. That is the only check against a collision, and it is the right
 * one: a read-then-write would let two accounts pass the read together.
 */
async function ensureReferral(uid: string): Promise<Referral> {
  const ref = db().collection(COL.referrals).doc(uid)
  const existing = referralSchema.safeParse((await ref.get()).data())
  if (existing.success) return existing.data

  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
    const code = referralCode()
    const now = Date.now()
    try {
      await db()
        .collection(COL.referralCodes)
        .doc(code)
        .create({ uid, createdAt: now })
    } catch {
      continue // Taken. Another six characters is cheaper than thinking about it.
    }

    const record: Referral = {
      code,
      invited: 0,
      earned: 0,
      createdAt: now,
      updatedAt: now,
    }
    try {
      await ref.create(record)
      return record
    } catch {
      // A second call raced this one and wrote a record first. Theirs stands —
      // a customer's code must not change under them — and the code this
      // attempt reserved is simply never used.
      const settled = referralSchema.safeParse((await ref.get()).data())
      if (settled.success) return settled.data
      continue
    }
  }

  logger.error('ensureReferral: could not find a free code', { uid })
  throw new HttpsError('internal', 'Something went wrong. Please try again.')
}

/** Whether this account has ever booked anything. One document is enough. */
async function hasBooked(uid: string): Promise<boolean> {
  const snap = await db()
    .collection(COL.bookings)
    .where('uid', '==', uid)
    .limit(1)
    .get()
  return !snap.empty
}

export const getReferral = defineCallable('getReferral', async (_input, caller) => {
  const uid = caller.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Please sign in first.')

  const referral = await ensureReferral(uid)
  const usedCode = Boolean(referral.referredBy)

  return {
    code: referral.code,
    invited: referral.invited,
    earned: referral.earned,
    usedCode,
    // A code is something you arrive with, not something you remember after
    // your first job. Offering the field to someone who has already booked is
    // offering a reward the rules below will refuse.
    canApplyCode: !usedCode && !(await hasBooked(uid)),
  }
})

export const applyReferralCode = defineCallable(
  'applyReferralCode',
  async ({ code }, caller) => {
    const uid = caller.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Please sign in first.')

    const lookup = await db().collection(COL.referralCodes).doc(code).get()
    const ownerUid = lookup.data()?.uid

    if (!lookup.exists || typeof ownerUid !== 'string') {
      throw new HttpsError(
        'not-found',
        'That code is not one of ours. Check it and try again.'
      )
    }

    if (ownerUid === uid) {
      throw new HttpsError(
        'failed-precondition',
        'That is your own code. Share it with someone who has not booked with us yet.'
      )
    }

    if (await hasBooked(uid)) {
      throw new HttpsError(
        'failed-precondition',
        'A referral code only works before your first booking.'
      )
    }

    // Own record first, so the customer always has a code of their own even if
    // the write below is the thing that fails.
    await ensureReferral(uid)

    const ref = db().collection(COL.referrals).doc(uid)
    await db().runTransaction(async (tx) => {
      const current = referralSchema.safeParse((await tx.get(ref)).data())
      if (current.success && current.data.referredBy) {
        throw new HttpsError(
          'failed-precondition',
          'You have already used a referral code.'
        )
      }
      tx.set(ref, { referredBy: ownerUid, updatedAt: Date.now() }, { merge: true })
    })

    logger.info('applyReferralCode: a code was taken up', { uid })
    return { ok: true as const }
  }
)

// ---------------------------------------------------------------------------
// Paying it out
// ---------------------------------------------------------------------------

/**
 * Pay both sides, once, when the referred customer's first job is finished.
 *
 * Called from the booking completion trigger, which is at-least-once, so the
 * claim comes first: `rewardedAt` is stamped inside a transaction and its
 * presence is what stops a second payment. The two credits that follow are
 * themselves idempotent on the referred customer's uid, so a crash between the
 * claim and the credits is recoverable by the next completion — the credits
 * land, and the second attempt applies nothing.
 *
 * It never throws into its caller. A referral that failed to pay is a support
 * conversation; an invoice that failed to issue is a legal problem, and this
 * must not be able to take that down with it.
 */
export async function rewardReferral(uid: string): Promise<void> {
  const ref = db().collection(COL.referrals).doc(uid)

  try {
    const referrerUid = await db().runTransaction(async (tx) => {
      const parsed = referralSchema.safeParse((await tx.get(ref)).data())
      if (!parsed.success) return null

      const referral = parsed.data
      if (!referral.referredBy || referral.rewardedAt) return null

      tx.set(ref, { rewardedAt: Date.now(), updatedAt: Date.now() }, { merge: true })
      return referral.referredBy
    })

    if (!referrerUid) return

    await issueCredit({
      uid: referrerUid,
      amount: REFERRAL_REWARD,
      reason: 'referral',
      note: `${formatPaise(REFERRAL_REWARD)} for a friend you referred`,
      id: movementId(['referral', 'referrer', uid]),
    })

    await issueCredit({
      uid,
      amount: REFERRAL_WELCOME,
      reason: 'referral',
      note: `${formatPaise(REFERRAL_WELCOME)} for joining on a referral code`,
      id: movementId(['referral', 'joined', uid]),
    })

    await db()
      .collection(COL.referrals)
      .doc(referrerUid)
      .set(
        {
          invited: FieldValue.increment(1),
          earned: FieldValue.increment(REFERRAL_REWARD),
          updatedAt: Date.now(),
        },
        { merge: true }
      )

    logger.info('rewardReferral: paid both sides', { uid, referrerUid })
  } catch (error) {
    logger.error('rewardReferral: could not pay a referral', { uid, error })
  }
}
