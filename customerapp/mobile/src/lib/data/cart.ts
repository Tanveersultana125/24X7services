import { useSyncExternalStore } from 'react'
import { cartItemSchema, type CartItem, type Service, type ServiceVariant } from '@app/shared/catalog-v2'
import { z } from 'zod'

import { createLocalStore } from '@/lib/localStore'
import { kv } from '@/lib/storage'

/**
 * The cart for the generic catalog: one line per service and variant, kept on
 * the device so it survives a restart, and never more than one category's
 * worth of work at a time, the way UC keeps one cart per category.
 *
 * The old appliance cart (lib/cart.ts) is separate and untouched; the screens
 * built on catalog-v2 use this one. It is local by design. The backend only
 * sees a cart when it becomes a booking.
 */

const STORAGE_KEY = 'customerapp.cart.v2'

const storedSchema = z.object({
  /** The top-level category the cart belongs to, so a second category starts a new cart. */
  categoryId: z.string().nullable(),
  items: z.array(cartItemSchema),
  /** The coupon applied in the cart, if any. Dropped when the cart changes category. */
  couponCode: z.string().nullable().default(null),
})
type Stored = z.infer<typeof storedSchema>

const EMPTY: Stored = { categoryId: null, items: [], couponCode: null }

const cartStore = createLocalStore<Stored>({
  storageKey: STORAGE_KEY,
  read: () => {
    try {
      const parsed = storedSchema.safeParse(JSON.parse(kv.getItem(STORAGE_KEY) ?? 'null'))
      return parsed.success ? parsed.data : EMPTY
    } catch {
      return EMPTY
    }
  },
  write: (value) => kv.setItem(STORAGE_KEY, JSON.stringify(value)),
  serverValue: EMPTY,
})

const same = (item: CartItem, serviceId: string, variantId: string | undefined) =>
  item.serviceId === serviceId && (item.variantId ?? null) === (variantId ?? null)

/** How many of this service (and variant, if given) are in the cart. */
export function qtyOf(items: readonly CartItem[], serviceId: string, variantId?: string): number {
  return items.find((item) => same(item, serviceId, variantId))?.qty ?? 0
}

/** All of a service in the cart, across its variants. */
export function serviceQty(items: readonly CartItem[], serviceId: string): number {
  return items.filter((item) => item.serviceId === serviceId).reduce((sum, item) => sum + item.qty, 0)
}

/**
 * Sets how many of a service (in one variant) are in the cart; 0 takes it
 * out. `rootCategoryId` is the top-level category: adding from a different
 * one empties the cart first, and the screen asks before it calls this.
 */
export function setQty(
  service: Service,
  variant: ServiceVariant | undefined,
  qty: number,
  rootCategoryId: string
): void {
  const current = cartStore.getSnapshot().value
  const base = current.categoryId && current.categoryId !== rootCategoryId ? EMPTY : current
  const others = base.items.filter((item) => !same(item, service.id, variant?.id))
  const items =
    qty > 0
      ? [...others, { serviceId: service.id, ...(variant ? { variantId: variant.id } : {}), qty, unitPrice: variant?.price ?? service.price }]
      : others
  cartStore.set({
    categoryId: items.length ? rootCategoryId : null,
    items,
    couponCode: items.length ? base.couponCode : null,
  })
}

/** Applies a coupon by code, or removes it with null. Whether it fits is pricing's call (lib/data/pricing). */
export function setCoupon(code: string | null): void {
  cartStore.set({ ...cartStore.getSnapshot().value, couponCode: code })
}

export function clearCart(): void {
  cartStore.set(EMPTY)
}

export interface CartState {
  items: CartItem[]
  categoryId: string | null
  couponCode: string | null
  /** Units across every line. */
  count: number
  /** Sum of unit price × quantity, in paise. */
  total: number
}

export function useCart(): CartState {
  const { value } = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot)
  return {
    items: value.items,
    categoryId: value.categoryId,
    couponCode: value.couponCode,
    count: value.items.reduce((sum, item) => sum + item.qty, 0),
    total: value.items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0),
  }
}
