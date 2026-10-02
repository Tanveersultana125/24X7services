/**
 * A value that lives in the device store (lib/storage.ts), exposed the way
 * React wants an external store to be exposed: `useSyncExternalStore`, a
 * snapshot read during render, and one emit for every write.
 *
 * The snapshot carries `ready` for parity with the web app, where it is false
 * during hydration. Here the store is read synchronously, so it is always true
 * — but screens written against the web shape keep working.
 */

export interface Snapshot<T> {
  value: T
  ready: boolean
}

export interface LocalStore<T> {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => Snapshot<T>
  getServerSnapshot: () => Snapshot<T>
  set: (value: T) => void
}

export function createLocalStore<T>(options: {
  /** The storage key. Kept for parity with the web store. */
  storageKey: string
  read: () => T
  write: (value: T) => void
  serverValue: T
}): LocalStore<T> {
  // Held so repeated getSnapshot calls return the same object. React compares
  // snapshots by identity, and a fresh object each time is an infinite loop.
  let snapshot: Snapshot<T> | null = null
  const listeners = new Set<() => void>()

  function getSnapshot(): Snapshot<T> {
    if (!snapshot) snapshot = { value: options.read(), ready: true }
    return snapshot
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot,
    getServerSnapshot: getSnapshot,
    set(value) {
      options.write(value)
      snapshot = { value, ready: true }
      for (const listener of listeners) listener()
    },
  }
}
