import { HttpsError } from 'firebase-functions/v2/https'
import { COL, TOPUP_MAX, TOPUP_MIN, formatPaise } from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'
import { movementId, topUpWallet } from '../lib/wallet'
import {
  createOrder,
  PAYMENT_SECRETS,
  publicKeyId,
  verifyPaymentSignature,
} from '../lib/razorpay'

/**
 * Putting money into the balance.
 *
 * The one place in this app where money arrives without a booking attached,
 * which changes what has to be written down. A booking payment can take its
 * amount off the booking, because the server priced it; a top-up has nothing
 * to read it off, and taking the amount from the client at capture time would
 * let a ₹100 payment credit ₹10,000.
 *
 * So the order is recorded when it is raised — who asked, and for how much —
 * and every path that credits the balance afterwards reads the amount from
 * that record rather than from anything that arrived with the confirmation.
 * The client's own numbers are used exactly once, to decide what to charge,
 * and they are bounded before they get that far.
 */

/** The note that lands on the customer's statement. */
function topupNote(amount: number): string {
  return `Added ${formatPaise(amount)} to your balance`
}

/**
 * The id that makes a top-up happen once.
 *
 * Built from the Razorpay payment id, not the order id: an order can be paid
 * by a payment that later fails and be retried with a second one, and those
 * are two different arrivals of money. Two handlers seeing the same payment
 * — the webhook and the verify below — produce the same id and the second
 * finds the first already there.
 */
export function topupMovementId(paymentId: string): string {
  return movementId(['topup', paymentId])
}

export const createTopupOrder = defineCallable(
  'createTopupOrder',
  async ({ amount }, caller) => {
    // The schema in the registry already bounds this. Checked again here
    // because the bound is the whole protection on an amount the customer
    // chose, and a handler that trusts its caller to have validated is a
    // handler that stops being safe the day it gains a second caller.
    if (amount < TOPUP_MIN || amount > TOPUP_MAX) {
      throw new HttpsError(
        'invalid-argument',
        `Top-ups are between ${formatPaise(TOPUP_MIN)} and ${formatPaise(TOPUP_MAX)}.`
      )
    }

    const uid = caller.uid
    if (!uid) {
      // Unreachable: the registry marks this callable auth-only. Here so the
      // type narrows without a non-null assertion standing in for a check.
      throw new HttpsError('unauthenticated', 'Please sign in first.')
    }

    const order = await createOrder({
      amountPaise: amount,
      // Razorpay caps the receipt at 40 characters and shows it on the
      // dashboard, where "who and when" is the only useful thing to read.
      receipt: `topup_${uid.slice(0, 20)}_${Date.now().toString(36)}`,
      // Echoed back on the webhook, which is how an event is recognised as a
      // top-up rather than a booking payment without trusting the sender.
      notes: { purpose: 'wallet_topup', uid },
    })

    // Written before the customer is sent to pay. If this fails, nothing has
    // been charged; if it succeeded and the payment never happens, an unpaid
    // order record costs nothing and credits nobody.
    await db().collection(COL.topupOrders).doc(order.id).set({
      uid,
      amount,
      createdAt: Date.now(),
    })

    return {
      orderId: order.id,
      amount,
      currency: 'INR' as const,
      keyId: publicKeyId(),
    }
  },
  { secrets: PAYMENT_SECRETS }
)

/**
 * What Checkout hands back when the customer finishes paying.
 *
 * A convenience, exactly as it is for bookings: the signature proves the
 * response came from Razorpay rather than from a modified client, and the
 * webhook is what the balance really rests on. This gets there first when it
 * can, so the screen does not have to sit on a spinner waiting for a callback
 * that arrives on its own schedule.
 */
export const verifyTopup = defineCallable(
  'verifyTopup',
  async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }, caller) => {
    const uid = caller.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Please sign in first.')

    const snap = await db().collection(COL.topupOrders).doc(razorpayOrderId).get()
    const order = snap.data()

    // An order that is not this customer's is reported as missing rather than
    // forbidden. "That is not yours" confirms it exists.
    if (!snap.exists || order?.uid !== uid || typeof order.amount !== 'number') {
      throw new HttpsError('not-found', 'We could not find that top-up.')
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

    const result = await topUpWallet({
      uid,
      amount: order.amount,
      note: topupNote(order.amount),
      id: topupMovementId(razorpayPaymentId),
    })

    return { balance: result.balance }
  },
  { secrets: PAYMENT_SECRETS }
)
