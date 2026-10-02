import { useSyncExternalStore } from 'react'
import NetInfo from '@react-native-community/netinfo'

/**
 * Whether the device thinks it has a network.
 *
 * A weak signal, treated as one: nothing blocks on it, it only decides what is
 * said while a request runs. It starts as `true` so the offline banner never
 * flashes on launch before NetInfo has answered.
 */

let online = true
const listeners = new Set<() => void>()
let watching: (() => void) | null = null

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  watching ??= NetInfo.addEventListener((state) => {
    // `isInternetReachable` is null until it has been checked.
    const next = state.isConnected !== false && state.isInternetReachable !== false
    if (next === online) return
    online = next
    for (const each of listeners) each()
  })
  return () => {
    listeners.delete(listener)
  }
}

export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, () => online, () => true)
}
