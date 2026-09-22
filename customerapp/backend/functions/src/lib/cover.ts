import { logger } from 'firebase-functions'
import {
  COL,
  MEMBER_REPAIR_DISCOUNT_PERCENT,
  isMembershipActive,
  membershipSchema,
  userPlanSchema,
  type ApplianceId,
  type Paise,
  type UserPlan,
} from '@app/shared'
import { db } from './admin'

/**
 * What a customer already holds that takes money off a booking.
 *
 * Two things can, and they stack in one direction only:
 *
 *   - A **plan** covers the visit on the appliances it names, until its visits
 *     run out. It does nothing to a repair quoted on top.
 *   - A **membership** waives the visit fee on everything, and takes a
 *     percentage off approved repairs.
 *
 * Holding both does not waive the visit fee twice — it is one fee, and it goes
 * once. The plan is still the one recorded on the booking, because a plan visit
 * is a thing that gets used up and a membership is not, and a customer who paid
 * for both should see the plan they bought actually being spent.
 *
 * This is read *outside* the booking transaction on purpose. It is not part of
 * what that transaction has to hold atomically — the worst a stale read can do
 * is honour a membership that lapsed in the same second, which is a decision
 * anybody would make in the customer's favour anyway — and adding two reads to
 * a transaction that already holds a slot is how a booking path gets slower for
 * everyone.
 */

export interface Cover {
  /** 24X7 Plus was live when this was priced. */
  membership: boolean
  /** The plan that covers this visit, if one does. */
  userPlanId?: string
  /** Its name, for the line the customer reads. */
  planName?: string
}

export const NO_COVER: Cover = { membership: false }

/**
 * What this customer holds against this appliance, right now.
 *
 * Never throws. A booking must not fail because a benefits lookup did, so a
 * failure here is logged and read as "nothing covered" — the customer pays the
 * ordinary price, which is recoverable by support, rather than not being able
 * to book at all.
 */
export async function coverFor(
  uid: string,
  applianceId: ApplianceId,
  now: number = Date.now()
): Promise<Cover> {
  try {
    const [membershipSnap, planSnap] = await Promise.all([
      db().collection(COL.memberships).doc(uid).get(),
      db()
        .collection(COL.userPlans)
        .where('uid', '==', uid)
        .where('applianceIds', 'array-contains', applianceId)
        .where('expiresAt', '>', now)
        .limit(10)
        .get(),
    ])

    const membership = membershipSchema.safeParse(membershipSnap.data())

    // The one closest to running out, so a customer holding two plans spends
    // the perishable one first.
    let chosen: UserPlan | null = null
    for (const document of planSnap.docs) {
      const parsed = userPlanSchema.safeParse({
        id: document.id,
        ...document.data(),
      })
      if (!parsed.success) continue
      const plan = parsed.data
      if (plan.visitsUsed >= plan.visitsIncluded) continue
      if (!chosen || plan.expiresAt < chosen.expiresAt) chosen = plan
    }

    return {
      membership: isMembershipActive(
        membership.success ? membership.data : null,
        now
      ),
      ...(chosen ? { userPlanId: chosen.id, planName: chosen.name } : {}),
    }
  } catch (error) {
    logger.error('coverFor: could not read what this customer holds', {
      uid,
      error,
    })
    return NO_COVER
  }
}

/**
 * What comes off the bill, in paise.
 *
 * The visit fee goes once however many things would have waived it. The repair
 * percentage is the membership's alone — a plan covers visits, and a plan that
 * quietly discounted parts as well would be a different product from the one on
 * the screen that sold it.
 */
export function coverDiscount(
  visitFee: Paise,
  additional: Paise,
  cover: Cover
): Paise {
  const waived = cover.membership || cover.userPlanId ? visitFee : 0
  const offRepairs = cover.membership
    ? Math.round((additional * MEMBER_REPAIR_DISCOUNT_PERCENT) / 100)
    : 0
  return waived + offRepairs
}

/** What the booking stores. Derived here so both call sites agree. */
export function coverRecord(cover: Cover): {
  membership: boolean
  userPlanId?: string
} {
  return {
    membership: cover.membership,
    ...(cover.userPlanId ? { userPlanId: cover.userPlanId } : {}),
  }
}

/**
 * Take one visit off the plan that covered a finished job.
 *
 * Idempotent through the booking, not the plan: `visitConsumedAt` is stamped in
 * the same transaction that increments the count, so the completion trigger —
 * which is at-least-once — cannot spend a customer's second visit on the same
 * job. A plan that has vanished is logged and left; a missing plan must not
 * hold up an invoice.
 */
export async function consumePlanVisit(bookingId: string): Promise<void> {
  const bookingRef = db().collection(COL.bookings).doc(bookingId)

  try {
    await db().runTransaction(async (tx) => {
      const bookingSnap = await tx.get(bookingRef)
      const cover = bookingSnap.get('cover') as
        | { userPlanId?: string; visitConsumedAt?: number }
        | undefined

      if (!cover?.userPlanId || cover.visitConsumedAt) return

      const planRef = db().collection(COL.userPlans).doc(cover.userPlanId)
      const planSnap = await tx.get(planRef)
      if (!planSnap.exists) {
        logger.warn('consumePlanVisit: the plan behind this booking is gone', {
          bookingId,
          userPlanId: cover.userPlanId,
        })
        return
      }

      const used = Number(planSnap.get('visitsUsed') ?? 0)
      const included = Number(planSnap.get('visitsIncluded') ?? 0)

      tx.update(planRef, { visitsUsed: Math.min(used + 1, included) })
      tx.set(
        bookingRef,
        { cover: { ...cover, visitConsumedAt: Date.now() } },
        { merge: true }
      )
    })
  } catch (error) {
    logger.error('consumePlanVisit: could not spend a plan visit', {
      bookingId,
      error,
    })
  }
}
