import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Minus, Plus } from 'lucide-react-native'
import { formatPaise } from '@app/shared'
import type { Service, ServiceVariant } from '@app/shared/catalog-v2'

import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { ConfirmModal } from '@/components/ui/Overlay'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { setQty, useCart, type CartState } from '@/lib/data/cart'
import { cn } from '@/lib/cn'

/**
 * Putting things in the cart, and the controls that do it: the Add button
 * that becomes a − n + stepper, and the bar that says what is in the cart.
 */

interface Pending {
  service: Service
  variant: ServiceVariant | undefined
  qty: number
}

/**
 * The cart, and one way to change it from a screen. A cart holds one
 * category's work at a time; adding from another asks first, in a modal the
 * screen renders (`confirm`).
 */
export function useCartActions(rootId: string | undefined): {
  cart: CartState
  change: (service: Service, variant: ServiceVariant | undefined, qty: number) => void
  confirm: React.ReactNode
} {
  const cart = useCart()
  const [pending, setPending] = useState<Pending | null>(null)

  function change(service: Service, variant: ServiceVariant | undefined, qty: number): void {
    if (!rootId) return
    if (qty > 0 && cart.count > 0 && cart.categoryId && cart.categoryId !== rootId) {
      setPending({ service, variant, qty })
      return
    }
    setQty(service, variant, qty, rootId)
  }

  const confirm = (
    <ConfirmModal
      open={pending !== null}
      onClose={() => setPending(null)}
      onConfirm={() => {
        if (pending && rootId) setQty(pending.service, pending.variant, pending.qty, rootId)
        setPending(null)
      }}
      title="Start a new cart?"
      description="Your cart has services from another category. Adding this one replaces them."
      confirmLabel="Replace cart"
      cancelLabel="Keep my cart"
    />
  )

  return { cart, change, confirm }
}

/**
 * "Add", then − n + once there is one. 44pt tall so it is a comfortable
 * target. `onAdd` is what the first tap does: add one, or open the options
 * sheet for a service that has options.
 */
export function AddControl({
  qty,
  onAdd,
  onIncrease,
  onDecrease,
  label,
  className,
}: {
  qty: number
  onAdd: () => void
  onIncrease: () => void
  onDecrease: () => void
  /** What is being added, for screen readers. */
  label: string
  className?: string
}) {
  if (qty === 0) {
    return (
      <Tappable
        onPress={onAdd}
        accessibilityLabel={`Add ${label}`}
        className={cn(
          'h-11 min-w-[88px] items-center justify-center rounded-card border border-brand bg-bg px-4 active:bg-brand-soft active:opacity-100',
          className
        )}
      >
        <Text className="text-sm font-bold text-brand">Add</Text>
      </Tappable>
    )
  }
  return (
    <View
      className={cn('h-11 min-w-[88px] flex-row items-center justify-between rounded-card border border-brand bg-brand-soft', className)}
    >
      <Tappable onPress={onDecrease} accessibilityLabel={`One less ${label}`} className="h-11 w-9 items-center justify-center">
        <Icon as={Minus} className="size-4 text-brand" />
      </Tappable>
      <Text accessibilityLabel={`${qty} in cart`} className="text-sm font-bold text-brand tabular-nums">
        {qty}
      </Text>
      <Tappable onPress={onIncrease} accessibilityLabel={`One more ${label}`} className="h-11 w-9 items-center justify-center">
        <Icon as={Plus} className="size-4 text-brand" />
      </Tappable>
    </View>
  )
}

/** The bar along the bottom while the cart has something in it. */
export function ViewCartBar({ cart }: { cart: CartState }) {
  const insets = useSafeAreaInsets()
  if (cart.count === 0) return null
  return (
    <View className="border-t border-border bg-bg px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-base font-bold text-ink tabular-nums">{formatPaise(cart.total)}</Text>
          <Text className="text-xs text-muted">{cart.count === 1 ? '1 item' : `${cart.count} items`}</Text>
        </View>
        <Button onPress={() => router.push('/cart')} className="px-6">
          View cart
        </Button>
      </View>
    </View>
  )
}

/** 3200 → "3.2K", for review counts. */
export function compactCount(n: number): string {
  if (n < 1000) return String(n)
  const k = n / 1000
  return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}K`
}
