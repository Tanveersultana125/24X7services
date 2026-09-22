import { randomInt } from 'node:crypto'
import { HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { z } from 'zod'
import {
  catalogPlanSchema,
  COL,
  formatPaise,
  GIFT_CARD_AMOUNTS,
  GIFT_CODE_ALPHABET,
  membershipOption,
  membershipSchema,
  purchaseKindSchema,
  type CatalogPlan,
  type Paise,
  type PurchaseKind,
  type PurchaseRequest,
} from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'
import {
  createOrder,
  PAYMENT_SECRETS,
  publicKeyId,
  verifyPaymentSignature,
} from '../lib/razorpay'

/**
 * Buying a plan, a membership or a gift card.
 *
 * All three are one path, because from the gateway's side they are the same
 * transaction: raise an order, take the money, write down what it bought. Three
 * copies of that would be three copies of a signature check, which is the one
 * piece of code in this backend that must not exist in triplicate.
 *
 * The rule the top-up path established holds here too, and matters more: the
 * client never sends a price. A plan is priced from the catalog, a membership
 * from the table in the shared schema, and a gift card is the one that carries
 * an amount — which is checked against the amounts actually offered before it
 * reaches the gateway. What was bought and what it cost are written to the
 * order record when the order is raised, and every path that hands the customer
 * something afterwards reads from that record rather than from what came back
 * with the confirmation.
 *
 * Fulfilment is idempotent on the payment id and runs in a transaction, because
 * two callers race for it — the verify call the client makes when checkout
 * returns, and the webhook. Whichever arrives second hands back what the first
 * one produced and writes nothing.
 */

/** What the order record holds. Written here, read by everything downstream. */
const purchaseOrderSchema = z.object({
  uid: z.string().min(1),
  kind: purchaseKindSchema,
  amount: z.number().int().min(1),
  /** Plans only. */
  planId: z.string().min(1).optional(),
  /** Memberships only. */
  optionId: z.enum(['plus-monthly', 'plus-yearly']).optional(),
  /** Gift cards only, and copied onto the card at fulfilment. */
  recipientName: z.string().max(60).optional(),
  message: z.string().max(200).optional(),
  createdAt: z.number().int().min(0),
  /** The payment that fulfilled it. Its presence is what stops a second. */
  fulfilledPaymentId: z.string().min(1).optional(),
  /** What fulfilment produced, so a retry can answer without redoing it. */
  outcome: z
    .object({
      expiresAt: z.number().int().optional(),
      code: z.string().optional(),
    })
    .optional(),
})
type PurchaseOrder = z.infer<typeof purchaseOrderSchema>

const DAY_MS = 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Raising the order
// ---------------------------------------------------------------------------

/** What the payment sheet says the money is for. */
function describe(kind: PurchaseKind, name: string, amount: Paise): string {
  switch (kind) {
    case 'plan':
      return name
    case 'membership':
      return `24X7 Plus, ${name}`
    case 'gift_card':
      return `${formatPaise(amount)} 24X7 gift card`
  }
}

export const createPurchaseOrder = defineCallable(
  'createPurchaseOrder',
  async ({ request }, caller) => {
    const uid = caller.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Please sign in first.')

    const priced = await price(request)

    const order = await createOrder({
      amountPaise: priced.amount,
      // Razorpay caps the receipt at 40 characters and shows it on the
      // dashboard, where "who, what and when" is all that is worth reading.
      receipt: `${request.kind.slice(0, 4)}_${uid.slice(0, 18)}_${Date.now().toString(36)}`,
      // Echoed back on the webhook, which is how an event is recognised as a
      // purchase without trusting anything the sender composed.
      notes: { purpose: 'purchase', uid, kind: request.kind },
    })

    // Written before the customer is sent to pay. If this fails nothing has
    // been charged; if it succeeds and the payment never happens, an unpaid
    // order record costs nothing and hands over nothing.
    const record: PurchaseOrder = {
      uid,
      kind: request.kind,
      amount: priced.amount,
      createdAt: Date.now(),
      ...(request.kind === 'plan' ? { planId: request.planId } : {}),
      ...(request.kind === 'membership' ? { optionId: request.optionId } : {}),
      ...(request.kind === 'gift_card'
        ? {
            ...(request.recipientName
              ? { recipientName: request.recipientName }
              : {}),
            ...(request.message ? { message: request.message } : {}),
          }
        : {}),
    }
    await db().collection(COL.purchaseOrders).doc(order.id).set(record)

    return {
      orderId: order.id,
      amount: priced.amount,
      currency: 'INR' as const,
      keyId: publicKeyId(),
      description: describe(request.kind, priced.name, priced.amount),
    }
  },
  { secrets: PAYMENT_SECRETS }
)

/**
 * What this costs, decided here and nowhere else.
 *
 * A gift card is the only request carrying a number, and it has to be one of
 * the amounts actually offered — the schema bounds it to a range, and a range
 * is not the same as a list.
 */
async function price(
  request: PurchaseRequest
): Promise<{ amount: Paise; name: string }> {
  switch (request.kind) {
    case 'plan': {
      const plan = await readPlan(request.planId)
      return { amount: plan.price, name: plan.name }
    }
    case 'membership': {
      const option = membershipOption(request.optionId)
      return { amount: option.price, name: option.label.toLowerCase() }
    }
    case 'gift_card': {
      if (!GIFT_CARD_AMOUNTS.includes(request.amount)) {
        throw new HttpsError(
          'invalid-argument',
          'Choose one of the gift card amounts shown.'
        )
      }
      return { amount: request.amount, name: 'gift card' }
    }
  }
}

async function readPlan(planId: string): Promise<CatalogPlan> {
  const snap = await db().collection(COL.catalogPlans).doc(planId).get()
  const parsed = catalogPlanSchema.safeParse({ id: snap.id, ...snap.data() })
  if (!snap.exists || !parsed.success || !parsed.data.active) {
    throw new HttpsError('not-found', 'That plan is no longer available.')
  }
  return parsed.data
}

// ---------------------------------------------------------------------------
// Verifying, and handing over what was bought
// ---------------------------------------------------------------------------

export const verifyPurchase = defineCallable(
  'verifyPurchase',
  async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }, caller) => {
    const uid = caller.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Please sign in first.')

    const snap = await db()
      .collection(COL.purchaseOrders)
      .doc(razorpayOrderId)
      .get()
    const order = purchaseOrderSchema.safeParse(snap.data())

    // An order that is not this customer's is reported as missing rather than
    // forbidden. "That is not yours" confirms it exists.
    if (!snap.exists || !order.success || order.data.uid !== uid) {
      throw new HttpsError('not-found', 'We could not find that purchase.')
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

    return fulfilPurchase(razorpayOrderId, razorpayPaymentId)
  },
  { secrets: PAYMENT_SECRETS }
)

export interface Fulfilment {
  kind: PurchaseKind
  expiresAt?: number
  code?: string
}

/**
 * Hand over what was paid for.
 *
 * Called by the verify above and by the webhook, which is why it takes ids
 * rather than a caller and why the whole of it sits inside one transaction with
 * the order record in it. That record is both the source of what to hand over
 * and the lock that stops it being handed over twice: a second call with the
 * same payment id reads back what the first one produced.
 */
export async function fulfilPurchase(
  orderId: string,
  paymentId: string
): Promise<Fulfilment> {
  const orderRef = db().collection(COL.purchaseOrders).doc(orderId)

  // Read outside the transaction only to learn which documents it will have to
  // read inside one — a transaction cannot decide what to read after it has
  // started writing, and the plan lives in the catalog rather than the order.
  const preview = purchaseOrderSchema.safeParse((await orderRef.get()).data())
  if (!preview.success) {
    throw new HttpsError('not-found', 'We could not find that purchase.')
  }

  const plan =
    preview.data.kind === 'plan' && preview.data.planId
      ? await readPlan(preview.data.planId)
      : null

  return db().runTransaction(async (tx) => {
    const snap = await tx.get(orderRef)
    const parsed = purchaseOrderSchema.safeParse(snap.data())
    if (!parsed.success) {
      throw new HttpsError('not-found', 'We could not find that purchase.')
    }
    const order = parsed.data

    // Already done, by whichever of the two callers got here first.
    if (order.fulfilledPaymentId) {
      return { kind: order.kind, ...(order.outcome ?? {}) }
    }

    const now = Date.now()
    let outcome: { expiresAt?: number; code?: string } = {}

    if (order.kind === 'plan') {
      if (!plan) {
        throw new HttpsError('not-found', 'That plan is no longer available.')
      }
      const expiresAt = now + plan.durationDays * DAY_MS
      // Keyed by the payment, so the document id itself cannot be handed out
      // twice for one payment even if this transaction were re-run.
      tx.set(db().collection(COL.userPlans).doc(`p_${paymentId}`), {
        uid: order.uid,
        planId: plan.id,
        // Copied, not referred to: a plan re-priced next April must not
        // rewrite what this customer bought today.
        name: plan.name,
        applianceIds: plan.applianceIds,
        price: order.amount,
        visitsIncluded: plan.visitsIncluded,
        visitsUsed: 0,
        benefits: plan.benefits,
        startsAt: now,
        expiresAt,
        paymentId,
        createdAt: now,
      })
      outcome = { expiresAt }
    }

    if (order.kind === 'membership') {
      const option = membershipOption(order.optionId ?? 'plus-monthly')
      const membershipRef = db().collection(COL.memberships).doc(order.uid)
      const existing = membershipSchema.safeParse(
        (await tx.get(membershipRef)).data()
      )

      // Buying while still a member extends rather than restarts. Anything
      // else throws away days the customer has already paid for.
      const from =
        existing.success && existing.data.expiresAt > now
          ? existing.data.expiresAt
          : now
      const expiresAt = from + option.durationDays * DAY_MS

      tx.set(
        membershipRef,
        {
          tier: option.tier,
          period: option.period,
          startsAt: existing.success ? existing.data.startsAt : now,
          expiresAt,
          autoRenew: false,
          paymentId,
          updatedAt: now,
        },
        { merge: true }
      )
      outcome = { expiresAt }
    }

    if (order.kind === 'gift_card') {
      const code = giftCode()
      tx.set(db().collection(COL.giftCards).doc(code), {
        code,
        amount: order.amount,
        status: 'active',
        purchasedBy: order.uid,
        purchasedAt: now,
        ...(order.recipientName ? { recipientName: order.recipientName } : {}),
        ...(order.message ? { message: order.message } : {}),
      })
      outcome = { code }
    }

    tx.set(orderRef, { fulfilledPaymentId: paymentId, outcome }, { merge: true })

    logger.info('fulfilPurchase: handed over a purchase', {
      orderId,
      kind: order.kind,
      uid: order.uid,
    })

    return { kind: order.kind, ...outcome }
  })
}

/**
 * `24X7-ABCD-EFGH`, from an alphabet with no O, 0, I or 1 in it.
 *
 * Forty bits from `randomInt`, which is the CSPRNG and not `Math.random`: this
 * string is the only thing between a stranger and somebody else's money. A
 * collision would be caught downstream — two cards cannot share a document id,
 * and the redeem path claims one before it credits anything — but at these odds
 * it is a thing that does not happen rather than a thing that is handled.
 */
function giftCode(): string {
  const pick = (): string =>
    GIFT_CODE_ALPHABET[randomInt(GIFT_CODE_ALPHABET.length)] ?? 'A'
  const block = (): string => Array.from({ length: 4 }, pick).join('')
  return `24X7-${block()}-${block()}`
}
