'use client'

import { useSyncExternalStore } from 'react'
import { z } from 'zod'
import {
  applianceIdSchema,
  serviceKeySchema,
  type ApplianceId,
  type ServiceKey,
} from '@app/shared'
import { createLocalStore } from './localStore'

/**
 * The services a customer has set aside to book, on this device.
 *
 * It holds which services, never what they cost: the cart screen reads the
 * price from the catalog each time, so a fee changed since the tap is the fee
 * shown. A booking is still one service and one visit, so the cart is a list
 * to book from rather than a single checkout — each item starts its own
 * booking, and leaves the cart once that booking exists.
 */

const STORAGE_KEY = 'customerapp.cart.v1'

export interface CartItem {
  applianceId: ApplianceId
  serviceKey: ServiceKey
}

/** A stable empty array — the prerender must not produce a new one each time. */
const NONE: CartItem[] = []

const listSchema = z.array(
  z.object({ applianceId: applianceIdSchema, serviceKey: serviceKeySchema })
)

function read(): CartItem[] {
  if (typeof window === 'undefined') return NONE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return NONE
    const parsed = listSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : NONE
  } catch {
    return NONE
  }
}

function write(value: CartItem[]): void {
  if (typeof window === 'undefined') return
  try {
    if (value.length === 0) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Storage blocked or full. The cart still holds for this session.
  }
}

const store = createLocalStore<CartItem[]>({
  storageKey: STORAGE_KEY,
  read,
  write,
  serverValue: NONE,
})

export function useCart(): CartItem[] {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  ).value
}

function same(a: CartItem, b: CartItem): boolean {
  return a.applianceId === b.applianceId && a.serviceKey === b.serviceKey
}

export function inCart(cart: readonly CartItem[], item: CartItem): boolean {
  return cart.some((each) => same(each, item))
}

/** Added last is listed last, and adding twice is adding once. */
export function addToCart(item: CartItem): void {
  const current = store.getSnapshot().value
  if (inCart(current, item)) return
  store.set([
    ...current,
    { applianceId: item.applianceId, serviceKey: item.serviceKey },
  ])
}

export function removeFromCart(item: CartItem): void {
  const current = store.getSnapshot().value
  if (!inCart(current, item)) return
  store.set(current.filter((each) => !same(each, item)))
}
