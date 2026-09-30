'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { cn } from '@/lib/cn'

/**
 * The cart, as a tile in the header, with how many items are in it.
 *
 * Always there, empty or not, so the way to the cart is in the same place on
 * every screen that lists services — CartBar only appears once something has
 * been added, and a customer looking for what they added yesterday should not
 * have to add something first. The count is a badge on the corner, and is
 * left off at zero rather than showing a "0" that reads as an alert.
 */
export function CartButton({ className }: { className?: string }) {
  const cart = useCart()
  const count = cart.length

  return (
    <Link
      href="/cart"
      aria-label={
        count === 0
          ? 'Cart, empty'
          : `Cart, ${count} ${count === 1 ? 'item' : 'items'}`
      }
      className={cn(
        'relative flex size-12 shrink-0 items-center justify-center rounded-card border border-border bg-bg text-ink hover:border-brand hover:text-brand',
        className
      )}
    >
      <ShoppingCart className="size-5" aria-hidden="true" />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-pill bg-brand px-1 text-[11px] font-bold leading-none text-white ring-2 ring-bg"
        >
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </Link>
  )
}
