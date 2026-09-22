'use client'

import type { PurchaseRequest } from '@app/shared'
import { callFn } from './callables'
import { CheckoutDismissed, openCheckout } from './checkout'

/**
 * Buying a plan, a membership or a gift card, from the customer's side.
 *
 * The same three calls the top-up makes, and for the same reasons: raise the
 * order, open the sheet, tell the server what came back. What is being bought
 * is sent once, to raise the order; the price is decided there and every later
 * step reads it off the record the server wrote.
 *
 * There is no 'unsettled' outcome. If the verify call fails after a capture,
 * the webhook fulfils the same order with the same payment id — what was bought
 * is not lost, it is only slower to appear, and the screens say so.
 */

export type PurchaseOutcome =
  /** Paid for and handed over. */
  | { kind: 'bought'; expiresAt?: number; code?: string }
  /** The sheet was closed. Nothing was charged and nothing is wrong. */
  | { kind: 'cancelled' }

export async function buy(
  request: PurchaseRequest,
  customer?: { name?: string; phone?: string }
): Promise<PurchaseOutcome> {
  const order = await callFn('createPurchaseOrder', { request })

  let result
  try {
    result = await openCheckout({
      keyId: order.keyId,
      orderId: order.orderId,
      amountPaise: order.amount,
      description: order.description,
      customerName: customer?.name,
      customerPhone: customer?.phone,
    })
  } catch (error) {
    // Closing the sheet is not a failure and must not be reported as one. Any
    // other error is: it means the sheet could not be opened at all.
    if (error instanceof CheckoutDismissed) return { kind: 'cancelled' }
    throw error
  }

  const verified = await callFn('verifyPurchase', result)
  return {
    kind: 'bought',
    ...(verified.expiresAt === undefined ? {} : { expiresAt: verified.expiresAt }),
    ...(verified.code === undefined ? {} : { code: verified.code }),
  }
}
