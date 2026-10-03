import { View } from 'react-native'
import { ShoppingCart } from 'lucide-react-native'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
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
export function CartButton({
  className,
  onDark = false,
}: {
  className?: string
  /** On Home's painted header: a glass tile with a white glyph. */
  onDark?: boolean
}) {
  const cart = useCart()
  const count = cart.length

  return (
    <Tappable
      href="/cart"
      accessibilityLabel={count === 0 ? 'Cart, empty' : `Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
      className={cn(
        'relative size-12 shrink-0 items-center justify-center rounded-card border active:opacity-100',
        onDark
          ? 'border-white/25 bg-white/15 active:bg-white/25'
          : 'border-border bg-bg active:border-brand',
        className
      )}
    >
      <Icon as={ShoppingCart} className={cn('size-5', onDark ? 'text-white' : 'text-ink')} />
      {count > 0 ? (
        // The web's ring-2 ring-bg: a page-coloured edge that cuts the badge
        // out of the tile's border.
        <View
          aria-hidden
          className="absolute -right-1.5 -top-1.5 h-5 min-w-5 items-center justify-center rounded-pill border-2 border-bg bg-brand px-1"
        >
          <Text className="text-[11px] font-bold leading-[13px] text-white">{count > 9 ? '9+' : count}</Text>
        </View>
      ) : null}
    </Tappable>
  )
}
