import type { ImageSource } from 'expo-image'
import { PUBLIC_ASSETS } from './publicAssets.generated'

/**
 * A picture named the way the catalog names it — a web path such as
 * '/photos/geyser/1.jpg' — as something an <Image> can show.
 *
 * Paths under frontend/public are bundled into the app (scripts/sync-public.mjs
 * writes the map), so they load offline. A full URL passes through as a remote
 * source. Anything else returns undefined and the caller shows its fallback.
 */
export function publicAsset(path: string | null | undefined): ImageSource | number | undefined {
  if (!path) return undefined
  if (/^https?:\/\//.test(path)) return { uri: path }
  const clean = path.split(/[?#]/)[0]
  const key = clean.startsWith('/') ? clean : `/${clean}`
  return PUBLIC_ASSETS[key]
}

/** True when the path names a picture the app actually carries. */
export function hasPublicAsset(path: string | null | undefined): boolean {
  return publicAsset(path) !== undefined
}
