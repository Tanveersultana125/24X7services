import { useEffect } from 'react'
import { ScrollView, View, useWindowDimensions } from 'react-native'
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import type { Href } from 'expo-router'
import { ServiceClip } from '@/components/ServiceClip'
import { Img } from '@/components/ui/Img'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'

/**
 * Home's row of tall reel cards, midway down the page — the shape the
 * marketplaces use: a real room, moving, with a title laid over its foot and
 * nothing written underneath. The service name is the only text; no price —
 * the card is there to draw the eye, and the price is one tap away.
 *
 * Each card plays real footage of the appliance at home — muted, looping, and
 * only while the screen is in front, like every clip in the app. The footage
 * is stock (see `public/reels/CREDITS.md`) until this business shoots its own.
 * A card without a clip falls back to a photograph of the appliance in a room,
 * drifting slowly in and across so it still reads as a shot.
 *
 * The words are text over the picture, not burned into it: crisp at any size,
 * readable by a screen reader, and changed without re-rendering anything.
 */

export interface ReelItem {
  id: string
  /** The room: a photograph of the appliance in use, never a product cut-out. */
  photo: string
  /** Real footage, when there is some; plays in place of the drift. */
  video?: string
  /** An optional pill over the title — "New", say. Never a price. */
  tag?: string
  title: string
  href: Href
}

/**
 * The four slow camera moves (reel-drift-a … d): a scale and a shift, from
 * and to, as fractions of the card.
 */
const DRIFTS = [
  { from: [1.04, 0, 0], to: [1.18, -0.04, -0.03] },
  { from: [1.18, 0.04, 0], to: [1.04, -0.02, -0.02] },
  { from: [1.06, 0.03, 0.03], to: [1.2, -0.03, 0] },
  { from: [1.2, -0.03, -0.03], to: [1.05, 0.02, 0.02] },
] as const

/** The scrim, `night` at 85% / 35% / clear, over the lower three fifths. */
const SCRIM = ['rgba(23,21,15,0.85)', 'rgba(23,21,15,0.35)', 'rgba(23,21,15,0)'] as const

export function VideoRail({ items, className }: { items: readonly ReelItem[]; className?: string }) {
  const { width } = useWindowDimensions()
  if (items.length === 0) return null
  // 42% of the page column: two and a bit cards across.
  const card = Math.round((width - 32) * 0.42)

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={card + 12}
      decelerationRate="fast"
      className={cn('-mx-4 -my-1', className)}
      contentContainerClassName="gap-3 px-4 py-1"
    >
      {items.map((item, index) => (
        <View key={item.id} style={{ width: card }}>
          <Tappable
            href={item.href}
            accessibilityLabel={item.tag ? `${item.title}, ${item.tag}` : item.title}
            className="aspect-[9/16] w-full overflow-hidden rounded-card bg-night active:opacity-90"
          >
            {item.video ? (
              <ServiceClip video={item.video} still={item.photo} className="absolute inset-0" />
            ) : (
              <DriftingPhoto photo={item.photo} index={index} width={card} />
            )}

            {/* Dark enough at the foot to carry white text over a bright
                kitchen, clear by the middle so the room still shows. */}
            <LinearGradient
              colors={SCRIM}
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }}
            />

            <View className="absolute inset-x-0 bottom-0 items-start gap-2 p-3">
              {item.tag ? (
                <View className="rounded-pill border border-white/40 bg-white/20 px-2.5 py-1">
                  <Text className="text-[11px] font-semibold text-white">{item.tag}</Text>
                </View>
              ) : null}
              <Text className="text-base font-bold leading-[20px] text-white">{item.title}</Text>
            </View>
          </Tappable>
        </View>
      ))}
    </ScrollView>
  )
}

/**
 * A still that drifts slowly in and across, so it reads as a shot. Each card
 * takes its own move and its own length, started part-way through so the row
 * is never in step.
 */
function DriftingPhoto({ photo, index, width }: { photo: string; index: number; width: number }) {
  const drift = DRIFTS[index % DRIFTS.length] ?? DRIFTS[0]
  const duration = (11 + (index % 3) * 2) * 1000
  const height = (width * 16) / 9
  const progress = useSharedValue(0)

  useEffect(() => {
    // The web's negative delay: the move is already this far along.
    const phase = ((index * 1.7 * 1000) % duration) / duration
    const ease = Easing.inOut(Easing.ease)
    progress.value = phase
    progress.value = withSequence(
      withTiming(1, { duration: (1 - phase) * duration, easing: ease, reduceMotion: ReduceMotion.System }),
      withRepeat(
        withTiming(0, { duration, easing: ease, reduceMotion: ReduceMotion.System }),
        -1,
        true,
        undefined,
        ReduceMotion.System
      )
    )
  }, [duration, index, progress])

  const style = useAnimatedStyle(() => {
    const p = progress.value
    const scale = drift.from[0] + (drift.to[0] - drift.from[0]) * p
    const x = (drift.from[1] + (drift.to[1] - drift.from[1]) * p) * width
    const y = (drift.from[2] + (drift.to[2] - drift.from[2]) * p) * height
    return { transform: [{ scale }, { translateX: x }, { translateY: y }] }
  })

  return (
    <Animated.View style={[{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, style]}>
      <Img src={photo} alt="" className="size-full" />
    </Animated.View>
  )
}
