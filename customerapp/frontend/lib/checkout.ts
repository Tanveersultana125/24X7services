'use client'

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

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`
    )
    if (existing) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      // Allow a retry: a failed load is usually the network, not the script.
      scriptPromise = null
      reject(new Error('Could not load the payment window'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

interface RazorpayConstructor {
  new (options: Record<string, unknown>): { open: () => void }
}

export async function openCheckout(
  request: CheckoutRequest
): Promise<CheckoutResult> {
  if (usingEmulators) return emulatorCheckout(request)

  await loadScript()
  const Razorpay = (window as unknown as { Razorpay?: RazorpayConstructor })
    .Razorpay
  if (!Razorpay) throw new Error('The payment window is unavailable')

  return new Promise<CheckoutResult>((resolve, reject) => {
    const checkout = new Razorpay({
      key: request.keyId,
      order_id: request.orderId,
      amount: request.amountPaise,
      currency: 'INR',
      name: '24X7',
      description: request.description,
      prefill: {
        name: request.customerName,
        contact: request.customerPhone,
      },
      // Razorpay's own retry UI would resolve neither handler nor ondismiss,
      // leaving this promise unsettled and the screen spinning.
      retry: { enabled: false },
      handler: (response: {
        razorpay_order_id: string
        razorpay_payment_id: string
        razorpay_signature: string
      }) => {
        resolve({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        })
      },
      modal: {
        ondismiss: () => reject(new CheckoutDismissed()),
      },
    })
    checkout.open()
  })
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
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  )
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export const CHECKOUT_IS_SIMULATED = usingEmulators
