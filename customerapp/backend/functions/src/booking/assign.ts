import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions'
import { randomInt } from 'node:crypto'
import { z } from 'zod'
import {
  bookingSchema,
  COL,
  DOC,
  SUB,
  type Booking,
  type TechnicianPublic,
} from '@app/shared'
import { db } from '../lib/admin'
import { REGION } from '../lib/options'
import { applyTransition } from '../lib/transition'

/**
 * Put a name to a confirmed booking.
 *
 * It runs the moment a booking becomes `confirmed` rather than closer to the
 * slot, because the thing a customer wants after paying is to know who is
 * coming. Reassignment closer to the day is an operations problem this does not
 * pretend to solve — `techPreference` is honoured where it can be, and the
 * booking says plainly that a different expert may be sent.
 *
 * Nobody available is not a failure. The booking stays `confirmed`, which is a
 * true description of it, and the next run of this trigger or a human picks it
 * up. Moving it to an error state would tell the customer their booking is
 * broken when it is merely unstaffed.
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

export const assignTechnician = onDocumentWritten(
  { document: `${COL.bookings}/{bookingId}`, region: REGION },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!after) return

    // Only the moment of becoming confirmed. Without this the trigger's own
    // write would fire it again, and again.
    if (before?.status === after.status) return
    if (after.status !== 'confirmed') return

    const bookingId = event.params.bookingId
    const parsed = bookingSchema.safeParse({ id: bookingId, ...after })
    if (!parsed.success) {
      logger.error('assignTechnician: booking is not readable', { bookingId })
      return
    }

    const technician = await pickTechnician(parsed.data)
    if (!technician) {
      logger.warn('assignTechnician: nobody covers this job yet', {
        bookingId,
        pincode: parsed.data.address.pincode,
        applianceId: parsed.data.applianceId,
        brandId: parsed.data.brandId,
      })
      return
    }

    await assign(bookingId, technician)
  }
)

/**
 * Who to send.
 *
 * The customer's named choice wins if they made one and that person still
 * covers the job. Otherwise it is whoever is rated highest among those who can
 * actually do it — which is what "any available expert" has always meant on the
 * booking screen.
 */
async function pickTechnician(booking: Booking): Promise<TechnicianPublic | null> {
  if (booking.techPreference === 'specific' && booking.technicianId) {
    const chosen = await db()
      .collection(COL.technicians)
      .doc(booking.technicianId)
      .get()
    const parsed = technicianRecordSchema.safeParse(chosen.data())
    if (parsed.success && covers(parsed.data, booking)) {
      return toPublic(chosen.id, parsed.data)
    }
    // Their choice is no longer available. Someone else goes, and the timeline
    // says so rather than the booking quietly changing hands.
  }

  const snap = await db()
    .collection(COL.technicians)
    .where('active', '==', true)
    .where('pincodes', 'array-contains', booking.address.pincode)
    .get()

  const candidates: TechnicianPublic[] = []
  for (const doc of snap.docs) {
    const parsed = technicianRecordSchema.safeParse(doc.data())
    if (!parsed.success || !covers(parsed.data, booking)) continue
    candidates.push(toPublic(doc.id, parsed.data))
  }

  candidates.sort((a, b) => b.rating - a.rating || b.jobsCount - a.jobsCount)
  return candidates[0] ?? null
}

function covers(
  record: z.infer<typeof technicianRecordSchema>,
  booking: Booking
): boolean {
  return (
    record.active &&
    record.pincodes.includes(booking.address.pincode) &&
    record.appliances.includes(booking.applianceId) &&
    record.specializations.includes(booking.brandId)
  )
}

function toPublic(
  id: string,
  record: z.infer<typeof technicianRecordSchema>
): TechnicianPublic {
  return {
    id,
    name: record.name,
    rating: record.rating,
    jobsCount: record.jobsCount,
    specializations: record.specializations,
    ...(record.photo === undefined ? {} : { photo: record.photo }),
  }
}

/**
 * Write the assignment, the two job OTPs and the tracking document in one go.
 *
 * All three belong to the same moment. A booking that says an expert is coming
 * but has no tracking document is a Track button that opens an empty screen.
 */
async function assign(
  bookingId: string,
  technician: TechnicianPublic
): Promise<void> {
  const bookingRef = db().collection(COL.bookings).doc(bookingId)

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(bookingRef)
    const parsed = bookingSchema.safeParse({ id: snap.id, ...snap.data() })
    if (!parsed.success) return

    const booking = parsed.data
    // Re-read: the sweep or a cancellation may have moved it since the trigger.
    if (booking.status !== 'confirmed') return

    const requested =
      booking.techPreference === 'specific' &&
      booking.technicianId &&
      booking.technicianId !== technician.id

    applyTransition(tx, bookingRef, 'confirmed', 'assigned', {
      title: 'Expert assigned',
      note: requested
        ? `${technician.name} will be coming — the expert you picked is not free for this slot.`
        : `${technician.name} will be coming to your address.`,
    }, {
      extra: {
        technicianId: technician.id,
        technicianSnapshot: technician,
      },
    })

    // Two codes: one the customer reads out before work starts, one before the
    // expert leaves. They live under a path no client rule grants, and reach
    // the customer only through getJobOtp.
    tx.set(bookingRef.collection(SUB.private).doc(DOC.otp), {
      start: fourDigits(),
      complete: fourDigits(),
      createdAt: Date.now(),
    })

    tx.set(db().collection(COL.tracking).doc(bookingId), {
      bookingId,
      updatedAt: Date.now(),
    })
  })
}

/** Uniform across all ten thousand, which Math.random is not. */
function fourDigits(): string {
  return String(randomInt(0, 10000)).padStart(4, '0')
}
