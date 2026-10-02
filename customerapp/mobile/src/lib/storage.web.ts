/**
 * The web build (used for previews) keeps the same keys in localStorage.
 * See storage.ts for the native store.
 */
export const kv = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Storage blocked or full; the value still holds for this session.
    }
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // As above.
    }
  },
}

/** On the web, Firebase Auth keeps its own session in IndexedDB. */
export const asyncKv = undefined
