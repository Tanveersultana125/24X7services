import { HttpsError } from 'firebase-functions/v2/https'
import { bookingSchema, COL } from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'
import { markBookingPaid } from './markPaid'
import {
  createOrder,
  PAYMENT_SECRETS,
  publicKeyId,
  verifyPaymentSignature,
} from '../lib/razorpay'

/**
 * Raising a payment, and accepting the answer.
 *
 * The amount is never taken from the client. It is read off the booking, which
 * the server priced from the catalog, so the order is for what is owed and not
 * for what a request said was owed.
 */

export const createPaymentOrder = defineCallable(
  'createPaymentOrder',
  async ({ bookingId, purpose }, caller) => {
    const bookingRef = db().collection(COL.bookings).doc(bookingId)
    const snap = await bookingRef.get()
    const parsed = bookingSchema.safeParse({ id: snap.id, ...snap.data() })

    // A booking that is not this customer's is reported as missing rather than
    // forbidden. "That is not yours" confirms it exists.
    if (!snap.exists || !parsed.success || parsed.data.uid !== caller.uid) {
      throw new HttpsError('not-found', 'We could not find that booking.')
    }
    const booking = parsed.data

    if (booking.payment.status === 'paid' || booking.price.due <= 0) {
      throw new HttpsError('failed-precondition', 'This booking is already paid.')
    }
    if (booking.status === 'cancelled' || booking.status === 'refunded') {
      throw new HttpsError('failed-precondition', 'This booking was cancelled.')
    }
    if (purpose === 'visit_fee' && booking.status !== 'pending_payment') {
      throw new HttpsError(
        'failed-precondition',
        'The visit fee for this booking has already been settled.'
      )
    }

    const order = await createOrder({
      amountPaise: booking.price.due,
      receipt: booking.displayId,
      // Notes come back on the webhook, which is how an event is matched to a
      // booking without trusting anything the client sends.
      notes: { bookingId, uid: booking.uid, purpose },
    })

    await bookingRef.update({
      'payment.razorpayOrderId': order.id,
      updatedAt: Date.now(),
    })

    return {
      orderId: order.id,
      amount: booking.price.due,
      currency: 'INR' as const,
      keyId: publicKeyId(),
      bookingDisplayId: booking.displayId,
    }
  },
  { secrets: PAYMENT_SECRETS }
)

/**
 * What Checkout hands back when the customer finishes paying.
 *
 * This is a convenience, not the source of truth. The signature proves the
 * response came from Razorpay and not from a modified client, but the webhook
 * is what the booking's state really rests on — so this confirms the booking if
 * it can, and says `pending` rather than lying if anything is out of step.
 */
export const verifyPayment = defineCallable(
  'verifyPayment',
  async (
    { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature },
    caller
  ) => {
    const snap = await db().collection(COL.bookings).doc(bookingId).get()
    const parsed = bookingSchema.safeParse({ id: snap.id, ...snap.data() })
    if (!snap.exists || !parsed.success || parsed.data.uid !== caller.uid) {
      throw new HttpsError('not-found', 'We could not find that booking.')
    }
    const booking = parsed.data

    // The order has to be the one this booking raised. Without this check a
    // signature from any other genuine Razorpay order would confirm it.
    if (booking.payment.razorpayOrderId !== razorpayOrderId) {
      throw new HttpsError(
        'failed-precondition',
        'That payment does not belong to this booking.'
      )
    }

    if (
      !verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      )
    ) {
      throw new HttpsError(
        'permission-denied',
        'We could not verify that payment. Nothing has been charged twice — ' +
          'please contact support if money has left your account.'
      )
    }

    const result = await markBookingPaid(bookingId, razorpayPaymentId)
    if (result.status === 'gone') {
      return { status: 'failed' as const, price: result.price }
    }
    return { status: 'paid' as const, price: result.price }
  },
  { secrets: PAYMENT_SECRETS }
)
