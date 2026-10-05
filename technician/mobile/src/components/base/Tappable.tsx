import { Pressable, type PressableProps, type StyleProp, type View, type ViewStyle } from 'react-native'
import { router, type Href } from 'expo-router'
import { cn } from '@/lib/cn'

/**
 * The one pressable surface: a link when given `href`, a button when given
 * `onPress`. It dims while held (`active:` — the touch equivalent of the web
 * app's hover state), and is announced with the right role either way.
 *
 * `replace` swaps the screen rather than stacking it, for the places the web
 * app used router.replace. Pass `active:…` / `disabled:…` classes to change
 * the pressed or disabled look.
 */
export interface TappableProps extends Omit<PressableProps, 'style'> {
  href?: Href
  replace?: boolean
  className?: string
  /** For values a class cannot carry, like an inset-derived offset. */
  style?: StyleProp<ViewStyle>
  ref?: React.Ref<View>
}

export function Tappable({
  href,
  replace = false,
  onPress,
  className,
  accessibilityRole,
  ...props
}: TappableProps) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole ?? (href ? 'link' : 'button')}
      className={cn('active:opacity-70', className)}
      onPress={(event) => {
        onPress?.(event)
        if (href) {
          if (replace) router.replace(href)
          else router.push(href)
        }
      }}
      {...props}
    />
  )
}
