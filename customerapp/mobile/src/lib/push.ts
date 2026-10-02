import * as Notifications from 'expo-notifications'
import { demoMode } from './firebase'

/**
 * Turning on push notifications for this device, and receiving one.
 *
 * The permission prompt is asked for when the customer presses a button that
 * says what it is for, never on first launch — a prompt nobody has a reason
 * to say yes to gets a permanent no.
 *
 * DECISION NEEDED: delivery needs the real Firebase project's
 * google-services.json (FCM) and an EAS project id for the push token. Until
 * both exist the switch in Settings says push is not set up, rather than
 * asking for a permission it cannot use.
 */

const EAS_PROJECT_ID = process.env.EXPO_PUBLIC_EAS_PROJECT_ID

export const PUSH_IS_CONFIGURED = !demoMode && Boolean(EAS_PROJECT_ID)

export type PushOutcome =
  | { kind: 'enabled'; token: string }
  | { kind: 'denied' }
  | { kind: 'unavailable'; reason: string }

export async function enablePushNotifications(): Promise<PushOutcome> {
  if (!PUSH_IS_CONFIGURED) {
    return {
      kind: 'unavailable',
      reason: 'Push is not switched on for this build yet.',
    }
  }

  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return { kind: 'denied' }

  try {
    const { data } = await Notifications.getDevicePushTokenAsync()
    return { kind: 'enabled', token: String(data) }
  } catch {
    return {
      kind: 'unavailable',
      reason: 'We could not register this phone. Please try again.',
    }
  }
}

/**
 * A push that arrives while the app is open. The caller shows it as a toast
 * rather than a system banner over the screen it is about.
 */
export async function onPushWhileOpen(
  handler: (message: { title: string; body: string; href?: string }) => void
): Promise<() => void> {
  if (!PUSH_IS_CONFIGURED) return () => {}

  const subscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      const { title, body, data } = notification.request.content
      if (!title || !body) return
      const href = typeof data?.href === 'string' ? data.href : undefined
      handler({ title, body, ...(href ? { href } : {}) })
    }
  )
  return () => subscription.remove()
}
