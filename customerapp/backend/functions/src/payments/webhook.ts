import { onRequest } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { z } from 'zod'
import { COL, formatPaise } from '@app/shared'
import { db } from '../lib/admin'
import { REGION } from '../lib/options'
import { markBookingPaid } from './markPaid'
import { topupMovementId } from './topup'
import { topUpWallet } from '../lib/wallet'
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
 * Two kinds of payment arrive here. A booking payment, which settles that
 * booking; and a top-up, which has no booking and whose amount is read off the
 * order record this server wrote when it raised the order — never off the
 * event, so a forged or replayed amount credits nothing.
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

/** What the order record written by `createTopupOrder` has to contain. */
const topupOrderSchema = z.object({
  uid: z.string().min(1),
  amount: z.number().int().positive(),
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

    const isTopup = payment.notes?.purpose === 'wallet_topup'
    const bookingId = payment.notes?.bookingId

    if (!isTopup && !bookingId) {
      logger.warn('razorpayWebhook: captured payment matched nothing we raised', {
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
        ...(bookingId ? { bookingId } : {}),
        ...(isTopup ? { purpose: 'wallet_topup' } : {}),
        receivedAt: Date.now(),
      })
    } catch {
      response.status(200).send('Already handled')
      return
    }

    try {
      if (isTopup) {
        await creditTopup(payment.id, payment.order_id)
      } else if (bookingId) {
        const result = await markBookingPaid(bookingId, payment.id)
        logger.info('razorpayWebhook: handled a captured payment', {
          bookingId,
          changed: result.changed,
          outcome: result.status,
        })
      }
      response.status(200).send('OK')
    } catch (error) {
      // The claim is released so the redelivery can try again rather than
      // being swallowed by the record of an attempt that failed.
      await eventRef.delete().catch(() => undefined)
      logger.error('razorpayWebhook: failed to handle a captured payment', {
        bookingId,
        isTopup,
        error,
      })
      response.status(500).send('Retry')
    }
  }
)

/**
 * Credit a captured top-up.
 *
 * The amount comes from the order record this server wrote when it raised the
 * order, never from the event. The event is signed, so its own numbers could
 * be trusted — but the order record is the thing that says what the customer
 * agreed to, and reading one number from one place is how it stays possible
 * to reconcile this later.
 *
 * A missing order record is not a retry. It means we were paid against an
 * order we have no record of raising, which redelivery cannot fix and which
 * somebody needs to look at.
 */
async function creditTopup(
  paymentId: string,
  orderId: string | undefined
): Promise<void> {
  if (!orderId) {
    logger.error('razorpayWebhook: top-up capture carried no order id', {
      paymentId,
    })
    return
  }

  const snap = await db().collection(COL.topupOrders).doc(orderId).get()
  const order = topupOrderSchema.safeParse(snap.data())
  if (!snap.exists || !order.success) {
    logger.error('razorpayWebhook: no record of the top-up order that was paid', {
      paymentId,
      orderId,
    })
    return
  }

  const result = await topUpWallet({
    uid: order.data.uid,
    amount: order.data.amount,
    note: `Added ${formatPaise(order.data.amount)} to your balance`,
    id: topupMovementId(paymentId),
  })

  logger.info('razorpayWebhook: handled a captured top-up', {
    orderId,
    applied: result.applied,
    balance: result.balance,
  })
}
