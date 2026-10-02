import { ActivityIndicator, View } from 'react-native'
import type { Href } from 'expo-router'
import { cn } from '@/lib/cn'
import { Tappable } from './Tappable'
import { Text } from './Text'
import { useColor } from './Icon'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  variant?: Variant
  size?: Size
  /** Shows a spinner and blocks the press without changing the width. */
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  onPress?: () => void
  href?: Href
  replace?: boolean
  accessibilityLabel?: string
  className?: string
  /** Overrides on the label (rarely needed). */
  textClassName?: string
  children?: React.ReactNode
}

const variants: Record<Variant, { box: string; text: string; spinner: string }> = {
  // Solid brand blue is the only primary in the system.
  primary: {
    box: 'bg-brand border border-brand active:bg-brand-deep active:border-brand-deep',
    text: 'text-white',
    spinner: 'text-white',
  },
  // Brand edge and label, no fill — used beside a primary.
  secondary: {
    box: 'bg-bg border border-brand active:bg-brand-soft',
    text: 'text-brand',
    spinner: 'text-brand',
  },
  ghost: {
    box: 'bg-transparent border border-transparent active:bg-surface',
    text: 'text-ink',
    spinner: 'text-ink',
  },
  // Destructive confirmations only.
  danger: {
    box: 'bg-error border border-error active:opacity-85',
    text: 'text-white',
    spinner: 'text-white',
  },
}

const sizes: Record<Size, { box: string; text: string }> = {
  sm: { box: 'h-11 px-4', text: 'text-sm' },
  md: { box: 'h-12 px-5', text: 'text-base' },
  lg: { box: 'h-14 px-6', text: 'text-base' },
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  onPress,
  href,
  replace,
  accessibilityLabel,
  className,
  textClassName,
  children,
}: ButtonProps) {
  const inactive = disabled || loading
  const look = variants[variant]
  const spinner = useColor(look.spinner)

  return (
    <Tappable
      onPress={onPress}
      {...(href ? { href } : {})}
      {...(replace ? { replace } : {})}
      disabled={inactive}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive, busy: loading }}
      className={cn(
        'flex-row items-center justify-center rounded-pill active:opacity-100',
        look.box,
        sizes[size].box,
        fullWidth && 'w-full self-stretch',
        disabled && !loading && 'border-muted bg-muted opacity-60',
        className
      )}
    >
      {/* The label stays laid out while loading so the width holds. */}
      <View className={cn('flex-row items-center gap-2', loading && 'opacity-0')}>
        {iconLeft}
        {typeof children === 'string' || typeof children === 'number' ? (
          <Text
            numberOfLines={1}
            className={cn('font-semibold', sizes[size].text, look.text, textClassName)}
          >
            {children}
          </Text>
        ) : (
          children
        )}
        {iconRight}
      </View>
      {loading ? (
        <ActivityIndicator className="absolute" color={spinner} />
      ) : null}
    </Tappable>
  )
}
