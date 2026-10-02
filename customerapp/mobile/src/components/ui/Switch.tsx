import { ActivityIndicator, View } from 'react-native'
import type { Href } from 'expo-router'
import type { LucideIcon } from 'lucide-react-native'
import { cn } from '@/lib/cn'
import { Icon, useColor } from './Icon'
import { Tappable } from './Tappable'
import { Text } from './Text'

/**
 * A setting that is on or off and takes effect when pressed. `busy` puts a
 * spinner in the knob while the write is on the network; if it fails, the
 * caller puts the knob back.
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  busy = false,
  disabled = false,
  className,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
  busy?: boolean
  disabled?: boolean
  className?: string
}) {
  const spinner = useColor('text-muted')
  return (
    <Tappable
      accessibilityRole="switch"
      accessibilityLabel={description ? `${label}. ${description}` : label}
      accessibilityState={{ checked, disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={() => onChange(!checked)}
      hitSlop={8}
      className={cn(
        'h-7 w-12 justify-center rounded-pill border',
        checked ? 'border-success bg-success' : 'border-border bg-surface',
        (disabled || busy) && 'opacity-60',
        className
      )}
    >
      <View
        className={cn(
          'size-5 items-center justify-center rounded-full bg-bg shadow-sm',
          checked ? 'ml-6' : 'ml-1'
        )}
      >
        {busy ? <ActivityIndicator size="small" color={spinner} className="scale-50" /> : null}
      </View>
    </Tappable>
  )
}

/**
 * The row a switch lives in. Only the switch toggles — a row that toggles when
 * tapped anywhere gets turned off by someone trying to read it. With `href`
 * the whole row becomes one link to whatever unlocks the setting.
 */
export function SwitchRow({
  icon,
  label,
  description,
  checked,
  onChange,
  busy,
  disabled,
  href,
}: {
  icon: LucideIcon
  label: string
  description?: string
  checked: boolean
  onChange: (next: boolean) => void
  busy?: boolean
  disabled?: boolean
  href?: Href
}) {
  const body = (
    <>
      <Icon as={icon} className="mt-0.5 size-5 text-ink" />
      <View className="min-w-0 flex-1">
        <Text className="text-base font-medium text-ink">{label}</Text>
        {description ? <Text className="mt-0.5 text-sm text-muted">{description}</Text> : null}
      </View>
    </>
  )

  if (href) {
    return (
      <Tappable href={href} className="flex-row items-start gap-3 py-4">
        {body}
        <View pointerEvents="none">
          <Switch checked={checked} onChange={() => undefined} label={label} disabled />
        </View>
      </Tappable>
    )
  }

  return (
    <View className="flex-row items-start gap-3 py-4">
      {body}
      <Switch
        checked={checked}
        onChange={onChange}
        label={label}
        {...(description ? { description } : {})}
        {...(busy === undefined ? {} : { busy })}
        {...(disabled === undefined ? {} : { disabled })}
      />
    </View>
  )
}
