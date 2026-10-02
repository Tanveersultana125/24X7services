import { View } from 'react-native'
import { Check } from 'lucide-react-native'
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
export function TrustPoints({
  compact = false,
  className,
}: {
  /**
   * Two narrow columns of smaller type, for where the list is reassurance
   * beside the screen's actual job rather than the job itself. Seven lines at
   * body size under a sign-in form is a wall that outweighs the form.
   */
  compact?: boolean
  className?: string
}) {
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
