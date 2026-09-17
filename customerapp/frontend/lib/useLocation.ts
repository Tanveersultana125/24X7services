'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { locationStore, type SavedLocation } from './location'

/**
 * The chosen location, shared by every screen that shows or depends on it.
 *
 * There is no provider. The value lives in localStorage, which is already a
 * single source of truth outside React, and wrapping it in context would only
 * add a second one that has to be kept in step with it — including across two
 * tabs of the same app, which the store handles and a provider would not.
 */

export interface LocationState {
  location: SavedLocation | null
  /** False until storage has been read; see the note in localStore. */
  ready: boolean
  setLocation: (location: SavedLocation) => void
  clear: () => void
}

export function useLocation(): LocationState {
  const snapshot = useSyncExternalStore(
    locationStore.subscribe,
    locationStore.getSnapshot,
    locationStore.getServerSnapshot
  )

  const setLocation = useCallback((next: SavedLocation) => {
    locationStore.set(next)
  }, [])

  const clear = useCallback(() => {
    locationStore.set(null)
  }, [])

  return useMemo(
    () => ({
      location: snapshot.value,
      ready: snapshot.ready,
      setLocation,
      clear,
    }),
    [snapshot, setLocation, clear]
  )
}
