import { useEffect } from 'react'
import { ScrollView, View, useWindowDimensions } from 'react-native'
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import type { Href } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import { Icon } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'

/**
 * "In the spotlight": a gallery of photograph cards, one per appliance, the
 * way the marketplaces break up Home between the categories and the lists.
 * Each card is a technician at work on that appliance, darkened at the foot
 * where its name and its starting price sit, and opens the appliance's page.
 *
 * The cards are of different sizes and sit at different heights, and the
 * whole row drifts slowly right to left without end — a gallery wall going
 * past, not a carousel to page through. A finger held on it stops the drift.
 * With reduce motion on it is a still row that scrolls by hand instead.
 *
 * The words are white over a fixed dark scrim, so they hold in either theme.
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

/**
 * The staggered rhythm the cards repeat, as fractions of the screen width:
 * each card's width, height, and how far down the row it starts.
 */
const RHYTHM = [
  { w: 0.5, h: 0.6, top: 0.14 },
  { w: 0.62, h: 0.78, top: 0 },
  { w: 0.56, h: 0.64, top: 0.22 },
  { w: 0.46, h: 0.56, top: 0.06 },
] as const

const GAP = 14
/** Drift speed, in points a second. */
const SPEED = 28

export function SpotlightRail({ items }: { items: readonly SpotlightItem[] }) {
  const { width } = useWindowDimensions()
  const reduceMotion = useReducedMotion()
  const offset = useSharedValue(0)

  const cards = items.map((item, index) => {
    const beat = RHYTHM[index % RHYTHM.length]!
    return { item, w: Math.round(width * beat.w), h: Math.round(width * beat.h), top: Math.round(width * beat.top) }
  })
  const rowHeight = Math.max(0, ...cards.map((card) => card.top + card.h))
  // One full set of cards with the gap after each, so a second copy laid
  // straight after it lines up exactly where the first one started.
  const setWidth = cards.reduce((sum, card) => sum + card.w + GAP, 0)
  const moving = !reduceMotion && setWidth > 0

  function drift() {
    // Carry on from wherever the row is, at the same speed, then loop.
    const from = offset.value % setWidth
    offset.value = from
    offset.value = withTiming(-setWidth, { duration: ((setWidth + from) / SPEED) * 1000, easing: Easing.linear }, (done) => {
      if (!done) return
      offset.value = 0
      offset.value = withRepeat(withTiming(-setWidth, { duration: (setWidth / SPEED) * 1000, easing: Easing.linear }), -1, false)
    })
  }

  useEffect(() => {
    if (!moving) return
    offset.value = 0
    drift()
    return () => cancelAnimation(offset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moving, setWidth])

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }))

  if (items.length === 0) return null

  const set = (copy: number) =>
    cards.map(({ item, w, h, top }, index) => (
      <View key={`${copy}-${item.id}`} style={{ width: w, height: h, marginTop: top, marginRight: GAP }}>
        <Tappable
          href={item.href}
          accessibilityLabel={[item.title, item.note].filter(Boolean).join(', ')}
          className="size-full overflow-hidden rounded-card bg-plate active:opacity-90"
        >
          <Img
            src={item.photo}
            alt=""
            priority={copy === 0 && index === 0 ? 'high' : 'normal'}
            className="absolute inset-0"
          />
          <LinearGradient
            colors={SCRIM}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={{ position: 'absolute', top: '45%', right: 0, bottom: 0, left: 0 }}
          />
          <View className="absolute inset-x-0 bottom-0 flex-row items-end justify-between gap-2 p-3">
            <View className="min-w-0 flex-1">
              <Text className="text-base font-bold leading-5 text-white" numberOfLines={2}>
                {item.title}
              </Text>
              {item.note ? <Text className="mt-0.5 text-xs text-white/85">{item.note}</Text> : null}
            </View>
            <View className="size-8 shrink-0 items-center justify-center rounded-full bg-white">
              <Icon as={ChevronRight} className="size-4 text-night" />
            </View>
          </View>
        </Tappable>
      </View>
    ))

  if (!moving) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-4"
        contentContainerClassName="items-start px-4 pb-1"
      >
        {set(0)}
      </ScrollView>
    )
  }

  return (
    <View
      className="-mx-4 overflow-hidden"
      style={{ height: rowHeight }}
      onTouchStart={() => cancelAnimation(offset)}
      onTouchEnd={drift}
      onTouchCancel={drift}
    >
      <Animated.View className="flex-row items-start pl-4" style={style}>
        {set(0)}
        {/* The second copy is only there to close the loop; screen readers
            hear each appliance once. */}
        <View
          className="flex-row items-start"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {set(1)}
        </View>
      </Animated.View>
    </View>
  )
}
