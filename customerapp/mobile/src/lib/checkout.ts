
import { usingEmulators } from './firebase'

/**
 * Razorpay Checkout, and the stand-in the emulator uses instead.
 *
 * Checkout is a hosted script that draws its own modal. Nothing in this app
 * ever touches a card number, a UPI id or a bank page — the sheet belongs to
 * Razorpay, and what comes back is three strings we hand to the server to
 * verify. That is the whole reason to use it this way rather than collecting
 * anything ourselves.
 */

export interface CheckoutRequest {
  keyId: string
  orderId: string
  amountPaise: number
  /** The booking reference, shown in the sheet and on the customer's statement. */
  description: string
  customerName?: string
  customerPhone?: string
}

export interface CheckoutResult {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

export class CheckoutDismissed extends Error {
  constructor() {
    super('Payment was cancelled')
    this.name = 'CheckoutDismissed'
  }
}

/**
 * DECISION NEEDED: the app opens Razorpay through `react-native-razorpay`
 * (native SDK, needs a development build) once a Razorpay key exists. Until
 * then only the emulator's stand-in can complete a payment — and the demo
 * build never gets this far, because creating the order is switched off.
 */
export async function openCheckout(
  request: CheckoutRequest
): Promise<CheckoutResult> {
  if (usingEmulators) return emulatorCheckout(request)
  throw new Error('Payments are not switched on in the app yet')
}

// ---------------------------------------------------------------------------
// The emulator stand-in
// ---------------------------------------------------------------------------

/**
 * There is no Razorpay account behind a demo project and no way to complete a
 * real payment against one, so locally the signature is produced here with the
 * same throwaway secret the emulator's functions verify against. It is not a
 * secret in any sense — it exists so the whole flow, including verification,
 * can be walked end to end without an account.
 *
 * `usingEmulators` is compiled from NEXT_PUBLIC_USE_EMULATORS, which is false
 * in every real build, so this cannot run in one. The server has the same guard
 * from the other side: it only accepts this secret when FUNCTIONS_EMULATOR is
 * set, which nothing but the emulator sets.
 */
const EMULATOR_SECRET = 'emulator-secret'

async function emulatorCheckout(
  request: CheckoutRequest
): Promise<CheckoutResult> {
  const paymentId = `pay_emu${Date.now().toString(36)}`
  const signature = await hmacSha256Hex(
    EMULATOR_SECRET,
    `${request.orderId}|${paymentId}`
  )
  return {
    razorpayOrderId: request.orderId,
    razorpayPaymentId: paymentId,
    razorpaySignature: signature,
  }
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const { hmacSha256 } = await import('./hmac')
  return hmacSha256(secret, message)
}

export const CHECKOUT_IS_SIMULATED = usingEmulators
