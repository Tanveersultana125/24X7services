import { useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { usePrefersReducedMotion } from '@/components/ServiceClip'
import { cn } from '@/lib/cn'

/**
 * One card at a time, centred, with an arrow either side — for the Services
 * page's appliances, where two half-cards side by side read as clutter.
 *
 * It is still a paging strip underneath, so a swipe works as well as the
 * arrows; the arrows wrap from the last card back to the first.
 */

/** The strip never grows past this, so a tablet does not get a poster. */
const MAX_WIDTH = 384

export function ApplianceCarousel({
  label,
  items,
}: {
  label: string
  items: { key: string; node: React.ReactNode; name: string }[]
}) {
  const strip = useRef<ScrollView>(null)
  const reducedMotion = usePrefersReducedMotion()
  const [width, setWidth] = useState(0)
  const [index, setIndex] = useState(0)

  function go(to: number): void {
    if (!width || items.length === 0) return
    const next = (to + items.length) % items.length
    strip.current?.scrollTo({ x: next * width, animated: !reducedMotion })
    setIndex(next)
  }

  const arrow = 'size-10 items-center justify-center rounded-full border border-border bg-bg shadow-raised'

  return (
    <View accessibilityLabel={label}>
      <View className="flex-row items-center gap-2">
        <Tappable accessibilityRole="button" accessibilityLabel="Previous" onPress={() => go(index - 1)} className={arrow}>
          <Icon as={ChevronLeft} className="size-5 text-ink" />
        </Tappable>

        <View
          className="flex-1 items-center"
          onLayout={(event) => setWidth(Math.min(MAX_WIDTH, Math.floor(event.nativeEvent.layout.width)))}
        >
          {width ? (
            <ScrollView
              ref={strip}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={{ width }}
              onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
            >
              {items.map((item, at) => (
                <View
                  key={item.key}
                  accessibilityLabel={`${at + 1} of ${items.length}: ${item.name}`}
                  style={{ width }}
                  className="px-1"
                >
                  {item.node}
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>

        <Tappable accessibilityRole="button" accessibilityLabel="Next" onPress={() => go(index + 1)} className={arrow}>
          <Icon as={ChevronRight} className="size-5 text-ink" />
        </Tappable>
      </View>

      <View className="mt-3 flex-row justify-center gap-1.5" importantForAccessibility="no-hide-descendants">
        {items.map((item, at) => (
          <View key={item.key} className={cn('h-1.5 rounded-full', at === index ? 'w-5 bg-ink' : 'w-1.5 bg-border')} />
        ))}
      </View>
    </View>
  )
}
