'use client'

import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from 'firebase/messaging'
import { firebaseApp, firebaseConfig } from './firebase'

/**
 * Turning on push notifications for this device, and receiving one.
 *
 * The permission prompt is asked for at the moment the customer presses a
 * button that says what it is for, never on first load. A prompt that appears
 * before anyone has a reason to say yes is a prompt that gets a permanent no,
 * and the browser does not offer a second chance.
 *
 * Three pieces have to line up, and this file owns two of them:
 *
 *   - The **VAPID key**, from the Firebase console under Cloud Messaging, Web
 *     Push certificates. It is the one piece that cannot be written here —
 *     without `NEXT_PUBLIC_FIREBASE_VAPID_KEY` the switch in Settings stays
 *     off and says so.
 *   - The **worker**, `public/firebase-messaging-sw.js`, which receives a
 *     message while the app is closed. It is registered here rather than left
 *     to Firebase's default lookup, so the Firebase config can be handed to it
 *     in the query string — a static file cannot read the bundle's env.
 *   - The **sender**, `functions/src/lib/notify.ts`, which is what actually
 *     pushes anything.
 */

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

export const PUSH_IS_CONFIGURED = Boolean(VAPID_KEY)

export type PushOutcome =
  | { kind: 'enabled'; token: string }
  /** The browser said no, and will keep saying no until the user changes it. */
  | { kind: 'denied' }
  | { kind: 'unavailable'; reason: string }

/**
 * Register the messaging worker and hand it the config.
 *
 * None of that config is secret — every value is already in the bundle — and
 * the query string is the only way to get it into a file that is served as-is
 * rather than compiled.
 */
async function messagingWorker(): Promise<ServiceWorkerRegistration> {
  const config = encodeURIComponent(JSON.stringify(firebaseConfig))
  return navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?config=${config}`,
    { scope: '/firebase-cloud-messaging-push-scope' }
  )
}

export async function enablePushNotifications(): Promise<PushOutcome> {
  if (!VAPID_KEY) {
    return {
      kind: 'unavailable',
      reason:
        'Push is not switched on for this build. It needs the Web Push key from the Firebase console.',
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

  try {
    const registration = await messagingWorker()
    const token = await getToken(getMessaging(firebaseApp()), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    return token
      ? { kind: 'enabled', token }
      : {
          kind: 'unavailable',
          reason: 'We could not register this device. Please try again.',
        }
  } catch {
    // A blocked worker, a browser in private mode, an origin without HTTPS.
    // None of them is something the customer can fix from this screen.
    return {
      kind: 'unavailable',
      reason: 'This browser would not register the device. Please try again.',
    }
  }
}

/**
 * A push that arrives while the app is open.
 *
 * The browser does not show a banner for these — the page is in front of the
 * customer, so a system notification on top of it would be the app talking
 * over itself. The caller decides what to do instead, which is usually a
 * toast.
 *
 * Returns a function that stops listening, or a no-op where messaging is not
 * available at all.
 */
export async function onPushWhileOpen(
  handler: (message: { title: string; body: string; href?: string }) => void
): Promise<() => void> {
  if (!VAPID_KEY || !(await isSupported())) return () => {}

  return onMessage(getMessaging(firebaseApp()), (payload) => {
    const title = payload.notification?.title
    const body = payload.notification?.body
    if (!title || !body) return
    handler({
      title,
      body,
      ...(payload.data?.href ? { href: payload.data.href } : {}),
    })
  })
}
