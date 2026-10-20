import { useSyncExternalStore } from 'react'
import type { Address } from '@app/shared/catalog-v2'

import { authStore, type AuthUser } from '@/lib/authStore'
import { createLocalStore } from '@/lib/localStore'
import { ADDRESSES } from '@/lib/mock/account'
import { MY_REVIEWS, PLUS_PLANS, REFERRAL, WALLET, type MyReview, type PlusPlan, type WalletEntry } from '@/lib/mock/money'
import { mockRequest } from '@/lib/mock/request'
import { kv } from '@/lib/storage'
import { useAsync, type AsyncState } from '@/lib/useAsync'

/**
 * Everything the Account screens read and change: the profile, addresses,
 * wallet, Plus, referral, reviews and notification settings. Async functions
 * the backend swap replaces, and hooks over them, as in lib/data/catalog.
 */

export type { MyReview, PlusPlan, WalletEntry }

// --- Profile ---------------------------------------------------------------

/** The mobile number the professional calls on. Optional; sign-in does not use it. */
const PHONE_KEY = 'customerapp.contactPhone.v1'

export function fetchContactPhone(): Promise<string> {
  return mockRequest(kv.getItem(PHONE_KEY) ?? '')
}

export function useContactPhone(): AsyncState<string> {
  return useAsync(fetchContactPhone)
}

/** Saves the name (on the session) and the contact number. */
export async function updateProfile(user: AuthUser, input: { name: string; phone: string }): Promise<void> {
  await mockRequest(undefined)
  if (input.phone) kv.setItem(PHONE_KEY, input.phone)
  else kv.removeItem(PHONE_KEY)
  authStore.setMockUser({ ...user, displayName: input.name.trim() })
}

// --- Addresses -------------------------------------------------------------

export async function updateAddress(address: Address): Promise<void> {
  await mockRequest(undefined)
  const index = ADDRESSES.findIndex((a) => a.id === address.id)
  if (index >= 0) ADDRESSES[index] = address
}

export async function deleteAddress(id: string): Promise<void> {
  await mockRequest(undefined)
  const index = ADDRESSES.findIndex((a) => a.id === id)
  if (index < 0) return
  const [removed] = ADDRESSES.splice(index, 1)
  // The default moves to the next address rather than disappearing.
  if (removed?.isDefault && ADDRESSES[0]) ADDRESSES[0].isDefault = true
}

export async function setDefaultAddress(id: string): Promise<void> {
  await mockRequest(undefined)
  for (const address of ADDRESSES) address.isDefault = address.id === id
}

// --- Wallet ----------------------------------------------------------------

export interface Wallet {
  balance: number
  entries: WalletEntry[]
}

export function fetchWallet(): Promise<Wallet> {
  return mockRequest({ balance: WALLET.balance, entries: [...WALLET.entries].sort((a, b) => b.at.localeCompare(a.at)) })
}

export function useWallet(): AsyncState<Wallet> {
  return useAsync(fetchWallet)
}

// --- Plus ------------------------------------------------------------------

const PLUS_KEY = 'customerapp.plus.v1'

/** The plan the customer holds, and until when, or null. */
export interface Membership {
  planId: string
  /** ISO date. */
  until: string
}

export function fetchPlus(): Promise<{ plans: PlusPlan[]; membership: Membership | null }> {
  let membership: Membership | null = null
  try {
    membership = JSON.parse(kv.getItem(PLUS_KEY) ?? 'null') as Membership | null
  } catch {
    membership = null
  }
  return mockRequest({ plans: PLUS_PLANS, membership })
}

export function usePlus(): AsyncState<{ plans: PlusPlan[]; membership: Membership | null }> {
  return useAsync(fetchPlus)
}

/** Buys a plan. Razorpay in real life; here it always goes through. */
export async function buyPlus(plan: PlusPlan): Promise<Membership> {
  await mockRequest(undefined)
  const until = new Date(Date.now() + plan.days * 86_400_000).toISOString().slice(0, 10)
  const membership = { planId: plan.id, until }
  kv.setItem(PLUS_KEY, JSON.stringify(membership))
  return membership
}

// --- Referral --------------------------------------------------------------

export type Referral = typeof REFERRAL

export function fetchReferral(): Promise<Referral> {
  return mockRequest(REFERRAL)
}

export function useReferral(): AsyncState<Referral> {
  return useAsync(fetchReferral)
}

// --- Reviews ---------------------------------------------------------------

export function fetchMyReviews(): Promise<MyReview[]> {
  return mockRequest([...MY_REVIEWS].sort((a, b) => b.at.localeCompare(a.at)))
}

export function useMyReviews(): AsyncState<MyReview[]> {
  return useAsync(fetchMyReviews)
}

// --- Notification settings -------------------------------------------------

export interface NotificationPrefs {
  bookingUpdates: boolean
  offers: boolean
  reminders: boolean
  whatsapp: boolean
}

const PREFS_KEY = 'customerapp.notificationPrefs.v1'
const DEFAULT_PREFS: NotificationPrefs = { bookingUpdates: true, offers: false, reminders: true, whatsapp: true }

const prefsStore = createLocalStore<NotificationPrefs>({
  storageKey: PREFS_KEY,
  read: () => {
    try {
      return { ...DEFAULT_PREFS, ...(JSON.parse(kv.getItem(PREFS_KEY) ?? '{}') as Partial<NotificationPrefs>) }
    } catch {
      return DEFAULT_PREFS
    }
  },
  write: (value) => kv.setItem(PREFS_KEY, JSON.stringify(value)),
  serverValue: DEFAULT_PREFS,
})

export function useNotificationPrefs(): [NotificationPrefs, (change: Partial<NotificationPrefs>) => void] {
  const { value } = useSyncExternalStore(prefsStore.subscribe, prefsStore.getSnapshot, prefsStore.getServerSnapshot)
  return [value, (change) => prefsStore.set({ ...value, ...change })]
}

// --- Leaving ---------------------------------------------------------------

/**
 * Deletes the account. The backend removes the user and their data; the mock
 * forgets everything this device holds about them and ends the session.
 */
export async function deleteAccount(reason: string): Promise<void> {
  await mockRequest(reason)
  for (const key of [PHONE_KEY, PLUS_KEY, PREFS_KEY, 'customerapp.cart.v2', 'customerapp.checkout.v1']) kv.removeItem(key)
  authStore.setMockUser(null)
}
