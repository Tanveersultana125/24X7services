import { z } from 'zod'
import { COL, type TechnicianPublic } from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'

/**
 * Who could take this job — the technicians who cover the pincode, work on that
 * appliance, and know that brand.
 *
 * Only the public half of each record comes back. `technicians` holds phone
 * numbers and employee codes and is denied to clients in the rules; this
 * function reads it with admin rights and hands over name, rating, jobs and
 * specialisms, which is the whole of what a customer is ever shown.
 *
 * Being listed here is not a reservation. Who actually turns up is decided at
 * assignment, against the roster on the day; "Any available expert" is the
 * default for exactly that reason, and picking a specific one is a preference
 * rather than a promise.
 */

const technicianRecordSchema = z.object({
  name: z.string().min(1),
  rating: z.number().min(0).max(5),
  jobsCount: z.number().int().min(0),
  specializations: z.array(z.string().min(1)),
  appliances: z.array(z.string().min(1)),
  pincodes: z.array(z.string().min(1)),
  active: z.boolean(),
  photo: z.string().optional(),
})

/** Enough to choose from without turning the step into a directory. */
const MAX_OPTIONS = 10

/** A "top rated" list that includes everyone is not a recommendation. */
const TOP_RATED_MIN = 4.5

export const getTechnicianOptions = defineCallable(
  'getTechnicianOptions',
  async ({ pincode, applianceId, brandId, preference }) => {
    // Firestore allows one array-contains per query, so the pincode — the
    // filter that cuts the roster down hardest — is the one that runs as a
    // query, and appliance and brand are matched over what comes back.
    const snap = await db()
      .collection(COL.technicians)
      .where('active', '==', true)
      .where('pincodes', 'array-contains', pincode)
      .get()

    const technicians: TechnicianPublic[] = []
    for (const doc of snap.docs) {
      const parsed = technicianRecordSchema.safeParse(doc.data())
      if (!parsed.success) continue

      const record = parsed.data
      if (!record.appliances.includes(applianceId)) continue
      if (!record.specializations.includes(brandId)) continue
      if (preference === 'top_rated' && record.rating < TOP_RATED_MIN) continue

      technicians.push({
        id: doc.id,
        name: record.name,
        rating: record.rating,
        jobsCount: record.jobsCount,
        specializations: record.specializations,
        ...(record.photo === undefined ? {} : { photo: record.photo }),
      })
    }

    // Rating first, then experience, so two equally rated names are not in
    // whatever order Firestore happened to return them.
    technicians.sort(
      (a, b) => b.rating - a.rating || b.jobsCount - a.jobsCount
    )

    return { technicians: technicians.slice(0, MAX_OPTIONS) }
  }
)
