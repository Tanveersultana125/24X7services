import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions'
import {
  bookingSchema,
  businessConfigSchema,
  catalogServiceSchema,
  COL,
  DOC,
  repairRequestSchema,
  SUB,
  type AddressSnapshot,
  type Booking,
  type BusinessConfig,
  type Invoice,
  type Warranty,
} from '@app/shared'
import { db } from '../lib/admin'
import { REGION } from '../lib/options'
import { renderInvoicePdf } from '../lib/invoicePdf'
import { consumePlanVisit } from '../lib/cover'
import { rewardReferral } from '../commerce/referral'

/**
 * What a finished job leaves behind: an invoice, a warranty, and — where they
 * apply — a visit off a plan and a referral paid out.
 *
 * Both are documents, written once, and both freeze what was true on the day.
 * The invoice copies the seller's legal name, GSTIN, address, SAC code and rate
 * out of the config rather than referring to it, because an invoice has to keep
 * saying what it said after the business moves office. The warranty copies its
 * own terms for the same reason.
 *
 * It runs once. A booking that already has an invoice is left alone, so a
 * retried trigger — and Firestore triggers are retried — does not issue a
 * second invoice number for the same job.
 */

/**
 * DECISION NEEDED: these are the same for every service. The warranty schema
 * describes them as copied from the service, and the catalog has nowhere to put
 * them. Either `catalogServices` grows `covers` and `excludes`, or the business
 * confirms that one set of terms covers everything it does.
 */
const WARRANTY_COVERS = [
  'The work described on your invoice',
  'Parts we supplied and fitted during this visit',
  'A return visit if the same fault comes back',
]

const WARRANTY_EXCLUDES = [
  'A different fault, or a different appliance',
  'Damage from misuse, power surges, water or pests',
  'Work done by anyone else after our visit',
  'Parts you supplied yourself',
]

export const onBookingCompleted = onDocumentWritten(
  { document: `${COL.bookings}/{bookingId}`, region: REGION },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!after) return
    if (before?.status === after.status) return
    if (after.status !== 'completed') return

    const bookingId = event.params.bookingId
    const parsed = bookingSchema.safeParse({ id: bookingId, ...after })
    if (!parsed.success) {
      logger.error('onBookingCompleted: booking is not readable', { bookingId })
      return
    }
    const booking = parsed.data

    // A plan visit and a referral are settled before the early return below,
    // because both have to happen on a job whose paperwork was already
    // issued — a retried trigger that stopped at the invoice check would
    // never pay them. Each is idempotent in its own right, and neither can
    // throw: a referral that failed to pay is a support conversation, and an
    // invoice that failed to issue is not.
    await consumePlanVisit(bookingId)
    await rewardReferral(booking.uid)

    // Already issued. The trigger is at-least-once, and an invoice number is
    // the one thing in this system that must never be handed out twice.
    if (booking.invoiceId && booking.warrantyId) return

    const configSnap = await db()
      .collection(COL.config)
      .doc(DOC.businessConfig)
      .get()
    const config = businessConfigSchema.safeParse(configSnap.data())
    if (!config.success) {
      logger.error('onBookingCompleted: business config unreadable', { bookingId })
      return
    }

    try {
      const invoice = await issueInvoice(booking, config.data)
      const warranty = await issueWarranty(booking, config.data)

      await db().collection(COL.bookings).doc(bookingId).update({
        invoiceId: invoice.id,
        warrantyId: warranty.id,
        updatedAt: Date.now(),
      })

      // The PDF is generated after the documents exist, because the screen
      // renders from the invoice document and should not wait on a render.
      await attachPdf(invoice)
    } catch (error) {
      logger.error('onBookingCompleted: could not close out the job', {
        bookingId,
        error,
      })
      throw error
    }
  }
)

// ---------------------------------------------------------------------------
// Invoice
// ---------------------------------------------------------------------------

async function issueInvoice(
  booking: Booking,
  config: BusinessConfig
): Promise<Invoice> {
  const lines = await invoiceLines(booking)
  const counterRef = db().collection(COL.counters).doc(DOC.invoiceCounter)
  const invoiceRef = db().collection(COL.invoices).doc()

  const number = await db().runTransaction(async (tx) => {
    const snap = await tx.get(counterRef)
    const next = Number(snap.data()?.next ?? 1)
    tx.set(counterRef, { next: next + 1 }, { merge: true })
    // Restarts each financial year, which is how a GST series is expected to
    // read. The year is the one the invoice is issued in.
    return `${financialYear()}/${String(next).padStart(5, '0')}`
  })

  const invoice: Invoice = {
    id: invoiceRef.id,
    bookingId: booking.id,
    uid: booking.uid,
    number,
    issuedAt: Date.now(),
    seller: {
      legalName: config.legalName,
      gstin: config.gstin,
      address: config.address,
    },
    buyer: {
      name: await customerName(booking.uid),
      address: oneLineAddress(booking.address),
    },
    sacCode: config.sacCode,
    gstRate: config.gstRate,
    lines,
    price: booking.price,
    // Derived from the amounts, not copied from the booking. `payment.status`
    // answers "was the visit fee taken"; an invoice has to answer "is this
    // bill settled", and an approved repair makes those two different
    // questions — a footer reading "paid in full" above a line reading "due
    // ₹1,100" is the kind of thing customers rightly ring up about.
    paymentStatus: settlementOf(booking),
  }

  await invoiceRef.set(invoice)
  return invoice
}

/**
 * The visit fee, then each repair the customer actually approved, by name.
 *
 * Itemised rather than summed: a single "services rendered" line is the thing
 * that makes people ring up, and every line here is one they already said yes
 * to on the approval screen.
 */
async function invoiceLines(
  booking: Booking
): Promise<Invoice['lines']> {
  const lines: Invoice['lines'] = [
    { label: 'Visit and inspection', amount: booking.price.visitFee },
  ]

  const requests = await db()
    .collection(COL.bookings)
    .doc(booking.id)
    .collection(SUB.repairRequests)
    .get()

  for (const doc of requests.docs) {
    const parsed = repairRequestSchema.safeParse({ id: doc.id, ...doc.data() })
    if (!parsed.success) continue
    for (const item of parsed.data.items) {
      if (!parsed.data.approvedItemIds.includes(item.id)) continue
      lines.push({
        label: item.label,
        amount: item.partPaise + item.labourPaise,
      })
    }
  }

  return lines
}

/** Whether this bill is settled, from the money rather than from a flag. */
function settlementOf(booking: Booking): Invoice['paymentStatus'] {
  if (booking.price.due <= 0) return 'paid'
  return booking.price.paid > 0 ? 'partially_paid' : 'pending'
}

/** The address as it should read on a bill: one line, landmark included. */
function oneLineAddress(address: AddressSnapshot): string {
  return [
    address.flat,
    address.area,
    address.landmark ? `near ${address.landmark}` : null,
    `${address.city} ${address.pincode}`,
  ]
    .filter(Boolean)
    .join(', ')
}

async function customerName(uid: string): Promise<string> {
  const snap = await db().collection(COL.users).doc(uid).get()
  const name = snap.data()?.name
  return typeof name === 'string' && name.trim().length > 0
    ? name.trim()
    : 'Customer'
}

/** `2026-27` for anything from April 2026 to March 2027. */
function financialYear(now: number = Date.now()): string {
  const ist = new Date(now + 5.5 * 60 * 60 * 1000)
  const year = ist.getUTCFullYear()
  const startYear = ist.getUTCMonth() >= 3 ? year : year - 1
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`
}

async function attachPdf(invoice: Invoice): Promise<void> {
  try {
    const path = await renderInvoicePdf(invoice)
    await db().collection(COL.invoices).doc(invoice.id).update({ pdfPath: path })
  } catch (error) {
    // The invoice itself is a document and renders on screen without this.
    // A failed PDF is worth a log, not a failed completion.
    logger.error('onBookingCompleted: invoice PDF failed', {
      invoiceId: invoice.id,
      error,
    })
  }
}

// ---------------------------------------------------------------------------
// Warranty
// ---------------------------------------------------------------------------

async function issueWarranty(
  booking: Booking,
  config: BusinessConfig
): Promise<Warranty> {
  const serviceSnap = await db()
    .collection(COL.catalogServices)
    .doc(`${booking.applianceId}_${booking.serviceKey}`)
    .get()
  const service = catalogServiceSchema.safeParse({
    id: serviceSnap.id,
    ...serviceSnap.data(),
  })

  const days = service.success
    ? (service.data.warrantyDays ?? config.defaultWarrantyDays)
    : config.defaultWarrantyDays

  const ref = db().collection(COL.warranties).doc()
  const startsAt = Date.now()

  const warranty: Warranty = {
    id: ref.id,
    bookingId: booking.id,
    uid: booking.uid,
    applianceId: booking.applianceId,
    brandId: booking.brandId,
    serviceKey: booking.serviceKey,
    startsAt,
    expiresAt: startsAt + days * 24 * 60 * 60 * 1000,
    covers: WARRANTY_COVERS,
    excludes: WARRANTY_EXCLUDES,
  }

  await ref.set(warranty)
  return warranty
}
