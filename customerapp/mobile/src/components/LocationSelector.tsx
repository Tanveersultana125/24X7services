import { View } from 'react-native'
import { ChevronDown, MapPin } from 'lucide-react-native'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'

/**
 * The first line of Home: where the work is going to happen.
 *
 * Two lines, the area on top in the larger type. That is the part a customer
 * scans to check the app is pointed at the right place — the city and pincode
 * underneath are only there to settle it when two areas share a name.
 *
 * The wording elsewhere stays "service", not "delivery" — nothing is being
 * delivered, and the difference matters to someone deciding whether this app
 * covers their address.
 */

export interface LocationSelectorProps {
  /** The area: the line someone actually reads. */
  area?: string
  /** City and pincode, under it. */
  detail?: string
  onClick: () => void
  /** Set while the pincode is being checked against serviceAreas. */
  loading?: boolean
  /** For the brand-coloured header on Home: white text instead of ink. */
  onDark?: boolean
  className?: string
}

export function LocationSelector({
  area,
  detail,
  onClick,
  loading = false,
  onDark = false,
  className,
}: LocationSelectorProps) {
  const chosen = Boolean(area)

  const headline = loading ? 'Checking…' : chosen ? area : 'Set your location'
  const sub = loading ? undefined : chosen ? detail : 'So we can check whether we cover it'

  return (
    <Tappable
      onPress={onClick}
      className={cn(
        'max-w-full flex-row items-start gap-1.5 self-start rounded-card px-1 py-1',
        onDark ? 'active:bg-white/10' : 'active:bg-surface',
        className
      )}
      accessibilityLabel={
        chosen
          ? `Service at ${[area, detail].filter(Boolean).join(', ')}. Change location`
          : 'Set your location'
      }
    >
      <Icon as={MapPin} className={cn('mt-0.5 size-5', onDark ? 'text-white' : 'text-brand')} />
      <View className="min-w-0 shrink">
        <Text
          numberOfLines={1}
          className={cn('text-lg font-bold leading-tight', onDark ? 'text-white' : 'text-ink')}
        >
          {headline}
        </Text>
        {sub ? (
          <View className="mt-0.5 flex-row items-center gap-1">
            <Text
              numberOfLines={1}
              className={cn('min-w-0 shrink text-sm', onDark ? 'text-white/75' : 'text-muted')}
            >
              {sub}
            </Text>
            <Icon as={ChevronDown} className={cn('size-4', onDark ? 'text-white/75' : 'text-muted')} />
          </View>
        ) : null}
      </View>
    </Tappable>
  )
}
