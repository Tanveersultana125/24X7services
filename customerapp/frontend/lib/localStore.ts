'use client'

/**
 * A value that lives in localStorage, exposed the way React wants an external
 * store to be exposed.
 *
 * Reading localStorage in an effect and calling setState with what comes back
 * is the obvious way to do this and the wrong one: it renders once with the
 * wrong answer, then again with the right one, and every consumer has to cope
 * with the gap. `useSyncExternalStore` exists for exactly this — the snapshot
 * is read during render on the client, and the server snapshot is what the
 * prerendered HTML contains, so hydration matches by construction.
 *
 * The snapshot carries `ready` because "nothing is saved" and "storage has not
 * been read yet" are different answers, and at least one screen — the splash —
 * has to tell them apart before it decides where to send someone.
 */

export interface Snapshot<T> {
  value: T
  /** False only in the prerendered HTML and during hydration. */
  ready: boolean
}

export interface LocalStore<T> {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => Snapshot<T>
  getServerSnapshot: () => Snapshot<T>
  set: (value: T) => void
}

export function createLocalStore<T>(options: {
  /** The storage key, watched for changes made in another tab. */
  storageKey: string
  read: () => T
  write: (value: T) => void
  /** What the prerender renders. Must be a stable reference. */
  serverValue: T
}): LocalStore<T> {
  const serverSnapshot: Snapshot<T> = {
    value: options.serverValue,
    ready: false,
  }

  // Held so repeated getSnapshot calls return the same object. React compares
  // snapshots by identity, and a fresh object each time is an infinite loop.
  let snapshot: Snapshot<T> | null = null
  const listeners = new Set<() => void>()
  let watching = false

  function emit(): void {
    for (const listener of listeners) listener()
  }

  function onStorage(event: StorageEvent): void {
    // A null key means the whole origin was cleared.
    if (event.key !== null && event.key !== options.storageKey) return
    snapshot = null
    emit()
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      if (!watching && typeof window !== 'undefined') {
        window.addEventListener('storage', onStorage)
        watching = true
      }
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0 && watching && typeof window !== 'undefined') {
          window.removeEventListener('storage', onStorage)
          watching = false
        }
      }
    },

    getSnapshot() {
      if (!snapshot) snapshot = { value: options.read(), ready: true }
      return snapshot
    },

    getServerSnapshot() {
      return serverSnapshot
    },

    set(value) {
      options.write(value)
      snapshot = { value, ready: true }
      emit()
    },
  }
}
