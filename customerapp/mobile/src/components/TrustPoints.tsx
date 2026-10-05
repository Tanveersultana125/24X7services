import { View } from 'react-native'
import {
  BadgeCheck,
  Check,
  ClipboardCheck,
  EyeOff,
  FileText,
  Headphones,
  IndianRupee,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react-native'
import { TRUST_POINTS } from '@/config/brand'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'

/**
 * The promises the app repeats, rendered the same way everywhere they appear.
 *
 * The list itself lives in config/brand so the wording is changed in one place.
 * Nothing here is absolute — no guarantees, no percentages nobody measures —
 * because every line on this list is one the business has to keep.
 */
/** A picture for each promise, for the tile layout. */
const ICONS: Record<(typeof TRUST_POINTS)[number]['key'], LucideIcon> = {
  pricing: IndianRupee,
  verified: BadgeCheck,
  'no-hidden': EyeOff,
  approval: ClipboardCheck,
  warranty: ShieldCheck,
  invoice: FileText,
  support: Headphones,
}

export function TrustPoints({
  compact = false,
  tiles = false,
  className,
}: {
  /**
   * Each promise as a tile with its own icon, two to a row — for a page where
   * the promises are a section in their own right rather than a footnote.
   */
  tiles?: boolean
  /**
   * Two narrow columns of smaller type, for where the list is reassurance
   * beside the screen's actual job rather than the job itself. Seven lines at
   * body size under a sign-in form is a wall that outweighs the form.
   */
  compact?: boolean
  className?: string
}) {
  if (tiles) {
    return (
      <View className={cn('flex-row flex-wrap justify-between gap-y-2.5', className)}>
        {TRUST_POINTS.map((point, index) => {
          // An odd one out at the end takes the whole row, not half of it.
          const last = index === TRUST_POINTS.length - 1 && TRUST_POINTS.length % 2 === 1
          return (
            <View
              key={point.key}
              className={cn(
                'rounded-card border border-border bg-bg p-3.5',
                last ? 'w-full flex-row items-center gap-2.5' : 'w-[48.5%] gap-2.5'
              )}
            >
              <View className="size-9 items-center justify-center rounded-full bg-brand-soft">
                <Icon as={ICONS[point.key]} className="size-[18px] text-brand" />
              </View>
              <Text className="text-[13px] font-semibold leading-[18px] text-ink">{point.label}</Text>
            </View>
          )
        })}
      </View>
    )
  }

  return (
    <View className={cn(compact ? 'flex-row flex-wrap justify-between gap-y-2' : 'gap-2', className)}>
      {TRUST_POINTS.map((point) => (
        <View key={point.key} className={cn('flex-row gap-2', compact ? 'w-[48%] items-start' : 'items-center')}>
          <Icon as={Check} className={cn('text-success', compact ? 'mt-px size-3.5' : 'size-4')} />
          <Text className={cn('min-w-0 flex-1 text-ink', compact ? 'text-xs leading-[16px]' : 'text-sm')}>
            {point.label}
          </Text>
        </View>
      ))}
    </View>
  )
}
