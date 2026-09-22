'use client'

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import {
  COL,
  catalogPlanSchema,
  membershipSchema,
  userPlanSchema,
  type CatalogPlan,
  type Membership,
  type UserPlan,
} from '@app/shared'
import { db } from './firebase'

/**
 * Reading plans and membership.
 *
 * Read-only, like the wallet and for the same reason: what a plan covers, how
 * many visits are left on it and when a membership runs out are all things a
 * client that could write them would eventually be asked to. Buying goes
 * through `lib/purchase`, and the server decides every number in it.
 *
 * A row that does not parse is dropped rather than shown. A plan with a missing
 * field is not a plan a customer can be told anything true about.
 */

/** The plans on offer, in the order the catalog puts them. */
export async function fetchCatalogPlans(): Promise<CatalogPlan[]> {
  const snap = await getDocs(
    query(
      collection(db(), COL.catalogPlans),
      where('active', '==', true),
      orderBy('order', 'asc'),
      limit(20)
    )
  )

  const plans: CatalogPlan[] = []
  for (const document of snap.docs) {
    const parsed = catalogPlanSchema.safeParse({
      id: document.id,
      ...document.data(),
    })
    if (parsed.success) plans.push(parsed.data)
  }
  return plans
}

/** Everything this customer has bought, soonest to expire first. */
export async function fetchMyPlans(uid: string): Promise<UserPlan[]> {
  const snap = await getDocs(
    query(
      collection(db(), COL.userPlans),
      where('uid', '==', uid),
      orderBy('expiresAt', 'asc'),
      limit(50)
    )
  )

  const plans: UserPlan[] = []
  for (const document of snap.docs) {
    const parsed = userPlanSchema.safeParse({
      id: document.id,
      ...document.data(),
    })
    if (parsed.success) plans.push(parsed.data)
  }
  return plans
}

/**
 * The membership, or null.
 *
 * Null covers both "never bought one" and "the document is unreadable". Neither
 * is an error a customer can act on, and both mean the same thing on screen:
 * they are not a member.
 */
export async function fetchMembership(uid: string): Promise<Membership | null> {
  const snap = await getDoc(doc(db(), COL.memberships, uid))
  if (!snap.exists()) return null
  const parsed = membershipSchema.safeParse(snap.data())
  return parsed.success ? parsed.data : null
}
