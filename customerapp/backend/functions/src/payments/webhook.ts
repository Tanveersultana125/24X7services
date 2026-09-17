import { onRequest } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { z } from 'zod'
import { COL } from '@app/shared'
import { db } from '../lib/admin'
import { REGION } from '../lib/options'
import { markBookingPaid } from './markPaid'
import { PAYMENT_SECRETS, verifyWebhookSignature } from '../lib/razorpay'

/**
 * Razorpay's account of what happened, which is the account that counts.
 *
 * A customer's checkout returning is a hint: they can close the app mid-payment,
 * lose signal, or be on a phone that backgrounds the tab. This endpoint is the
 * one path that always runs, so it is what a booking's paid state really rests
 * on — `verifyPayment` only gets there first when it can.
 *
 * Three things make it safe to expose:
 *
 *   - The signature is checked over the exact bytes received, so a POST that
 *     did not come from Razorpay does nothing.
 *   - The event id is recorded before the work, so a redelivery — which
 *     Razorpay will do, repeatedly, until it gets a 2xx — is a no-op.
 *   - The booking id comes from the order's notes, which were written by
 *     `createPaymentOrder`, not from anything the caller composed.
 *
 * It answers 200 to anything it has safely decided not to act on. A 500 tells
 * Razorpay to try again, and there is no point retrying a malformed event.
 */

const eventSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string().min(1),
        order_id: z.string().min(1).optional(),
        notes: z.record(z.string()).optional(),
      }),
    }),
  }),
})

export const razorpayWebhook = onRequest(
  { region: REGION, secrets: PAYMENT_SECRETS, cors: false },
  async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).send('Method not allowed')
      return
    }

    const signature = request.get('x-razorpay-signature')
    if (!signature || !verifyWebhookSignature(request.rawBody, signature)) {
      // Not "invalid signature" — an endpoint that tells an attacker how close
      // they got is an endpoint helping them.
      logger.warn('razorpayWebhook: rejected an unsigned or mis-signed event')
      response.status(401).send('Unauthorized')
      return
    }

    const parsed = eventSchema.safeParse(request.body)
    if (!parsed.success) {
      logger.warn('razorpayWebhook: unrecognised event shape', {
        issues: parsed.error.issues,
      })
      response.status(200).send('Ignored')
      return
    }

    const { event, payload } = parsed.data
    const payment = payload.payment.entity

    // Razorpay sends a payment id in its own header on some plans; the entity
    // id is always there and is what makes an event unique.
    const eventId = `${event}_${payment.id}`
    const eventRef = db().collection(COL.processedWebhookEvents).doc(eventId)

    if (event !== 'payment.captured') {
      response.status(200).send('Ignored')
      return
    }

    const bookingId = payment.notes?.bookingId
    if (!bookingId) {
      logger.warn('razorpayWebhook: captured payment carried no bookingId', {
        paymentId: payment.id,
      })
      response.status(200).send('Ignored')
      return
    }

    // Claim the event first. A create fails if the document exists, so two
    // simultaneous deliveries cannot both get past this line.
    try {
      await eventRef.create({
        event,
        paymentId: payment.id,
        bookingId,
        receivedAt: Date.now(),
      })
    } catch {
      response.status(200).send('Already handled')
      return
    }

    try {
      const result = await markBookingPaid(bookingId, payment.id)
      logger.info('razorpayWebhook: handled a captured payment', {
        bookingId,
        changed: result.changed,
        outcome: result.status,
      })
      response.status(200).send('OK')
    } catch (error) {
      // The claim is released so the redelivery can try again rather than
      // being swallowed by the record of an attempt that failed.
      await eventRef.delete().catch(() => undefined)
      logger.error('razorpayWebhook: failed to confirm a paid booking', {
        bookingId,
        error,
      })
      response.status(500).send('Retry')
    }
  }
)
