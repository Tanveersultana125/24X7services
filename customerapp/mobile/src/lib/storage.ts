import Storage from 'expo-sqlite/kv-store'

/**
 * The device's key-value store, read synchronously.
 *
 * The web app keeps the saved location, the cart, the booking draft and the
 * recent searches in localStorage and reads them during render. AsyncStorage
 * would turn every one of those reads into a loading state; expo-sqlite's
 * kv-store answers synchronously, so the stores port across unchanged.
 */
export const kv = {
  getItem(key: string): string | null {
    return Storage.getItemSync(key)
  },
  setItem(key: string, value: string): void {
    Storage.setItemSync(key, value)
  },
  removeItem(key: string): void {
    Storage.removeItemSync(key)
  },
}

/** The async face of the same store, for Firebase Auth's session. */
export const asyncKv = Storage
