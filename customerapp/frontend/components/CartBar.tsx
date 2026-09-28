'use client'

import Link from 'next/link'
import type { CatalogService } from '@app/shared'
import { StickyCTA, StickySpacer } from '@/components/StickyCTA'
import { useCart } from '@/lib/cart'

/**
 * "2 items added — View cart", pinned above the bottom nav once anything is in
 * the cart, so a customer adding from a list always sees the tap landed.
 *
 * The line under the count names the last thing added. The catalog is the
 * screen's to load; the bar is handed it, and names nothing until it arrives.
 */
export function CartBar({
  services,
}: {
  services: readonly CatalogService[]
}) {
  const cart = useCart()
  if (cart.length === 0) return null

  const last = cart[cart.length - 1]
  const lastName = services.find(
    (service) =>
      service.applianceId === last?.applianceId &&
      service.serviceKey === last?.serviceKey
  )?.name

  return (
    <>
      <StickySpacer aboveBottomNav />
      <StickyCTA
        aboveBottomNav
        detail={
          <p aria-live="polite">
            <span className="block text-base font-semibold text-ink">
              {cart.length} {cart.length === 1 ? 'item' : 'items'} added
            </span>
            {lastName ? (
              <span className="block truncate text-sm text-muted">
                {lastName}
              </span>
            ) : null}
          </p>
        }
      >
        <Link
          href="/cart"
          className="inline-flex h-12 items-center justify-center rounded-card border border-brand bg-brand px-8 text-base font-semibold text-bg hover:bg-brand-deep"
        >
          View cart
        </Link>
      </StickyCTA>
    </>
  )
}
