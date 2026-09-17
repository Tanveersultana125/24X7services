import { createHmac, timingSafeEqual } from 'node:crypto'
import { defineSecret } from 'firebase-functions/params'
import { logger } from 'firebase-functions'

/**
 * Razorpay, over its REST API rather than its SDK.
 *
 * Raising an order is one authenticated POST and both signature checks are an
 * HMAC, so the SDK would buy nothing and cost a dependency that has to survive
 * bundling and be installed in the deployed runtime. `fetch` is in Node 20 and
 * `node:crypto` is in the platform.
 *
 * Nothing here is ever given a key. The key id is public and ships in the app;
 * the key secret and the webhook secret are Cloud Functions secrets, read only
 * inside the functions that need them, and every function that touches one
 * declares it in `PAYMENT_SECRETS` so the runtime actually binds it.
 */

export const RAZORPAY_KEY_ID = defineSecret('RAZORPAY_KEY_ID')
export const RAZORPAY_KEY_SECRET = defineSecret('RAZORPAY_KEY_SECRET')
export const RAZORPAY_WEBHOOK_SECRET = defineSecret('RAZORPAY_WEBHOOK_SECRET')

/** Every function that talks to Razorpay binds all three. */
export const PAYMENT_SECRETS = [
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
]

/**
 * Set by the emulator and by nothing else, which is what makes it safe to
 * branch on. There are no Razorpay credentials locally and no way to complete a
 * real payment against a demo project, so the emulator gets a stand-in that
 * behaves like the real thing — an order id, a signature that verifies — and
 * lets the whole flow be walked end to end.
 *
 * This is the only branch of its kind in the codebase. It cannot fire in
 * production: FUNCTIONS_EMULATOR is not set there, and if a key were missing
 * the call fails loudly instead of quietly pretending to take money.
 */
const isEmulator = (): boolean => process.env.FUNCTIONS_EMULATOR === 'true'

const MOCK_KEY_ID = 'rzp_test_emulator'
const MOCK_SECRET = 'emulator-secret'

function keyId(): string {
  return isEmulator() ? MOCK_KEY_ID : RAZORPAY_KEY_ID.value()
}

function keySecret(): string {
  return isEmulator() ? MOCK_SECRET : RAZORPAY_KEY_SECRET.value()
}

export function publicKeyId(): string {
  return keyId()
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface OrderRequest {
  amountPaise: number
  /** Shown on the Razorpay dashboard — the booking reference. */
  receipt: string
  notes: Record<string, string>
}

export async function createOrder(request: OrderRequest): Promise<{ id: string }> {
  if (isEmulator()) {
    // Deterministic enough to read in a log, unique enough not to collide.
    return { id: `order_emu${Date.now().toString(36)}` }
  }

  const auth = Buffer.from(`${keyId()}:${keySecret()}`).toString('base64')
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: request.amountPaise,
      currency: 'INR',
      receipt: request.receipt,
      notes: request.notes,
    }),
  })

  if (!response.ok) {
    // The body can carry the key id back; it is logged, never returned.
    logger.error('razorpay: order creation failed', {
      status: response.status,
      body: await response.text().catch(() => '<unreadable>'),
    })
    throw new Error(`Razorpay order failed with ${response.status}`)
  }

  const body: unknown = await response.json()
  const id = (body as { id?: unknown }).id
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Razorpay order response had no id')
  }
  return { id }
}

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

/**
 * Put money back against the payment that took it.
 *
 * Refunds go to the original instrument and Razorpay decides the rest; there is
 * no "refund to a different card" and nothing here tries to offer one. The
 * amount is passed in paise, which is what Razorpay expects and what this
 * codebase counts in anyway.
 */
export async function refundPayment(
  paymentId: string,
  amountPaise: number,
  notes: Record<string, string>
): Promise<{ id: string }> {
  if (isEmulator()) {
    return { id: `rfnd_emu${Date.now().toString(36)}` }
  }

  const auth = Buffer.from(`${keyId()}:${keySecret()}`).toString('base64')
  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${paymentId}/refund`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: amountPaise, speed: 'normal', notes }),
    }
  )

  if (!response.ok) {
    logger.error('razorpay: refund failed', {
      status: response.status,
      body: await response.text().catch(() => '<unreadable>'),
    })
    throw new Error(`Razorpay refund failed with ${response.status}`)
  }

  const body: unknown = await response.json()
  const id = (body as { id?: unknown }).id
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Razorpay refund response had no id')
  }
  return { id }
}

// ---------------------------------------------------------------------------
// Signatures
// ---------------------------------------------------------------------------

/**
 * Compare in constant time. A byte-by-byte comparison that returns early leaks
 * how much of a forged signature was right, which is enough to build the rest
 * of it one request at a time.
 */
function signatureMatches(expected: string, received: string): boolean {
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(received, 'utf8')
  // timingSafeEqual throws on a length mismatch, which is itself not secret.
  return a.length === b.length && timingSafeEqual(a, b)
}

/** What Razorpay Checkout hands back: HMAC over `orderId|paymentId`. */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expected = createHmac('sha256', keySecret())
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
  return signatureMatches(expected, signature)
}

/** The signature the emulator's stand-in checkout produces. */
export function mockPaymentSignature(orderId: string, paymentId: string): string {
  return createHmac('sha256', MOCK_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
}

/**
 * The webhook signature is an HMAC over the exact bytes that arrived, which is
 * why the handler reads `rawBody`. Re-serialising the parsed JSON changes key
 * order and whitespace, and the signature stops matching.
 */
export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string
): boolean {
  const secret = isEmulator()
    ? MOCK_SECRET
    : RAZORPAY_WEBHOOK_SECRET.value()
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  return signatureMatches(expected, signature)
}
