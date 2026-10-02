
import { useSyncExternalStore } from 'react'
import { z } from 'zod'
import {
  applianceIdSchema,
  serviceKeySchema,
  type ApplianceId,
  type ServiceKey,
} from '@app/shared'
import { createLocalStore } from './localStore'
import { kv } from './storage'

/**
 * The services a customer has set aside to book, on this device.
 *
 * It holds which services, never what they cost: the cart screen reads the
 * price from the catalog each time, so a fee changed since the tap is the fee
 * shown. A booking is still one service and one visit, so the cart is a list
 * to book from rather than a single checkout — each item starts its own
 * booking, and leaves the cart once that booking exists.
 *
 * A repair can carry the problem it is for (`issueId`), picked from the
 * service's options. "AC repair — not cooling" and "AC repair — water
 * dripping" are then two items, and the booking for each starts with its
 * problem already chosen.
 */

const STORAGE_KEY = 'customerapp.cart.v1'

export interface CartItem {
  applianceId: ApplianceId
  serviceKey: ServiceKey
  issueId?: string
  /**
   * The kind of machine it is — "front-load", "split" — when the customer
   * said so while adding it. The booking's details step opens with it chosen.
   * Not part of what makes two items the same: one repair is one item.
   */
  applianceType?: string
}

/** A stable empty array — the prerender must not produce a new one each time. */
const NONE: CartItem[] = []

const listSchema = z.array(
  z.object({
    applianceId: applianceIdSchema,
    serviceKey: serviceKeySchema,
    issueId: z.string().min(1).optional(),
    applianceType: z.string().min(1).optional(),
  })
)

function read(): CartItem[] {
  try {
    const raw = kv.getItem(STORAGE_KEY)
    if (!raw) return NONE
    const parsed = listSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : NONE
  } catch {
    return NONE
  }
}

function write(value: CartItem[]): void {

  try {
    if (value.length === 0) kv.removeItem(STORAGE_KEY)
    else kv.setItem(STORAGE_KEY, JSON.stringify(value))
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
  return (
    a.applianceId === b.applianceId &&
    a.serviceKey === b.serviceKey &&
    a.issueId === b.issueId
  )
}

export function inCart(cart: readonly CartItem[], item: CartItem): boolean {
  return cart.some((each) => same(each, item))
}

/** How many items are for this service, whichever problem each is for. */
export function countForService(
  cart: readonly CartItem[],
  service: { applianceId: ApplianceId; serviceKey: ServiceKey }
): number {
  return cart.filter(
    (each) =>
      each.applianceId === service.applianceId &&
      each.serviceKey === service.serviceKey
  ).length
}

/** Added last is listed last, and adding twice is adding once. */
export function addToCart(item: CartItem): void {
  const current = store.getSnapshot().value
  if (inCart(current, item)) return
  store.set([
    ...current,
    {
      applianceId: item.applianceId,
      serviceKey: item.serviceKey,
      ...(item.issueId === undefined ? {} : { issueId: item.issueId }),
      ...(item.applianceType === undefined
        ? {}
        : { applianceType: item.applianceType }),
    },
  ])
}

export function removeFromCart(item: CartItem): void {
  const current = store.getSnapshot().value
  if (!inCart(current, item)) return
  store.set(current.filter((each) => !same(each, item)))
}

/**
 * Takes out what a new booking covers: that service with no problem named,
 * and that service for any of the problems the booking was made for.
 */
export function removeBooked(booked: {
  applianceId: ApplianceId
  serviceKey: ServiceKey
  issueIds: readonly string[]
}): void {
  const current = store.getSnapshot().value
  const next = current.filter(
    (each) =>
      !(
        each.applianceId === booked.applianceId &&
        each.serviceKey === booked.serviceKey &&
        (each.issueId === undefined || booked.issueIds.includes(each.issueId))
      )
  )
  if (next.length !== current.length) store.set(next)
}

/** Takes out a service, whichever problems it was added for. */
export function removeService(service: {
  applianceId: ApplianceId
  serviceKey: ServiceKey
}): void {
  const current = store.getSnapshot().value
  const next = current.filter(
    (each) =>
      !(
        each.applianceId === service.applianceId &&
        each.serviceKey === service.serviceKey
      )
  )
  if (next.length !== current.length) store.set(next)
}
