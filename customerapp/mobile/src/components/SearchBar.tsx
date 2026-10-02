import { useEffect, useState } from 'react'
import { AccessibilityInfo, TextInput, View } from 'react-native'
import { Search, X } from 'lucide-react-native'
import { Icon, useColor } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'

/**
 * The search field on Home and on /search.
 *
 * On Home it is a button that navigates rather than a live field: a customer
 * typing into a box that sits above a scrolling page expects results under it.
 * Tapping opens /search, where the field is real.
 */

export interface SearchBarProps {
  /** Rotates through these when the field is empty and not focused. */
  placeholders?: readonly string[]
  value?: string
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
  /** Renders as a button that calls onOpen instead of an editable field. */
  readOnly?: boolean
  onOpen?: () => void
  autoFocus?: boolean
  /** For the ink header on Home, where the default grey fill disappears. */
  onDark?: boolean
  className?: string
}

const DEFAULT_PLACEHOLDERS = [
  'Search "AC service"',
  'Search "fridge not cooling"',
  'Search "washing machine repair"',
  'Search "geyser installation"',
] as const

export function SearchBar({
  placeholders = DEFAULT_PLACEHOLDERS,
  value,
  onChange,
  onSubmit,
  readOnly = false,
  onOpen,
  autoFocus = false,
  onDark = false,
  className,
}: SearchBarProps) {
  const [index, setIndex] = useState(0)
  const [focused, setFocused] = useState(false)
  const placeholderColor = useColor('text-muted')
  const selection = useColor('text-brand')

  // The rotation is decoration. Anyone who has asked for less motion gets a
  // single fixed placeholder instead of a line that changes under them.
  useEffect(() => {
    if (placeholders.length < 2) return
    let timer: ReturnType<typeof setInterval> | undefined
    let live = true
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!live || reduced) return
      timer = setInterval(() => {
        setIndex((i) => (i + 1) % placeholders.length)
      }, 3000)
    })
    return () => {
      live = false
      if (timer) clearInterval(timer)
    }
  }, [placeholders.length])

  const placeholder = placeholders[index] ?? placeholders[0] ?? 'Search'

  const shell = 'min-h-12 w-full flex-row items-center gap-2.5 rounded-pill border px-4'

  if (readOnly) {
    return (
      <Tappable
        onPress={onOpen}
        accessibilityLabel={placeholder}
        className={cn(
          shell,
          onDark ? 'border-transparent bg-bg' : 'border-border bg-surface active:border-brand active:opacity-100',
          className
        )}
      >
        <Icon as={Search} className="size-4 text-muted" />
        <Text numberOfLines={1} className="min-w-0 flex-1 text-sm text-muted">
          {placeholder}
        </Text>
      </Tappable>
    )
  }

  return (
    <View
      accessibilityRole="search"
      className={cn(shell, 'bg-bg', focused ? 'border-brand' : 'border-border', className)}
    >
      <Icon as={Search} className="size-4 text-muted" />
      <TextInput
        autoComplete="off"
        autoCorrect={false}
        autoFocus={autoFocus}
        accessibilityLabel="Search services, appliances and issues"
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        selectionColor={selection}
        cursorColor={selection}
        returnKeyType="search"
        value={value ?? ''}
        onChangeText={(text) => onChange?.(text)}
        onSubmitEditing={() => onSubmit?.(value ?? '')}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="min-h-12 min-w-0 flex-1 py-0 font-normal text-base text-ink"
      />
      {value ? (
        <Tappable
          onPress={() => onChange?.('')}
          accessibilityLabel="Clear search"
          className="-mr-2 size-11 items-center justify-center rounded-full"
        >
          <Icon as={X} className="size-4 text-muted" />
        </Tappable>
      ) : null}
    </View>
  )
}
