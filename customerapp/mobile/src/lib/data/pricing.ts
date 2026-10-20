import { formatPaise } from '@app/shared'
import type { CartItem, PriceBreakup } from '@app/shared/catalog-v2'

import type { Coupon } from './account'

/**
 * What a cart costs. A pure function of the lines and the coupon, so the
 * cart, the checkout and the booking confirmation can never disagree about a
 * number. The backend prices the booking again for real; this is what the
 * customer is shown before that, and the swap replaces the fee below with the
 * business config.
 */

/** "Taxes and fee", flat per booking. DECISION NEEDED: the real figure comes from the backend's business config. */
export const BOOKING_FEE = 4900

/** Why a coupon cannot be used on this cart, or undefined when it can. */
export function couponProblem(coupon: Coupon, itemsTotal: number, rootCategoryId: string | null): string | undefined {
  if (coupon.categoryIds && (!rootCategoryId || !coupon.categoryIds.includes(rootCategoryId))) {
    return 'This coupon is not for these services.'
  }
  if (itemsTotal < coupon.minOrder) {
    return `Add ${formatPaise(coupon.minOrder - itemsTotal)} more to use this coupon.`
  }
  return undefined
}

/** How much a coupon takes off, capped by the coupon's own maximum and by the items total. */
export function couponDiscount(coupon: Coupon, itemsTotal: number): number {
  const raw =
    coupon.discount.kind === 'flat'
      ? coupon.discount.value
      : Math.round((itemsTotal * coupon.discount.value) / 100)
  const capped = coupon.discount.kind === 'percent' && coupon.discount.maxOff ? Math.min(raw, coupon.discount.maxOff) : raw
  return Math.min(capped, itemsTotal)
}

/** The breakup for these lines and this coupon (ignored when it does not apply). */
export function priceCart(
  items: readonly CartItem[],
  coupon: Coupon | null,
  rootCategoryId: string | null
): PriceBreakup {
  const itemsTotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
  const usable = coupon && !couponProblem(coupon, itemsTotal, rootCategoryId) ? coupon : null
  const discount = usable ? couponDiscount(usable, itemsTotal) : 0
  const fees = items.length ? BOOKING_FEE : 0
  return { items: itemsTotal, discount, fees, taxes: 0, total: itemsTotal - discount + fees }
}
