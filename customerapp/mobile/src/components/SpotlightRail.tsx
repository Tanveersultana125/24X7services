import { ScrollView, View, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { Href } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import { Icon } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'

/**
 * "In the spotlight": a row of large photograph cards, one per appliance, the
 * way the marketplaces break up Home between the categories and the lists.
 * Each card is a technician at work on that appliance, darkened at the foot
 * where its name and its starting price sit, and opens the appliance's page.
 *
 * Scrolls sideways with the next card peeking in, so it reads as a row and
 * not as the end of the page. The words are white over a fixed dark scrim,
 * so they hold in either theme.
 */

export interface SpotlightItem {
  id: string
  title: string
  /** "Starts at ₹299". */
  note?: string
  photo: string
  href: Href
}

/** The scrim, as `night` at 80% / 20% / clear, bottom to top. */
const SCRIM = ['rgba(23,21,15,0.8)', 'rgba(23,21,15,0.2)', 'rgba(23,21,15,0)'] as const

export function SpotlightRail({ items }: { items: readonly SpotlightItem[] }) {
  const { width } = useWindowDimensions()
  if (items.length === 0) return null
  // 82% of the page column, so the next card peeks in.
  const card = Math.round((width - 32) * 0.82)

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={card + 12}
      decelerationRate="fast"
      className="-mx-4"
      contentContainerClassName="gap-3 px-4 pb-1"
    >
      {items.map((item, index) => (
        <View key={item.id} style={{ width: card }}>
        <Tappable
          href={item.href}
          accessibilityLabel={[item.title, item.note].filter(Boolean).join(', ')}
          className="aspect-[16/10] w-full overflow-hidden rounded-card bg-plate active:opacity-90"
        >
          <Img src={item.photo} alt="" priority={index === 0 ? 'high' : 'normal'} className="absolute inset-0" />
          <LinearGradient
            colors={SCRIM}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <View className="absolute inset-x-0 bottom-0 flex-row items-end justify-between gap-3 p-4">
            <View className="min-w-0 flex-1">
              <Text className="text-lg font-bold leading-[22px] text-white">{item.title}</Text>
              {item.note ? <Text className="mt-1 text-sm text-white/85">{item.note}</Text> : null}
            </View>
            <View className="size-9 shrink-0 items-center justify-center rounded-full bg-white">
              <Icon as={ChevronRight} className="size-5 text-night" />
            </View>
          </View>
        </Tappable>
        </View>
      ))}
    </ScrollView>
  )
}
