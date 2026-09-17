'use client'

import { useSyncExternalStore } from 'react'

/**
 * Whether the device thinks it has a network.
 *
 * `navigator.onLine` is an external store with its own events, so it is read as
 * one rather than copied into state by an effect — the same shape the saved
 * location and the auth session use.
 *
 * The server snapshot is `true`. A prerendered page cannot know, and starting
 * from "offline" would flash an offline banner on every first paint for
 * everyone who is not.
 *
 * It is a weak signal and is treated as one: `onLine` only means an interface
 * is up, not that anything is reachable. Nothing in this app blocks on it —
 * requests are still attempted, and this decides what is said while they run.
 */

function subscribe(listener: () => void): () => void {
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)
  return () => {
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  )
}
