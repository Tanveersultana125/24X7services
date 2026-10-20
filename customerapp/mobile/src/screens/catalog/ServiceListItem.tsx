import { View } from 'react-native'
import { type Href } from 'expo-router'
import { Sparkles, Star } from 'lucide-react-native'
import { formatPaise } from '@app/shared'
import type { Service } from '@app/shared/catalog-v2'

import { Icon } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'
import { hasPublicAsset } from '@/lib/publicAsset'
import { AddControl, compactCount } from './cartActions'

/**
 * One service in a category's list, laid out the way UC lays it out: what it
 * is, how it rates, what it costs and two lines on what is done, on the left;
 * the picture on the right with the Add control sitting on its lower edge.
 *
 * The text side opens the full page. The Add control only ever adds, so a
 * customer browsing never lands somewhere they did not mean to go.
 */
export function ServiceListItem({
  service,
  qty,
  onAdd,
  onIncrease,
  onDecrease,
  last,
}: {
  service: Service
  qty: number
  onAdd: () => void
  onIncrease: () => void
  onDecrease: () => void
  last: boolean
}) {
  const href = `/service/${service.id}` as Href
  const hasOptions = service.variants.length > 0

  return (
    <View className={cn('flex-row gap-4 py-5', !last && 'border-b border-border')}>
      <Tappable href={href} accessibilityLabel={`${service.name}. See details`} className="min-w-0 flex-1 active:opacity-70">
        <Text className="text-base font-semibold text-ink">{service.name}</Text>
        {service.rating ? (
          <View className="mt-1 flex-row items-center gap-1">
            <Icon as={Star} filled className="size-3.5 text-ink" />
            <Text className="text-xs text-muted">
              {`${service.rating.toFixed(2)} (${compactCount(service.reviewCount)} reviews)`}
            </Text>
          </View>
        ) : null}
        <View className="mt-1 flex-row flex-wrap items-baseline gap-x-2">
          <Text className="text-sm font-semibold text-ink tabular-nums">
            {hasOptions ? `Starts at ${formatPaise(service.price)}` : formatPaise(service.price)}
          </Text>
          {service.compareAt ? (
            <Text className="text-xs text-muted line-through tabular-nums">{formatPaise(service.compareAt)}</Text>
          ) : null}
          {service.durationMinutes ? <Text className="text-xs text-muted">{`· ${service.durationMinutes} mins`}</Text> : null}
        </View>
        {service.highlights.slice(0, 2).map((line) => (
          <View key={line} className="mt-1.5 flex-row gap-2">
            <Text className="text-xs text-muted">•</Text>
            <Text className="flex-1 text-xs leading-[18px] text-muted">{line}</Text>
          </View>
        ))}
        <Text className="mt-2 text-sm font-semibold text-brand">View details</Text>
      </Tappable>

      <View className="w-28 items-center">
        <View className="size-28 overflow-hidden rounded-card bg-plate">
          {hasPublicAsset(service.image) ? (
            <Img src={service.image} alt="" className="size-full" />
          ) : (
            <View className="size-full items-center justify-center">
              <Icon as={Sparkles} className="size-7 text-muted" />
            </View>
          )}
        </View>
        <AddControl
          qty={qty}
          label={service.name}
          onAdd={onAdd}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          className="-mt-5 shadow-sm"
        />
        {hasOptions ? <Text className="mt-1 text-xs text-muted">{`${service.variants.length} options`}</Text> : null}
      </View>
    </View>
  )
}
