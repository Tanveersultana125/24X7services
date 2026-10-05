import Storage from 'expo-sqlite/kv-store'

/**
 * The device's key-value store, read synchronously.
 *
 * The web app keeps its whole state in localStorage and reads it in one go.
 * AsyncStorage would turn that read into a loading state; expo-sqlite's
 * kv-store answers synchronously, so the store ports across unchanged.
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
