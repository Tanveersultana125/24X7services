import { View } from 'react-native'
import { ShoppingCart } from 'lucide-react-native'
import { CartButton } from '@/components/CartButton'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useCart } from '@/lib/cart'

/**
 * The cart tile beside Home's search field.
 *
 * Off the banner's colour it is the shared CartButton. On it, the web turns
 * the glyph white over a glass tile; the shared native CartButton draws its
 * glyph in ink with no way to change it, which disappears on the dark ground,
 * so this draws the painted version itself — same tile, same badge, same
 * label.
 */
export function HomeCartButton({ onDark = false }: { onDark?: boolean }) {
  const cart = useCart()
  if (!onDark) return <CartButton />

  const count = cart.length
  return (
    <Tappable
      href="/cart"
      accessibilityLabel={count === 0 ? 'Cart, empty' : `Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
      className="relative size-12 shrink-0 items-center justify-center rounded-card border border-white/25 bg-white/15 active:bg-white/25 active:opacity-100"
    >
      <Icon as={ShoppingCart} className="size-5 text-white" />
      {count > 0 ? (
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
