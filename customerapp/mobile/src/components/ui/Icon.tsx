import type { LucideIcon } from 'lucide-react-native'
import { useResolveClassNames } from 'uniwind'
import { cn } from '@/lib/cn'

/**
 * A lucide icon, sized and coloured with the same classes the web app uses:
 * `<Icon as={ArrowLeft} className="size-5 text-brand" />`.
 *
 * lucide-react-native takes `size` and `color` props rather than a className,
 * so the classes are resolved to a style and read back out. The colour follows
 * the theme because the class does.
 */
export function Icon({
  as: Component,
  className,
  strokeWidth = 2,
  fill,
}: {
  as: LucideIcon
  className?: string
  strokeWidth?: number
  /** For a filled glyph (a star in a rating). */
  fill?: string
}) {
  const style = useResolveClassNames(cn('size-5 text-ink', className)) as {
    width?: number
    height?: number
    color?: string
    opacity?: number
    marginTop?: number
    marginLeft?: number
    marginRight?: number
  }
  const size = typeof style.width === 'number' ? style.width : 20
  return (
    <Component
      size={size}
      color={style.color ?? '#17150f'}
      strokeWidth={strokeWidth}
      {...(fill ? { fill } : {})}
      style={{
        ...(style.opacity === undefined ? {} : { opacity: style.opacity }),
        ...(style.marginTop === undefined ? {} : { marginTop: style.marginTop }),
        ...(style.marginLeft === undefined ? {} : { marginLeft: style.marginLeft }),
        ...(style.marginRight === undefined ? {} : { marginRight: style.marginRight }),
      }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  )
}

/** The icon's colour as a string, for the rare prop that wants one. */
export function useColor(className: string): string {
  const style = useResolveClassNames(className) as { color?: string }
  return style.color ?? '#17150f'
}
