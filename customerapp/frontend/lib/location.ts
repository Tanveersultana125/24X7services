'use client'

import { z } from 'zod'
import { pincodeSchema } from '@app/shared'
import { createLocalStore } from './localStore'

/**
 * Where the customer wants the work done, as far as the app knows before there
 * is an account or an address book.
 *
 * It is a pincode, not a point. Serviceability, slot capacity and the technician
 * roster are all organised by pincode, and a latitude that resolves to the next
 * street over would put someone in an area we do not cover — or keep them out
 * of one we do.
 */

export const savedLocationSchema = z.object({
  pincode: pincodeSchema,
  city: z.string().min(1),
  area: z.string().min(1),
  /** False when we answered "not yet" — Home says so rather than hiding it. */
  serviceable: z.boolean(),
  /** When the answer was last checked, so a stale one can be re-asked. */
  checkedAt: z.number().int().min(0),
})
export type SavedLocation = z.infer<typeof savedLocationSchema>

/** Versioned, so a changed shape is ignored rather than half-read. */
const STORAGE_KEY = 'customerapp.location.v1'

/** Past this, Home re-checks in the background: areas get switched on and off. */
export const LOCATION_STALE_MS = 24 * 60 * 60 * 1000

function read(): SavedLocation | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = savedLocationSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    // Private browsing, a cleared origin, a half-written value: none of these
    // are worth an error on screen. The customer is asked for a pincode again.
    return null
  }
}

function write(value: SavedLocation | null): void {
  if (typeof window === 'undefined') return
  try {
    if (value === null) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Storage full or blocked. The location still holds for this session.
  }
}

export const locationStore = createLocalStore<SavedLocation | null>({
  storageKey: STORAGE_KEY,
  read,
  write,
  serverValue: null,
})

/** "Kondapur, Hyderabad" — the line under the pin on Home. */
export function locationLabel(location: SavedLocation): string {
  return `${location.area}, ${location.city}`
}
