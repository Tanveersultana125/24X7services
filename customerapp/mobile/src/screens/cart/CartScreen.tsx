import { useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ChevronRight, ShoppingCart, TicketPercent, X } from 'lucide-react-native'
import { formatPaise } from '@app/shared'
import type { CartItem, Service } from '@app/shared/catalog-v2'

import { Header, Screen } from '@/components/Screen'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useAuth } from '@/lib/auth'
import { useCoupons } from '@/lib/data/account'
import { setCoupon, setQty, useCart } from '@/lib/data/cart'
import { useCategory, useServicesByIds } from '@/lib/data/catalog'
import { couponDiscount, priceCart } from '@/lib/data/pricing'
import { cn } from '@/lib/cn'
import { AddControl } from '@/screens/catalog/cartActions'
import { CouponSheet } from './CouponSheet'
import { PriceBreakup } from './PriceBreakup'

/**
 * The cart: what is in it, how many of each, a coupon, the bill, and one
 * button on to booking. Quantities change in place; taking the last one out
 * empties the cart and the screen says so, with a way back to the services.
 */
export function CartScreen() {
  const cart = useCart()
  const { user } = useAuth()
  const toast = useToast()
  const services = useServicesByIds(cart.items.map((item) => item.serviceId))
  const category = useCategory(cart.categoryId ?? '')
  const coupons = useCoupons()
  const [couponsOpen, setCouponsOpen] = useState(false)

  const coupon = coupons.data?.find((c) => c.code === cart.couponCode) ?? null
  const price = priceCart(cart.items, coupon, cart.categoryId)

  function proceed(): void {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent('/cart')}`)
      return
    }
    // The booking steps (questions, address, slot, checkout) are PR-8.
    toast.show('Next: the booking steps, coming in the next update.')
  }

  const empty = cart.items.length === 0

  return (
    <Screen
      header={<Header title="Your cart" showBack backFallback="/home" />}
      footer={empty ? null : <ProceedBar total={price.total} onProceed={proceed} signedIn={Boolean(user)} />}
    >
      {empty ? (
        <EmptyState
          className="mt-12"
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Add a service and it will wait for you here."
          action={{ label: 'Explore services', href: '/services' }}
        />
      ) : services.status === 'loading' ? (
        <SkeletonGroup label="Loading your cart" className="mt-4 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-40" />
        </SkeletonGroup>
      ) : services.status === 'error' ? (
        <ErrorState className="mt-12" onRetry={services.reload} retrying={services.refreshing} />
      ) : (
        <View className="pt-2">
          {category.data ? <Text className="text-sm font-semibold text-muted">{category.data.name}</Text> : null}

          <View className="mt-2 rounded-card border border-border px-4">
            {cart.items.map((item, index) => (
              <CartLine
                key={`${item.serviceId}:${item.variantId ?? ''}`}
                item={item}
                service={services.data?.find((s) => s.id === item.serviceId)}
                rootId={cart.categoryId}
                last={index === cart.items.length - 1}
              />
            ))}
          </View>

          <Tappable
            onPress={() => (coupon ? undefined : setCouponsOpen(true))}
            className="mt-4 min-h-14 flex-row items-center gap-3 rounded-card border border-border px-4 active:bg-surface active:opacity-100"
          >
            <Icon as={TicketPercent} className="size-5 text-brand" />
            {coupon ? (
              <>
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-ink">{`${coupon.code} applied`}</Text>
                  <Text className="text-xs text-success">{`You save ${formatPaise(couponDiscount(coupon, price.items))}`}</Text>
                </View>
                <Tappable onPress={() => setCoupon(null)} accessibilityLabel="Remove coupon" className="size-11 items-center justify-center">
                  <Icon as={X} className="size-4 text-muted" />
                </Tappable>
              </>
            ) : (
              <>
                <Text className="flex-1 text-sm font-semibold text-ink">Coupons and offers</Text>
                <Icon as={ChevronRight} className="size-4 text-muted" />
              </>
            )}
          </Tappable>

          <PriceBreakup price={price} couponCode={coupon?.code} className="mt-4" />

          <Tappable href="/legal/cancellation" className="mt-4 min-h-11 justify-center">
            <Text className="text-xs text-muted">
              Free cancellation until the professional is assigned.{' '}
              <Text className="text-xs font-semibold text-brand">Cancellation policy</Text>
            </Text>
          </Tappable>
        </View>
      )}

      <CouponSheet
        open={couponsOpen}
        onClose={() => setCouponsOpen(false)}
        itemsTotal={price.items}
        rootCategoryId={cart.categoryId}
        onApply={(chosen) => {
          setCoupon(chosen.code)
          setCouponsOpen(false)
          toast.show(`${chosen.code} applied`, { tone: 'success' })
        }}
      />
    </Screen>
  )
}

/** One line: the service and option, its stepper, and what that line costs. */
function CartLine({ item, service, rootId, last }: { item: CartItem; service: Service | undefined; rootId: string | null; last: boolean }) {
  const variant = service?.variants.find((v) => v.id === item.variantId)
  const name = service?.name ?? 'Service'
  return (
    <View className={cn('flex-row items-center gap-3 py-4', !last && 'border-b border-border')}>
      <View className="min-w-0 flex-1">
        <Text className="text-base font-semibold text-ink">{name}</Text>
        {variant ? <Text className="text-xs text-muted">{variant.label}</Text> : null}
        <Text className="mt-1 text-sm text-ink tabular-nums">{formatPaise(item.unitPrice * item.qty)}</Text>
      </View>
      {service && rootId ? (
        <AddControl
          qty={item.qty}
          label={variant ? `${name}, ${variant.label}` : name}
          onAdd={() => setQty(service, variant, 1, rootId)}
          onIncrease={() => setQty(service, variant, item.qty + 1, rootId)}
          onDecrease={() => setQty(service, variant, item.qty - 1, rootId)}
        />
      ) : null}
    </View>
  )
}

/** Pinned to the bottom: the total and Proceed. */
function ProceedBar({ total, onProceed, signedIn }: { total: number; onProceed: () => void; signedIn: boolean }) {
  const insets = useSafeAreaInsets()
  return (
    <View className="flex-row items-center gap-3 border-t border-border bg-bg px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
      <View className="min-w-0 flex-1">
        <Text className="text-lg font-bold text-ink tabular-nums">{formatPaise(total)}</Text>
        <Text className="text-xs text-muted">Total to pay</Text>
      </View>
      <Button size="lg" onPress={onProceed} className="px-8">
        {signedIn ? 'Proceed' : 'Log in to proceed'}
      </Button>
    </View>
  )
}
