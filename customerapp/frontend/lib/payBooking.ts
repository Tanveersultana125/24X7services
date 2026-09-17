'use client'

import type { PaymentPurpose } from '@app/shared'
import { callFn } from './callables'
import { openCheckout } from './checkout'

/**
 * Pay for a booking that already exists.
 *
 * The booking flow's payment screen does this inline, because there it is one
 * step of a longer thing. Everywhere else — an unpaid visit fee picked up later,
 * a balance settled after the job — it is a single action on a booking that is
 * already there, and it is the same three calls every time: raise the order,
 * open the sheet, verify what comes back.
 *
 * The amount is never passed in. It comes back from `createPaymentOrder`, which
 * reads it off the booking the server priced.
 */

export type PayOutcome =
  | { kind: 'paid' }
  /** The sheet was closed. Nothing was charged and nothing is wrong. */
  | { kind: 'cancelled' }
  /** Charged, but the booking could not be updated — support territory. */
  | { kind: 'unsettled' }

export async function payBooking(
  bookingId: string,
  purpose: PaymentPurpose,
  customer?: { name?: string; phone?: string }
): Promise<PayOutcome> {
  const order = await callFn('createPaymentOrder', { bookingId, purpose })

  const result = await openCheckout({
    keyId: order.keyId,
    orderId: order.orderId,
    amountPaise: order.amount,
    description: `${
      purpose === 'visit_fee' ? 'Visit fee' : 'Balance'
    } · ${order.bookingDisplayId}`,
    customerName: customer?.name,
    customerPhone: customer?.phone,
  })

  const verified = await callFn('verifyPayment', { bookingId, ...result })
  return verified.status === 'paid' ? { kind: 'paid' } : { kind: 'unsettled' }
}
