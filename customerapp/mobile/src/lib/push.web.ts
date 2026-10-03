/**
 * The web preview has no push: the browser build of this app is for looking
 * at screens, and importing expo-notifications there only prints a warning on
 * every load. Same exports as push.ts, always "not available".
 */

export const PUSH_IS_CONFIGURED = false

export type PushOutcome =
  | { kind: 'enabled'; token: string }
  | { kind: 'denied' }
  | { kind: 'unavailable'; reason: string }

export async function enablePushNotifications(): Promise<PushOutcome> {
  return { kind: 'unavailable', reason: 'Push notifications work in the phone app.' }
}

export async function onPushWhileOpen(
  _handler: (message: { title: string; body: string; href?: string }) => void
): Promise<() => void> {
  return () => {}
}
