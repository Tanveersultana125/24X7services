import { COL, serviceAreaSchema } from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'

/**
 * Whether we service a pincode, and what to call the place when we do.
 *
 * `serviceAreas` is publicly readable, so this could have been a client read.
 * It is a callable because the answer is a decision the app acts on — it gates
 * the whole booking flow — and the shape of that answer should not depend on a
 * client remembering to check `active` as well as existence.
 */
export const checkServiceability = defineCallable(
  'checkServiceability',
  async ({ pincode }) => {
    const snap = await db().collection(COL.serviceAreas).doc(pincode).get()
    if (!snap.exists) return { serviceable: false }

    const parsed = serviceAreaSchema.safeParse(snap.data())
    if (!parsed.success) return { serviceable: false }

    // The name comes back even when the area is switched off, so the screen can
    // say "we are not in Shamshabad yet" instead of "not serviceable".
    const { city, area, active } = parsed.data
    return { serviceable: active, city, area }
  }
)
