import { View } from 'react-native'
import type { CatalogService } from '@app/shared'
import { StickyCTA } from '@/components/Screen'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useCart } from '@/lib/cart'

/**
 * "2 items added — View cart", pinned to the foot of the screen once anything
 * is in the cart, so a customer adding from a list always sees the tap landed.
 *
 * Pass it as the screen's `footer` (with `tab` on a tab screen, where the tab
 * bar already took the bottom inset). It renders nothing while the cart is
 * empty, so the footer simply is not there.
 *
 * The line under the count names the last thing added. The catalog is the
 * screen's to load; the bar is handed it, and names nothing until it arrives.
 */
export function CartBar({
  services,
  tab = false,
}: {
  services: readonly CatalogService[]
  /** True on a tab screen. */
  tab?: boolean
}) {
  const cart = useCart()
  if (cart.length === 0) return null

  const last = cart[cart.length - 1]
  const lastName = services.find(
    (service) => service.applianceId === last?.applianceId && service.serviceKey === last?.serviceKey
  )?.name

  return (
    <StickyCTA
      tab={tab}
      detail={
        <View accessibilityLiveRegion="polite">
          <Text className="text-base font-semibold text-ink">
            {cart.length} {cart.length === 1 ? 'item' : 'items'} added
          </Text>
          {lastName ? (
            <Text numberOfLines={1} className="text-sm text-muted">
              {lastName}
            </Text>
          ) : null}
        </View>
      }
    >
      <Tappable
        href="/cart"
        className="h-12 items-center justify-center rounded-card border border-brand bg-brand px-8 active:border-brand-deep active:bg-brand-deep active:opacity-100"
      >
        <Text className="text-base font-semibold text-white">View cart</Text>
      </Tappable>
    </StickyCTA>
  )
}
