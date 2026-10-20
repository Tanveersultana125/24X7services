import { useSyncExternalStore } from 'react'

import { createLocalStore } from './localStore'
import { kv } from './storage'

/**
 * Whether this device has seen the onboarding slides. Shown once, on the first
 * launch; after that the app opens straight past them.
 */

const STORAGE_KEY = 'customerapp.onboarded.v1'

const onboardedStore = createLocalStore<boolean>({
  storageKey: STORAGE_KEY,
  read: () => kv.getItem(STORAGE_KEY) === '1',
  write: (value) => (value ? kv.setItem(STORAGE_KEY, '1') : kv.removeItem(STORAGE_KEY)),
  serverValue: false,
})

export function useOnboarded(): { onboarded: boolean; finish: () => void } {
  const { value } = useSyncExternalStore(
    onboardedStore.subscribe,
    onboardedStore.getSnapshot,
    onboardedStore.getServerSnapshot
  )
  return { onboarded: value, finish: () => onboardedStore.set(true) }
}
