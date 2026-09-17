import { COL } from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'

/**
 * "Tell me when you cover my area."
 *
 * One row per person per pincode rather than one per tap: the document id is
 * derived from whatever identifies the asker, so pressing the button twice
 * updates a count instead of inflating demand for an area nobody actually
 * wants. Where there is nothing to identify them — signed out, no phone given —
 * the row is anonymous and `requests` stays at one.
 *
 * The collection is denied to clients in the rules, in both directions. Nobody
 * reads back who else is waiting on an area.
 */
export const joinWaitlist = defineCallable(
  'joinWaitlist',
  async ({ pincode, phone }, caller) => {
    const identity = phone ?? caller.uid
    const collection = db().collection(COL.waitlist)
    const ref = identity
      ? collection.doc(`${pincode}_${identity}`)
      : collection.doc()

    const now = Date.now()
    const existing = identity ? await ref.get() : null

    await ref.set(
      {
        pincode,
        phone: phone ?? null,
        uid: caller.uid,
        requests: (existing?.data()?.requests ?? 0) + 1,
        ...(existing?.exists ? {} : { createdAt: now }),
        lastRequestedAt: now,
      },
      { merge: true }
    )

    return { ok: true as const }
  }
)
