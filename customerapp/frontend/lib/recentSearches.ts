'use client'

import { useSyncExternalStore } from 'react'
import { z } from 'zod'
import { createLocalStore } from './localStore'

/**
 * The last few things this person searched for, on this device.
 *
 * Kept here rather than on the account: a search history is a record of what
 * has gone wrong in someone's house, and there is no reason for it to leave the
 * phone it was typed on.
 */

const STORAGE_KEY = 'customerapp.recentSearches.v1'
const LIMIT = 6

/** A stable empty array — the prerender must not produce a new one each time. */
const NONE: string[] = []

const listSchema = z.array(z.string().min(1).max(60))

function read(): string[] {
  if (typeof window === 'undefined') return NONE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return NONE
    const parsed = listSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data.slice(0, LIMIT) : NONE
  } catch {
    return NONE
  }
}

function write(value: string[]): void {
  if (typeof window === 'undefined') return
  try {
    if (value.length === 0) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Not worth telling anyone about.
  }
}

const store = createLocalStore<string[]>({
  storageKey: STORAGE_KEY,
  read,
  write,
  serverValue: NONE,
})

export function useRecentSearches(): string[] {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  ).value
}

/** Newest first, no duplicates, case-insensitively. */
export function rememberSearch(term: string): void {
  const trimmed = term.trim()
  if (trimmed.length === 0) return

  const current = store.getSnapshot().value
  store.set(
    [
      trimmed,
      ...current.filter((t) => t.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, LIMIT)
  )
}

export function forgetSearches(): void {
  store.set(NONE)
}
