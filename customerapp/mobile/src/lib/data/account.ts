import type { Address } from '@app/shared/catalog-v2'

import { ADDRESSES, COUPONS, USER, type Coupon, type MockUser } from '@/lib/mock/account'
import { mockRequest } from '@/lib/mock/request'
import { useAsync, type AsyncState } from '@/lib/useAsync'

export type { Coupon }
/** The profile the account screens show. */
export type AccountUser = MockUser

/**
 * The signed-in customer's own things. Same split as lib/data/catalog: async
 * functions the backend swap replaces, and hooks the screens call.
 */

export function fetchUser(): Promise<AccountUser> {
  return mockRequest(USER)
}

/** Saved addresses, the default first. */
export function fetchAddresses(): Promise<Address[]> {
  return mockRequest([...ADDRESSES].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)))
}

/** Offers that have not expired, soonest to expire first. */
export function fetchCoupons(today: string = new Date().toISOString().slice(0, 10)): Promise<Coupon[]> {
  const live = COUPONS.filter((c) => c.expiresAt >= today).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))
  return mockRequest(live)
}

export function useUser(): AsyncState<AccountUser> {
  return useAsync(fetchUser)
}

export function useAddresses(): AsyncState<Address[]> {
  return useAsync(fetchAddresses)
}

export function useCoupons(): AsyncState<Coupon[]> {
  return useAsync(fetchCoupons)
}

/** Saves a new address. The first one saved becomes the default. */
export async function addAddress(input: Omit<Address, 'id' | 'isDefault'>): Promise<Address> {
  const address: Address = { ...input, id: `addr-${Date.now()}`, isDefault: ADDRESSES.length === 0 }
  await mockRequest(undefined)
  ADDRESSES.push(address)
  return address
}
