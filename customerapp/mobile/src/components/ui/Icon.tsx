import type { LucideIcon } from 'lucide-react-native'
import { useCSSVariable, useResolveClassNames } from 'uniwind'
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
  filled = false,
}: {
  as: LucideIcon
  className?: string
  strokeWidth?: number
  /** Fill the glyph with its own colour (a star in a rating). */
  filled?: boolean
}) {
  const style = useResolveClassNames(cn('size-5 text-ink', className)) as {
    width?: number | string
    height?: number | string
    color?: string
    opacity?: number
    marginTop?: number
    marginLeft?: number
    marginRight?: number
  }
  const ink = useInk()
  const size = toPx(style.width) ?? 20
  const color = style.color ?? ink
  return (
    <Component
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      {...(filled ? { fill: color } : {})}
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
  const ink = useInk()
  return style.color ?? ink
}

/** The theme's ink, for when a class resolves to no colour at all. */
function useInk(): string {
  const ink = useCSSVariable('--color-ink')
  return typeof ink === 'string' ? ink : 'black'
}

/**
 * A resolved length in px. Native resolves classes to numbers; the web build
 * reads the browser's computed style, which comes back as a string ("16px").
 */
function toPx(v: number | string | undefined): number | undefined {
  if (typeof v === 'number') return v
  if (typeof v !== 'string') return undefined
  const n = parseFloat(v)
  if (Number.isNaN(n)) return undefined
  return v.endsWith('rem') ? n * 16 : n
}
