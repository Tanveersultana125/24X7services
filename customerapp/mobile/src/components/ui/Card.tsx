import { View } from 'react-native'
import type { Href } from 'expo-router'
import { cn } from '@/lib/cn'
import { Tappable } from './Tappable'

/**
 * The one surface in the system: a bordered box on the page colour. `raised`
 * adds the single elevation level; CardLink and CardButton make it pressable.
 */

interface CardBaseProps {
  raised?: boolean
  className?: string
  children: React.ReactNode
}

const base = 'rounded-card border border-border bg-bg'

export function Card({ raised = false, className, children }: CardBaseProps) {
  return <View className={cn(base, raised && 'shadow-raised', className)}>{children}</View>
}

export function CardLink({
  href,
  ariaLabel,
  raised = false,
  className,
  children,
}: CardBaseProps & { href: Href; ariaLabel?: string }) {
  return (
    <Tappable
      href={href}
      accessibilityLabel={ariaLabel}
      className={cn(base, 'active:border-brand active:opacity-100', raised && 'shadow-raised', className)}
    >
      {children}
    </Tappable>
  )
}

export function CardButton({
  onPress,
  selected = false,
  disabled = false,
  ariaLabel,
  raised = false,
  className,
  children,
}: CardBaseProps & {
  onPress: () => void
  selected?: boolean
  disabled?: boolean
  ariaLabel?: string
}) {
  return (
    <Tappable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={ariaLabel}
      accessibilityState={{ selected, disabled }}
      className={cn(
        base,
        'w-full active:border-brand active:opacity-100',
        disabled && 'opacity-60',
        // A two-pixel brand edge when picked.
        selected && 'border-2 border-brand',
        raised && 'shadow-raised',
        className
      )}
    >
      {children}
    </Tappable>
  )
}
