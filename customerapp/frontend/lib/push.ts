'use client'

import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { firebaseApp } from './firebase'

/**
 * Turning on push notifications for this device.
 *
 * The permission prompt is asked for at the moment the customer presses a
 * button that says what it is for, never on first load. A prompt that appears
 * before anyone has a reason to say yes is a prompt that gets a permanent no,
 * and the browser does not offer a second chance.
 *
 * DECISION NEEDED: NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set, so this is off.
 * It needs the Web Push certificate key pair from the Firebase console, and a
 * `public/firebase-messaging-sw.js` service worker to receive a message while
 * the app is closed — both of which belong with the PWA work in Phase 6. The
 * `registerFcmToken` callable behind it is finished and waiting.
 */

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

export const PUSH_IS_CONFIGURED = Boolean(VAPID_KEY)

export type PushOutcome =
  | { kind: 'enabled'; token: string }
  /** The browser said no, and will keep saying no until the user changes it. */
  | { kind: 'denied' }
  | { kind: 'unavailable'; reason: string }

export async function enablePushNotifications(): Promise<PushOutcome> {
  if (!VAPID_KEY) {
    return {
      kind: 'unavailable',
      reason: 'Push is not set up on this build yet.',
    }
  }

  if (!(await isSupported())) {
    return {
      kind: 'unavailable',
      reason: 'This browser cannot receive push notifications.',
    }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { kind: 'denied' }

  const token = await getToken(getMessaging(firebaseApp()), {
    vapidKey: VAPID_KEY,
  })

  return token
    ? { kind: 'enabled', token }
    : {
        kind: 'unavailable',
        reason: 'We could not register this device. Please try again.',
      }
}
