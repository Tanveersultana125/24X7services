import { View } from 'react-native'
import { Check } from 'lucide-react-native'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'
import { Tappable } from './Tappable'
import { Text } from './Text'

/**
 * A selectable pill: appliance type, an issue, a review tag, a filter.
 * Selection is announced as state, not only painted.
 */
export function Chip({
  selected = false,
  showCheck = false,
  disabled = false,
  onPress,
  className,
  textClassName,
  accessibilityLabel,
  children,
}: {
  selected?: boolean
  /** Renders a tick inside the pill when selected. Off for single-choice rows. */
  showCheck?: boolean
  disabled?: boolean
  onPress?: () => void
  className?: string
  textClassName?: string
  accessibilityLabel?: string
  children: React.ReactNode
}) {
  return (
    <Tappable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected, disabled }}
      className={cn(
        'min-h-11 flex-row items-center gap-1.5 self-start rounded-pill border px-4 py-2',
        selected ? 'border-brand bg-brand' : 'border-border bg-bg active:border-brand',
        disabled && 'opacity-60',
        className
      )}
    >
      {showCheck && selected ? <Icon as={Check} className="size-4 text-white" /> : null}
      {typeof children === 'string' ? (
        <Text
          numberOfLines={1}
          className={cn('text-sm font-medium', selected ? 'text-white' : 'text-ink', textClassName)}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Tappable>
  )
}

/** A non-interactive pill, for read-only tags on a review or a booking. */
export function Tag({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <View className={cn('self-start rounded-pill border border-border bg-surface px-3 py-1', className)}>
      {typeof children === 'string' ? (
        <Text className="text-xs font-medium text-ink">{children}</Text>
      ) : (
        children
      )}
    </View>
  )
}
