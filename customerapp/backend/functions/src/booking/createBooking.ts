import { HttpsError } from 'firebase-functions/v2/https'
import {
  addressSchema,
  brandApplianceMatrixEntrySchema,
  businessConfigSchema,
  catalogServiceSchema,
  COL,
  DOC,
  matrixDocId,
  serviceAreaSchema,
  slotDaySchema,
  slotDocId,
  SUB,
  technicianPublicSchema,
  type AddressSnapshot,
  type BookingDraft,
  type PaymentInfo,
} from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'
import { priceBooking } from '../lib/pricing'
import { writeEvent } from '../lib/transition'
import { findWindow, freeIn, windowHasPassed } from '../lib/slots'

/**
 * Turn a draft into a booking.
 *
 * The draft carries what was chosen and never what it costs. Everything with a
 * number on it is read here, inside a transaction, from documents no client can
 * write: the visit fee comes from the catalog, the tax rate from the business
 * config, the slot's remaining room from the slot document. A tampered draft
 * buys nothing, because there is nothing in it to tamper with that the server
 * does not look up again.
 *
 * The transaction is what makes the slot hold mean something. Two customers
 * taking the last place in the same window at the same moment both read the
 * same count, and Firestore lets exactly one of them commit.
 *
 * Every refusal in here is phrased for the customer to read, because each one
 * is something they can act on — pick another window, pick another address,
 * choose a brand we cover.
 */

/**
 * References run from #AP10000 and are five digits by contract. That is ninety
 * thousand bookings; the counter is checked rather than allowed to roll over,
 * because a wrapped reference is two jobs with the same name on them.
 */
const FIRST_DISPLAY_NUMBER = 10000
const LAST_DISPLAY_NUMBER = 99999

export const createBooking = defineCallable(
  'createBooking',
  async ({ draft }, caller) => {
    const uid = caller.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Please sign in to continue.')

    const bookingRef = db().collection(COL.bookings).doc()
    const counterRef = db().collection(COL.counters).doc(DOC.bookingCounter)

    return db().runTransaction(async (tx) => {
      // --- Reads. All of them, before anything is written. ------------------

      const address = await readAddress(tx, uid, draft)
      const pincode = address.pincode

      const [configSnap, serviceSnap, matrixSnap, areaSnap, slotSnap, counterSnap] =
        await Promise.all([
          tx.get(db().collection(COL.config).doc(DOC.businessConfig)),
          tx.get(
            db()
              .collection(COL.catalogServices)
              .doc(`${draft.applianceId}_${draft.serviceKey}`)
          ),
          tx.get(
            db()
              .collection(COL.brandApplianceMatrix)
              .doc(matrixDocId(draft.brandId, draft.applianceId))
          ),
          tx.get(db().collection(COL.serviceAreas).doc(pincode)),
          tx.get(
            db().collection(COL.slots).doc(slotDocId(pincode, draft.slot.date))
          ),
          tx.get(counterRef),
        ])

      const technician = await readTechnician(tx, draft)

      // --- Everything this booking is not allowed to be. --------------------

      const config = businessConfigSchema.parse(configSnap.data())

      const service = catalogServiceSchema.safeParse({
        id: serviceSnap.id,
        ...serviceSnap.data(),
      })
      if (!service.success || !service.data.active) {
        throw new HttpsError(
          'failed-precondition',
          'That service is no longer available. Please pick another one.'
        )
      }

      const matrix = brandApplianceMatrixEntrySchema.safeParse(matrixSnap.data())
      if (!matrix.success || !matrix.data.enabled) {
        throw new HttpsError(
          'failed-precondition',
          'We do not service that brand for this appliance yet.'
        )
      }

      const area = serviceAreaSchema.safeParse(areaSnap.data())
      if (!area.success || !area.data.active) {
        throw new HttpsError(
          'failed-precondition',
          `We do not service ${pincode} yet.`
        )
      }

      if (draft.paymentMode === 'pay_after_service' && !config.allowPayAfterService) {
        throw new HttpsError(
          'failed-precondition',
          'Paying after the service is not available right now.'
        )
      }

      // Media is referenced by path, and a path is a claim about who owns a
      // file. Anything outside this customer's own prefix is refused rather
      // than attached to their booking.
      const prefix = `users/${uid}/`
      for (const item of draft.media) {
        if (!item.path.startsWith(prefix)) {
          throw new HttpsError('permission-denied', 'That attachment is not yours.')
        }
      }

      const day = slotDaySchema.safeParse(slotSnap.data())
      if (!day.success) {
        throw new HttpsError(
          'failed-precondition',
          'That day is not open for booking. Please pick another.'
        )
      }

      const found = findWindow(day.data, draft.slot.start, draft.slot.end)
      if (!found) {
        throw new HttpsError(
          'failed-precondition',
          'That time window is no longer offered. Please pick another.'
        )
      }
      if (windowHasPassed(draft.slot.date, found.window)) {
        throw new HttpsError(
          'failed-precondition',
          'That time has passed. Please pick a later window.'
        )
      }
      if (freeIn(found.window) <= 0) {
        throw new HttpsError(
          'failed-precondition',
          'That window just filled up. Please pick another.'
        )
      }

      const nextNumber = Number(counterSnap.data()?.next ?? FIRST_DISPLAY_NUMBER)
      if (nextNumber > LAST_DISPLAY_NUMBER) {
        // Deliberately not a customer-facing sentence: nothing they do fixes it.
        throw new Error('Booking reference numbers are exhausted')
      }

      // --- Money, from the catalog and nowhere else. ------------------------

      const price = priceBooking({ service: service.data, config })

      // --- Writes. ----------------------------------------------------------

      const now = Date.now()
      const online = draft.paymentMode === 'online'
      const payment: PaymentInfo = {
        mode: draft.paymentMode,
        status: 'pending',
      }

      // Paying online holds the place until the money lands; paying after the
      // service takes it outright, because there is nothing left to wait for.
      const windows = day.data.windows.map((window, index) =>
        index === found.index
          ? {
              ...window,
              held: online ? window.held + 1 : window.held,
              booked: online ? window.booked : window.booked + 1,
            }
          : window
      )
      tx.update(slotSnap.ref, { windows })

      tx.set(counterRef, { next: nextNumber + 1 }, { merge: true })

      const displayId = `#AP${nextNumber}`
      const holdExpiresAt = online
        ? now + config.slotHoldMinutes * 60 * 1000
        : undefined

      tx.set(bookingRef, {
        displayId,
        uid,
        applianceId: draft.applianceId,
        serviceKey: draft.serviceKey,
        brandId: draft.brandId,
        // Undefined fields are dropped on the way into Firestore rather than
        // stored as null — see ignoreUndefinedProperties in lib/admin.
        applianceType: draft.applianceType,
        modelNumber: draft.modelNumber,
        modelPhotoPath: draft.modelPhotoPath,
        userApplianceId: draft.userApplianceId,
        issueIds: draft.issueIds,
        otherIssueText: draft.otherIssueText,
        diagnosisShown: draft.diagnosisShown,
        media: draft.media,
        address,
        slot: draft.slot,
        holdExpiresAt,
        techPreference: draft.techPreference,
        technicianId: technician?.id,
        technicianSnapshot: technician ?? undefined,
        status: online ? 'pending_payment' : 'confirmed',
        price,
        payment,
        rescheduleCount: 0,
        createdAt: now,
        updatedAt: now,
      })

      // A create rather than a transition, so there is no `from` status to
      // check — but the timeline entry is written the same way as every other.
      writeEvent(
        tx,
        bookingRef,
        online ? 'pending_payment' : 'confirmed',
        {
          title: online ? 'Booking started' : 'Booking confirmed',
          note: online
            ? 'Your slot is held until the visit fee is paid.'
            : 'You will pay after the service is done.',
        },
        now
      )

      return {
        bookingId: bookingRef.id,
        displayId,
        price,
        requiresPayment: online,
        ...(holdExpiresAt === undefined ? {} : { holdExpiresAt }),
      }
    })
  }
)

/**
 * The address, copied rather than referenced. A booking has to keep saying
 * where the job happened even after the customer edits or deletes the saved
 * address it came from.
 */
async function readAddress(
  tx: FirebaseFirestore.Transaction,
  uid: string,
  draft: BookingDraft
): Promise<AddressSnapshot> {
  if (draft.addressId) {
    const snap = await tx.get(
      db()
        .collection(COL.users)
        .doc(uid)
        .collection(SUB.addresses)
        .doc(draft.addressId)
    )
    const parsed = addressSchema.safeParse({ id: snap.id, ...snap.data() })
    if (!snap.exists || !parsed.success) {
      throw new HttpsError(
        'failed-precondition',
        'That address is no longer saved. Please choose another.'
      )
    }
    return { ...parsed.data, sourceAddressId: snap.id }
  }

  if (draft.address) {
    // Typed in the flow and not saved to the address book. It still needs an
    // id, because everything downstream — the invoice, the technician's job
    // sheet — refers to the address by one.
    return { ...draft.address, id: `oneoff_${Date.now()}` }
  }

  throw new HttpsError('invalid-argument', 'Choose or add an address.')
}

/** The chosen expert, when the customer asked for one by name. */
async function readTechnician(
  tx: FirebaseFirestore.Transaction,
  draft: BookingDraft
) {
  if (draft.techPreference !== 'specific') return null
  if (!draft.technicianId) {
    throw new HttpsError('invalid-argument', 'Choose a technician.')
  }

  const snap = await tx.get(
    db().collection(COL.technicianPublic).doc(draft.technicianId)
  )
  const parsed = technicianPublicSchema.safeParse({
    id: snap.id,
    ...snap.data(),
  })
  if (!snap.exists || !parsed.success) {
    throw new HttpsError(
      'failed-precondition',
      'That expert is not available. Please choose another.'
    )
  }
  return parsed.data
}
