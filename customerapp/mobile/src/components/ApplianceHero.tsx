import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { BadgeCheck } from 'lucide-react-native'
import { usePrefersReducedMotion } from '@/components/ServiceClip'
import { cn } from '@/lib/cn'
import { Icon, useColor } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'

/**
 * The banner an appliance page opens on: a few slides, each a photograph of a
 * technician at work with what it is and what it starts at beside it, and a
 * bar per slide along the foot — the way the marketplaces open a category.
 *
 * The bars are the controls. Tapping one shows its slide; the one on show
 * fills while it stays, then hands on to the next. A customer who has asked
 * for less motion gets no hand-on at all: the slide they are looking at is the
 * one that stays until they pick another.
 *
 * Two columns, not two layers: the words on the plate to the left, the
 * photograph cropped into the right, so no crop can put a face under a
 * headline. `plate` and `night` because every photograph is a light room in
 * either theme.
 */

export interface HeroSlide {
  key: string
  photo: string
  title: string
  /** "Starts at ₹299". */
  note?: string
}

/** How long a slide stays before the next, when nothing is touched. */
const DWELL_MS = 4500

export function ApplianceHero({
  slides,
  className,
}: {
  slides: readonly HeroSlide[]
  className?: string
}) {
  const [index, setIndex] = useState(0)
  const reducedMotion = usePrefersReducedMotion()
  const plate = useColor('text-plate')
  const count = slides.length
  const current = slides[Math.min(index, count - 1)]

  useEffect(() => {
    if (reducedMotion || count < 2) return
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), DWELL_MS)
    return () => clearTimeout(timer)
  }, [index, count, reducedMotion])

  if (!current) return null

  return (
    <View
      accessibilityLabel="Highlights"
      className={cn('relative -mx-4 min-h-56 flex-row overflow-hidden bg-plate px-4 pb-9 pt-6', className)}
    >
      {/* Every photograph is laid out at once and only the current one shown,
          so moving between them is a fade rather than a fetch. */}
      <View className="absolute inset-y-0 right-0 w-1/2">
        {slides.map((slide, i) => (
          <SlidePhoto key={slide.key} photo={slide.photo} shown={i === index} priority={i === 0} />
        ))}
        <LinearGradient
          pointerEvents="none"
          colors={[plate, clear(plate)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '25%' }}
        />
      </View>

      <View className="relative w-[54%] min-w-0 justify-center pr-2" accessibilityLiveRegion="polite">
        <View className="flex-row items-center gap-1.5 self-start rounded-md bg-success px-2 py-1">
          <Icon as={BadgeCheck} className="size-3.5 text-white" />
          <Text className="text-[11px] font-semibold uppercase tracking-[0.44px] text-white">
            Verified technicians
          </Text>
        </View>
        <Text className="mt-3 text-xl font-bold leading-tight text-night">{current.title}</Text>
        {current.note ? <Text className="mt-2 text-base text-night/70">{current.note}</Text> : null}
      </View>

      {count > 1 ? (
        <View className="absolute inset-x-4 bottom-2 flex-row gap-2">
          {slides.map((slide, i) => (
            <Tappable
              key={slide.key}
              onPress={() => setIndex(i)}
              accessibilityLabel={`Show ${slide.title}`}
              accessibilityState={{ selected: i === index }}
              className="h-6 flex-1 justify-center active:opacity-100"
            >
              <View className="h-1 w-full overflow-hidden rounded-pill bg-night/15">
                {i === index ? (
                  // Re-keyed on every change so the fill starts from empty.
                  <Progress key={`on-${index}`} still={reducedMotion} />
                ) : (
                  <View className={cn('h-full rounded-pill bg-night', i < index ? 'w-full opacity-40' : 'w-0')} />
                )}
              </View>
            </Tappable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

/** One photograph, faded in and out rather than swapped. */
function SlidePhoto({ photo, shown, priority }: { photo: string; shown: boolean; priority: boolean }) {
  const opacity = useSharedValue(shown ? 1 : 0)
  useEffect(() => {
    opacity.value = withTiming(shown ? 1 : 0, { duration: 500, reduceMotion: ReduceMotion.System })
  }, [shown, opacity])
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return (
    <Animated.View pointerEvents="none" style={style} className="absolute inset-0">
      <Img
        src={photo}
        alt=""
        priority={priority ? 'high' : 'normal'}
        contentPosition={{ left: '68%', top: '50%' }}
        className="absolute inset-0"
      />
    </Animated.View>
  )
}

/** The bar on show, filling over the dwell time (the web's hero-progress keyframe). */
function Progress({ still }: { still: boolean }) {
  const fill = useSharedValue(still ? 1 : 0)
  useEffect(() => {
    if (still) {
      cancelAnimation(fill)
      fill.value = 1
      return
    }
    fill.value = 0
    fill.value = withTiming(1, { duration: DWELL_MS, easing: Easing.linear, reduceMotion: ReduceMotion.Never })
  }, [still, fill])
  const style = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }))
  return <Animated.View style={style} className="h-full rounded-pill bg-night" />
}

/** The plate at zero alpha, so the fade does not pass through grey. */
function clear(color: string): string {
  return /^#[0-9a-f]{6}$/i.test(color) ? `${color}00` : 'transparent'
}
