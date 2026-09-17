'use client'

import { useSyncExternalStore } from 'react'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  type ConfirmationResult,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { COL } from '@app/shared'
import { auth, db, usingEmulators } from './firebase'
import { authStore, type AuthSnapshot } from './authStore'

/**
 * Signing in with a phone number.
 *
 * There is no password anywhere in this app and no account to create before
 * booking. A customer gives a number when the flow first needs to store
 * something that belongs to them, and the number is the account.
 *
 * DECISION NEEDED: this is the web path, which uses reCAPTCHA. Inside the
 * Android WebView that check cannot complete, and the build has
 * `@capacitor-firebase/authentication` for exactly that reason — the native
 * plugin does phone verification through Play Integrity instead. Wiring it is
 * Phase 6, alongside the rest of the Capacitor packaging; `startPhoneSignIn`
 * is the one seam it needs to replace.
 */

export function useAuth(): AuthSnapshot {
  return useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getServerSnapshot
  )
}

/**
 * reCAPTCHA needs somewhere in the DOM to live, and Firebase refuses to reuse a
 * verifier once it has been solved. One is made per attempt and cleared after,
 * so a customer who mistypes their number and tries again is not stuck behind a
 * spent widget.
 */
const CONTAINER_ID = 'recaptcha-container'

let verifier: RecaptchaVerifier | null = null

function recaptcha(): RecaptchaVerifier {
  if (verifier) return verifier

  let container = document.getElementById(CONTAINER_ID)
  if (!container) {
    container = document.createElement('div')
    container.id = CONTAINER_ID
    document.body.appendChild(container)
  }

  verifier = new RecaptchaVerifier(auth(), container, {
    // Invisible: the customer sees a phone field and a button, not a puzzle.
    size: 'invisible',
  })
  return verifier
}

function clearRecaptcha(): void {
  verifier?.clear()
  verifier = null
}

/** `9876543210` as typed, `+919876543210` as Firebase wants it. */
export function toE164(tenDigits: string): string {
  return `+91${tenDigits.replace(/\D/g, '').slice(-10)}`
}

export interface PendingVerification {
  confirm: (code: string) => Promise<void>
}

/**
 * Send the code. The returned object is what the OTP screen holds on to —
 * Firebase's confirmation result cannot be serialised, so it never goes into
 * storage or a URL and the OTP screen has to be reached from the phone screen
 * rather than opened directly.
 */
export async function startPhoneSignIn(
  phoneE164: string
): Promise<PendingVerification> {
  try {
    const confirmation: ConfirmationResult = await signInWithPhoneNumber(
      auth(),
      phoneE164,
      recaptcha()
    )
    return {
      confirm: async (code: string) => {
        await confirmation.confirm(code)
        clearRecaptcha()
      },
    }
  } catch (error) {
    // A spent or failed verifier is useless; the next attempt makes a new one.
    clearRecaptcha()
    throw error
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth())
}

/**
 * The name, which the customer gives once after their first sign-in.
 *
 * This is the whole of what the client may write to its own user document.
 * The phone number and the consent record are stamped by the auth trigger,
 * because a client that could write either could write one that is not true.
 */
export async function saveName(
  uid: string,
  name: string,
  email?: string
): Promise<void> {
  await setDoc(
    doc(db(), COL.users, uid),
    {
      name: name.trim(),
      ...(email && email.trim().length > 0 ? { email: email.trim() } : {}),
      updatedAt: Date.now(),
    },
    { merge: true }
  )
}

/**
 * What to put on screen when signing in fails. Firebase's own messages are
 * written for whoever wired the SDK up, not for the person holding the phone.
 */
export function authErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''

  switch (code) {
    case 'auth/invalid-phone-number':
      return 'That does not look like a valid mobile number.'
    case 'auth/invalid-verification-code':
      return 'That code is not right. Check it and try again.'
    case 'auth/code-expired':
      return 'That code has expired. Ask for a new one.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.'
    case 'auth/quota-exceeded':
      return 'We could not send a code just now. Please try again shortly.'
    case 'auth/network-request-failed':
      return 'We could not reach the server. Check your connection.'
    case 'auth/captcha-check-failed':
      return 'We could not verify this device. Please try again.'
    default:
      return 'We could not sign you in just now. Please try again.'
  }
}

/**
 * The emulator prints the code to its own log rather than sending an SMS, so
 * the login screen says so instead of leaving someone waiting for a message
 * that is never coming.
 */
export const OTP_IS_SIMULATED = usingEmulators
