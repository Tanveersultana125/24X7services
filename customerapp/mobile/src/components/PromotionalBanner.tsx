import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ScrollView,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Animated, {
  Easing,
  ReduceMotion,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import type { Href } from 'expo-router'
import type { Banner, BannerTone } from '@app/shared'
import { usePrefersReducedMotion } from '@/components/ServiceClip'
import { useColor } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'

/**
 * The banner rail at the top of Home: swipeable, with dots, and advancing on
 * its own.
 *
 * A paging scroll view, so the platform provides the swipe, the momentum and
 * the snap. Autoplay stops the moment anyone touches it and does not come
 * back — a rail that keeps moving while someone is reading it is worse than one
 * that never moved.
 *
 * The dots stay inside the artwork rather than under it: below it they push
 * everything down by the height of their own tap targets, and that gap reads
 * as a mistake rather than as a control.
 */

export interface PromotionalBannerProps {
  banners: readonly Banner[]
  intervalMs?: number
  /**
   * Edge to edge under a header painted the slide's own colour — the way the
   * marketplaces open Home. The header and the slide never share a pixel, so
   * the words cannot collide; the colour just runs on from one into the other.
   */
  edgeToEdge?: boolean
  /** The tone of the slide in view, for the header above to match. */
  onToneChange?: (tone: BannerTone) => void
  className?: string
}

export function PromotionalBanner({
  banners,
  intervalMs = 5000,
  edgeToEdge = false,
  onToneChange,
  className,
}: PromotionalBannerProps) {
  const railRef = useRef<ScrollView>(null)
  const { width: windowWidth } = useWindowDimensions()
  const [measured, setMeasured] = useState(0)
  // The slide is exactly as wide as the rail; until the rail has been laid
  // out, the screen is the best guess (the rail runs edge to edge on Home).
  const width = measured || windowWidth
  const [active, setActive] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const reduced = usePrefersReducedMotion()

  // With more than one banner, the first is repeated after the last, so the
  // rail only ever moves forward: 1, 2, 3, then on into the copy of 1, which
  // is swapped for the real one without any motion once the rail comes to
  // rest there. Scrolling straight back to the start would run the whole rail
  // backwards past every slide in between.
  const looping = banners.length > 1

  const scrollTo = useCallback(
    (index: number, animated = true) => {
      railRef.current?.scrollTo({ x: index * width, animated })
    },
    [width]
  )

  // Track which slide is in view rather than assuming, since the customer can
  // swipe the rail themselves. Resting on the copy means resting on the first
  // slide, so jump there with no animation. The two look identical, so
  // nothing on screen changes.
  const onSettle = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = event.nativeEvent.contentOffset.x
      const index = Math.round(x / width)
      if (looping && index >= banners.length) {
        scrollTo(0, false)
        setActive(0)
        return
      }
      setActive(index % Math.max(banners.length, 1))
    },
    [banners.length, looping, scrollTo, width]
  )

  useEffect(() => {
    if (!autoplay || !looping || reduced) return

    // A story slide stays long enough to be told; the rest, the usual time.
    const dwell = banners[active]?.chips?.length ? STORY_MS : intervalMs
    const timer = setTimeout(() => {
      // From the last slide, on into the copy rather than back to the start.
      scrollTo(active + 1)
      setActive((active + 1) % banners.length)
    }, dwell)
    return () => clearTimeout(timer)
  }, [active, autoplay, banners, intervalMs, looping, reduced, scrollTo])

  // The rail's momentum end doesn't fire for a programmatic scroll on every
  // platform, so the swap from the copy back to the first slide is also done
  // once autoplay has landed on it.
  useEffect(() => {
    if (!looping || active !== 0) return
    const timer = setTimeout(() => scrollTo(0, false), 700)
    return () => clearTimeout(timer)
  }, [active, looping, scrollTo])

  const stopAutoplay = useCallback(() => setAutoplay(false), [])

  const tone = banners[active]?.tone
  useEffect(() => {
    if (tone) onToneChange?.(tone)
  }, [tone, onToneChange])

  if (banners.length === 0) return null

  return (
    <View
      accessibilityLabel="Offers and announcements"
      className={cn('relative', className)}
      onLayout={(event: LayoutChangeEvent) => setMeasured(Math.round(event.nativeEvent.layout.width))}
      onTouchStart={stopAutoplay}
    >
      <ScrollView
        ref={railRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={stopAutoplay}
        onMomentumScrollEnd={onSettle}
        scrollEventThrottle={16}
      >
        {banners.map((banner, index) => (
          <View
            key={banner.id}
            accessibilityLabel={`${index + 1} of ${banners.length}`}
            style={{ width }}
          >
            <BannerCard
              banner={banner}
              priority={index === 0}
              edgeToEdge={edgeToEdge}
              active={index === active}
              width={width}
            />
          </View>
        ))}
        {looping && banners[0] ? (
          // The copy of the first slide. Hidden from assistive tech: it is
          // there for the motion, not as a fourth offer.
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ width }}
          >
            <BannerCard banner={banners[0]} edgeToEdge={edgeToEdge} width={width} />
          </View>
        ) : null}
      </ScrollView>

      {banners.length > 1 ? (
        <View className={cn('absolute bottom-0 flex-row gap-1.5', edgeToEdge ? 'right-4' : 'right-2')}>
          {banners.map((banner, index) => (
            <Tappable
              key={banner.id}
              onPress={() => {
                stopAutoplay()
                scrollTo(index)
                setActive(index)
              }}
              accessibilityLabel={`Go to slide ${index + 1}`}
              accessibilityState={{ selected: index === active }}
              // 44px of tappable height around a 6px dot.
              className="h-11 w-4 items-center justify-center overflow-visible active:opacity-100"
            >
              {/* White over the artwork. A blue dot on a green banner is not a dot. */}
              <Dot on={index === active} />
            </Tappable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

/** A dot, stretching into a bar while its slide is the one in view. */
function Dot({ on }: { on: boolean }) {
  const progress = useSharedValue(on ? 1 : 0)
  useEffect(() => {
    progress.value = withTiming(on ? 1 : 0, { duration: 200, reduceMotion: ReduceMotion.System })
  }, [on, progress])
  const style = useAnimatedStyle(() => ({
    width: 6 + 14 * progress.value,
    opacity: 0.45 + 0.55 * progress.value,
  }))
  return <Animated.View style={style} className="h-1.5 rounded-full bg-white" />
}

/** How long a story slide stays: its chips, its answer, a moment to read. */
const STORY_MS = 8000

/**
 * Each tone's darkest colour, as a fixed value: the header over an
 * edge-to-edge banner is painted with it, and the slide's gradient starts from
 * exactly it, so the two read as one block. Fixed rather than tokens because
 * `brand-deep` lightens in the dark theme and the seam would show.
 */
export const TONE_TOP: Record<BannerTone, string> = {
  blue: '#1E3A8A',
  amber: '#3B1A05',
  green: '#08402F',
  teal: '#11293E',
  violet: '#0E0E22',
}

/**
 * The same gradients run top to bottom, from `TONE_TOP` down. Home paints them
 * behind the header and the banner together, as one block, not the card.
 *
 * The stops of a `LinearGradient` rather than the web's class string: a
 * gradient is not a className here.
 */
export const TONES_EDGE: Record<BannerTone, readonly [string, string, string]> = {
  blue: ['#1E3A8A', '#2547D0', '#4AA8DC'],
  amber: ['#3B1A05', '#8C4F10', '#E0952E'],
  green: ['#08402F', '#0B7A50', '#2FB483'],
  teal: ['#11293E', '#1E6E8C', '#5FC9E8'],
  violet: ['#0E0E22', '#2B2A6E', '#5A4ED0'],
}

/**
 * The five house gradients a card can be painted in, corner to corner.
 *
 * Content colour, not interface colour: brand blue means "this is tappable"
 * everywhere else in the app, and these mean nothing at all beyond telling one
 * offer apart from the next as it slides past. Blue starts from the brand's
 * own tokens, so it follows the theme the way the web card does.
 */
function useToneStops(tone: BannerTone): readonly [string, string, string] {
  const deep = useColor('text-brand-deep')
  const brand = useColor('text-brand')
  return tone === 'blue' ? [deep, brand, '#4AA8DC'] : TONES_EDGE[tone]
}

/** The card's own ground: a gradient corner to corner, rounded. */
function ToneGround({ tone }: { tone: BannerTone }) {
  const stops = useToneStops(tone)
  return (
    <LinearGradient
      colors={stops}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
    />
  )
}

// ---------------------------------------------------------------------------
// Motion — the web's keyframes, played with reanimated. Every timing carries
// ReduceMotion.System, so somebody who asked for less motion gets each one's
// end state straight away, exactly as the web's reduced-motion rule does.
// ---------------------------------------------------------------------------

const EASE = Easing.bezier(0.2, 0.7, 0.2, 1)
const SYSTEM = ReduceMotion.System

type Kind = 'word' | 'rise' | 'art' | 'node'

/**
 * A 0 → 1 progress that plays from the start each time `moving` turns on, and
 * sits at its end otherwise — an off-screen slide holds still, so arriving
 * again plays it again.
 */
function usePlay(moving: boolean, delayMs: number, durationMs: number, linear = false): SharedValue<number> {
  const progress = useSharedValue(moving ? 0 : 1)
  useEffect(() => {
    if (!moving) {
      progress.value = 1
      return
    }
    progress.value = 0
    progress.value = withDelay(
      delayMs,
      withTiming(1, { duration: durationMs, easing: linear ? Easing.linear : EASE, reduceMotion: SYSTEM }),
      SYSTEM
    )
  }, [moving, delayMs, durationMs, linear, progress])
  return progress
}

/**
 * One element of a slide, playing in:
 * `word` (banner-word) rises out of nothing, `rise` (banner-rise) comes up
 * 10px, `art` (banner-art-in) settles from a little smaller, `node`
 * (story-node) pops past its size and back.
 */
function Play({
  moving,
  kind,
  delay = 0,
  duration,
  className,
  style,
  children,
}: {
  moving: boolean
  kind: Kind
  /** Seconds, as the web's animation-delay. */
  delay?: number
  /** Milliseconds. */
  duration: number
  className?: string
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}) {
  const progress = usePlay(moving, Math.round(delay * 1000), duration)
  const animated = useAnimatedStyle(() => {
    const p = progress.value
    switch (kind) {
      case 'word':
        return { opacity: p, transform: [{ translateY: (1 - p) * 10 }] }
      case 'rise':
        return { opacity: p, transform: [{ translateY: (1 - p) * 10 }] }
      case 'art':
        return { opacity: p, transform: [{ translateY: (1 - p) * 8 }, { scale: 0.86 + 0.14 * p }] }
      case 'node':
        return {
          opacity: interpolate(p, [0, 0.7, 1], [0, 1, 1]),
          transform: [{ scale: interpolate(p, [0, 0.7, 1], [0.4, 1.12, 1]) }],
        }
    }
  })
  return (
    <Animated.View style={[style, animated]} className={className}>
      {children}
    </Animated.View>
  )
}

/** A headline that rises in word by word, read whole by a screen reader. */
function WordHeadline({
  title,
  moving,
  className,
  textClassName,
}: {
  title: string
  moving: boolean
  className?: string
  textClassName?: string
}) {
  const words = title.split(' ')
  if (!moving) {
    return (
      <Text accessibilityRole="header" className={cn('font-bold text-white', textClassName)}>
        {title}
      </Text>
    )
  }
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={title}
      className={cn('flex-row flex-wrap', className)}
      style={{ columnGap: 6 }}
    >
      {words.map((word, index) => (
        <Play key={`${word}-${index}`} moving={moving} kind="word" delay={index * 0.07} duration={620}>
          <Text className={cn('font-bold text-white', textClassName)}>{word}</Text>
        </Play>
      ))}
    </View>
  )
}

/** A soft band of light drifting across the ground, now and then. */
function Sheen({ width }: { width: number }) {
  const progress = useSharedValue(0)
  useEffect(() => {
    progress.value = 0
    progress.value = withDelay(
      1200,
      withRepeat(
        withTiming(1, { duration: 5500, easing: Easing.inOut(Easing.ease), reduceMotion: SYSTEM }),
        -1,
        false,
        undefined,
        SYSTEM
      ),
      SYSTEM
    )
  }, [progress])
  const band = width / 3
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: band * (-0.6 + 3.2 * progress.value) }, { skewX: '-18deg' }],
  }))
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, width: band }, style]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  )
}

/** The artwork's slow bob once it has settled. */
function Float({ moving, children }: { moving: boolean; children: React.ReactNode }) {
  const y = useSharedValue(0)
  useEffect(() => {
    y.value = 0
    if (!moving) return
    y.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(-7, { duration: 2250, easing: Easing.inOut(Easing.ease), reduceMotion: SYSTEM }),
          withTiming(0, { duration: 2250, easing: Easing.inOut(Easing.ease), reduceMotion: SYSTEM })
        ),
        -1,
        false,
        undefined,
        SYSTEM
      ),
      SYSTEM
    )
  }, [moving, y])
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }))
  return (
    <Animated.View style={[{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, style]}>
      {children}
    </Animated.View>
  )
}

/** The white pill with the call to action in brand blue. */
function CtaPill({ label }: { label: string }) {
  return (
    <View className="self-start rounded-pill bg-white px-4 py-2">
      <Text className="text-sm font-semibold text-royal">{label}</Text>
    </View>
  )
}

/**
 * One banner, as a card.
 *
 * Exported because the same card does a second job further down the page: a
 * banner seeded into the `inline` slot is dropped between two sections on its
 * own, which is what breaks a long run of near-identical service rails into
 * something with a shape.
 *
 * The words and the picture are two columns of a row, not two layers of a
 * stack, so they cannot overlap at any size. The ground under the text is one
 * of five gradients this file controls, and the seeded artwork is a subject on
 * transparency that never goes behind a word — so no scrim.
 *
 * Its height comes from its content and from whatever the rail stretches it to,
 * with a floor under it.
 */
export function BannerCard({
  banner,
  priority = false,
  edgeToEdge = false,
  active = false,
  width,
  className,
}: {
  banner: Banner
  priority?: boolean
  /** Square-cornered, no ground of its own (Home paints it), and shorter. */
  edgeToEdge?: boolean
  /**
   * The slide in view. Edge to edge, it plays in like footage each time it
   * arrives: the headline word by word, then the lines under it, the artwork
   * settling and floating, a light drifting across. Off-screen slides hold
   * still, so arriving again plays it again.
   */
  active?: boolean
  /** The slide's width, for the light drifting across it. */
  width?: number
  className?: string
}) {
  const { width: windowWidth } = useWindowDimensions()
  const slideWidth = width ?? windowWidth - 32
  const moving = edgeToEdge && active
  const words = banner.title.split(' ')
  // When the lines under the headline follow: once its last word is up.
  const after = (words.length * 70 + 120) / 1000

  const body =
    banner.chips?.length && banner.motion === 'steps' ? (
      <StepsBody banner={banner} steps={banner.chips} edgeToEdge={edgeToEdge} moving={moving} className={className} />
    ) : banner.chips?.length && banner.motion === 'spotlight' ? (
      <SpotlightBody
        banner={banner}
        points={banner.chips}
        edgeToEdge={edgeToEdge}
        moving={moving}
        priority={priority}
        className={className}
      />
    ) : banner.chips?.length ? (
      <StoryBody banner={banner} chips={banner.chips} edgeToEdge={edgeToEdge} moving={moving} className={className} />
    ) : banner.photo ? (
      <PhotoBody banner={banner} photo={banner.photo} priority={priority} className={className} />
    ) : (
      <View
        className={cn(
          'relative h-full min-h-52 flex-row gap-5 overflow-hidden rounded-card p-5',
          // No ground of its own edge to edge: Home paints one gradient
          // behind the header and this card together.
          edgeToEdge && 'min-h-48 rounded-none px-4 pb-7 pt-4',
          className
        )}
      >
        {edgeToEdge ? null : <ToneGround tone={banner.tone} />}
        {moving ? <Sheen width={slideWidth} /> : null}

        <View className="relative min-w-0 flex-1 justify-between gap-4">
          <View>
            {banner.badge ? (
              <Play moving={moving} kind="rise" duration={520} className="mb-2.5 self-start">
                <View className="rounded-pill bg-white/20 px-2.5 py-1">
                  <Text className="text-[11px] font-semibold uppercase tracking-[0.66px] text-white">
                    {banner.badge}
                  </Text>
                </View>
              </Play>
            ) : null}
            <WordHeadline
              title={banner.title}
              moving={moving}
              textClassName={edgeToEdge ? 'text-[22px] leading-[28px]' : 'text-xl leading-[28px]'}
            />
            {banner.subtitle ? (
              <Play moving={moving} kind="rise" delay={after} duration={520}>
                <Text numberOfLines={3} className="mt-1.5 text-sm text-white/80">
                  {banner.subtitle}
                </Text>
              </Play>
            ) : null}
          </View>

          {banner.ctaLabel ? (
            <Play moving={moving} kind="rise" delay={after + 0.14} duration={520}>
              <CtaPill label={banner.ctaLabel} />
            </Play>
          ) : null}
        </View>

        {banner.image ? (
          // Under a third, and a full gutter clear of the words.
          <Play moving={moving} kind="art" delay={0.15} duration={700} className="relative w-[30%] shrink-0">
            <Float moving={moving}>
              <Img src={banner.image} alt="" contentFit="contain" contentPosition="right" className="size-full" />
            </Float>
          </Play>
        ) : null}
      </View>
    )

  return banner.ctaHref ? (
    <Tappable href={banner.ctaHref as Href} accessibilityLabel={bannerLabel(banner)} className="h-full active:opacity-90">
      {body}
    </Tappable>
  ) : (
    body
  )
}

/** The whole banner read as one sentence, for the link around it. */
function bannerLabel(banner: Banner): string {
  return [
    [banner.title, banner.titleAfter].filter(Boolean).join(' '),
    banner.subtitle,
    banner.ctaLabel,
  ]
    .filter(Boolean)
    .join('. ')
}

/**
 * A banner that is a photograph: the words on the left, a technician at work
 * on the right, the column's inner edge fading into the card.
 *
 * `plate` and `night` rather than `bg` and `ink`: the photograph is a light
 * room in either theme, so the card stays light and its words stay dark.
 */
function PhotoBody({
  banner,
  photo,
  priority,
  className,
}: {
  banner: Banner
  photo: string
  priority: boolean
  className?: string
}) {
  const plate = useColor('text-plate')
  return (
    <View className={cn('relative h-full min-h-52 flex-row overflow-hidden rounded-card bg-plate p-5', className)}>
      <View className="absolute inset-y-0 right-0 w-[46%]">
        <Img
          src={photo}
          alt=""
          priority={priority ? 'high' : 'normal'}
          // The technician stands a little right of centre in every one of
          // these shots, with the appliance beyond them.
          contentPosition={{ left: '68%', top: '50%' }}
          className="absolute inset-0"
        />
        <LinearGradient
          colors={[plate, `${plate}00`]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '25%' }}
        />
      </View>

      <View className="relative w-[54%] min-w-0 justify-between gap-4 pr-2">
        <View>
          {banner.badge ? (
            <View className="mb-2.5 self-start rounded-pill bg-royal px-2.5 py-1">
              <Text className="text-[11px] font-semibold uppercase tracking-[0.66px] text-white">{banner.badge}</Text>
            </View>
          ) : null}
          <Text className="text-xl font-bold leading-[28px] text-night">{banner.title}</Text>
          {banner.subtitle ? (
            <Text numberOfLines={3} className="mt-1.5 text-sm text-night/70">
              {banner.subtitle}
            </Text>
          ) : null}
        </View>

        {banner.ctaLabel ? (
          <View className="self-start rounded-pill bg-royal px-4 py-2">
            <Text className="text-sm font-semibold text-white">{banner.ctaLabel}</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

/** The ground under a story banner: none edge to edge (Home paints it), the tone otherwise. */
function StoryGround({
  banner,
  edgeToEdge,
  className,
  children,
}: {
  banner: Banner
  edgeToEdge: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <View
      className={cn(
        'relative h-full min-h-52 overflow-hidden',
        edgeToEdge ? 'min-h-48 rounded-none' : 'rounded-card',
        className
      )}
    >
      {edgeToEdge ? null : <ToneGround tone={banner.tone} />}
      {children}
    </View>
  )
}

/**
 * Where each chip floats, as fractions of the slide: two bands, above and
 * below the headline's row, kept to the corners — the headline can run to two
 * lines — and the lower right one clear of the dots.
 */
const SPOTS: ViewStyle[] = [
  { left: '5%', top: '5%' },
  { right: '4%', top: '3%' },
  { left: '4%', bottom: '6%' },
  { right: '24%', bottom: '4%' },
  { left: '40%', top: '2%' },
  { left: '36%', bottom: '2%' },
]

/** Seconds: when the chips go and the answer arrives. */
const LEAVE = 3.6

/**
 * A banner told as a short story, the way the marketplaces open Home: the
 * problems float in around the middle as chips and drift there, the headline
 * rises in — "4 problems." — then the chips fade and the answer arrives beside
 * it — "1 visit." — with the way in under them.
 *
 * Played once each time the slide arrives, and held on its last frame.
 * Somebody who asked for less motion gets that last frame straight away.
 */
function StoryBody({
  banner,
  chips,
  edgeToEdge,
  moving,
  className,
}: {
  banner: Banner
  chips: readonly string[]
  edgeToEdge: boolean
  moving: boolean
  className?: string
}) {
  return (
    <StoryGround
      banner={banner}
      edgeToEdge={edgeToEdge}
      className={cn('items-center justify-center px-4 py-8', className)}
    >
      {/* Still, with no story to tell, the chips are not shown at all. */}
      {moving ? chips.map((chip, index) => <StoryChip key={chip} chip={chip} index={index} />) : null}

      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={[banner.title, banner.titleAfter].filter(Boolean).join(' ')}
        className="relative flex-row flex-wrap justify-center"
        style={{ columnGap: 8 }}
      >
        <Play moving={moving} kind="word" delay={0.5} duration={700}>
          <Text className="text-center text-[28px] font-bold leading-[34px] text-white/90">{banner.title}</Text>
        </Play>
        {banner.titleAfter ? (
          <Play moving={moving} kind="word" delay={LEAVE + 0.3} duration={700}>
            <Text className="text-center text-[28px] font-bold leading-[34px] text-white">{banner.titleAfter}</Text>
          </Play>
        ) : null}
      </View>

      {banner.ctaLabel ? (
        <Play moving={moving} kind="rise" delay={LEAVE + 0.9} duration={520} className="relative mt-3">
          <Text className="text-base font-semibold text-white/75">
            {banner.ctaLabel}
            {'  →'}
          </Text>
        </Play>
      ) : null}
    </StoryGround>
  )
}

/** One problem, floating in, drifting while it is read, then fading. */
function StoryChip({ chip, index }: { chip: string; index: number }) {
  // 0 → 1 is arriving (story-chip-in), 1 → 2 is leaving (story-chip-out).
  const phase = useSharedValue(0)
  const drift = useSharedValue(0)

  useEffect(() => {
    const inAt = (0.15 + index * 0.35) * 1000
    const outAt = (LEAVE + index * 0.08) * 1000
    phase.value = 0
    phase.value = withSequence(
      withDelay(inAt, withTiming(1, { duration: 600, easing: EASE, reduceMotion: SYSTEM }), SYSTEM),
      withDelay(
        Math.max(0, outAt - inAt - 600),
        withTiming(2, { duration: 500, easing: Easing.in(Easing.ease), reduceMotion: SYSTEM }),
        SYSTEM
      )
    )
    drift.value = 0
    drift.value = withDelay(
      (0.8 + index * 0.35) * 1000,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 1600, easing: Easing.inOut(Easing.ease), reduceMotion: SYSTEM }),
          withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease), reduceMotion: SYSTEM })
        ),
        -1,
        false,
        undefined,
        SYSTEM
      ),
      SYSTEM
    )
  }, [index, phase, drift])

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(phase.value, [0, 1, 2], [0, 1, 0]),
    transform: [
      { translateY: drift.value },
      { scale: interpolate(phase.value, [0, 1, 2], [0.82, 1, 0.92]) },
    ],
  }))

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ position: 'absolute' }, SPOTS[index % SPOTS.length], style]}
      className="rounded-pill border border-white/30 bg-white/10 px-3 py-1.5"
    >
      <Text numberOfLines={1} className="text-sm font-medium text-white">
        {chip}
      </Text>
    </Animated.View>
  )
}

/**
 * A story banner told as a line of steps: the headline, then the steps in a
 * row joined by a line that fills from the first to the last, each step's
 * dot popping in with a tick as the line reaches it. For a promise that is
 * an order of events: inspect, quote, your yes, then repair.
 */
function StepsBody({
  banner,
  steps,
  edgeToEdge,
  moving,
  className,
}: {
  banner: Banner
  steps: readonly string[]
  edgeToEdge: boolean
  moving: boolean
  className?: string
}) {
  const title = [banner.title, banner.titleAfter].filter(Boolean).join(' ')
  const start = title.split(' ').length * 0.07 + 0.35 // the line starts once the headline is up
  const each = 0.55 // seconds the line takes from one step to the next
  const last = steps.length - 1
  // The rail runs between the first and the last dot: half a column in from each side.
  const inset = `${50 / steps.length}%` as const

  return (
    <StoryGround banner={banner} edgeToEdge={edgeToEdge} className={cn('justify-center px-4 py-5', className)}>
      <WordHeadline title={title} moving={moving} textClassName="text-[22px] leading-[28px]" />

      <View className="relative mt-4 flex-row">
        <View
          aria-hidden
          className="absolute top-3 h-0.5 rounded-pill bg-white/25"
          style={{ left: inset, right: inset }}
        />
        <StepsLine moving={moving} start={start} duration={each * last} inset={inset} />
        {steps.map((step, index) => (
          <View key={step} className="relative min-w-0 flex-1 items-center">
            <Play
              moving={moving}
              kind="node"
              delay={start + index * each}
              duration={420}
              className="size-6 items-center justify-center rounded-full bg-white"
            >
              <Text className="text-xs font-bold" style={{ color: TONE_TOP[banner.tone] }}>
                ✓
              </Text>
            </Play>
            <Play moving={moving} kind="rise" delay={start + index * each + 0.1} duration={420}>
              <Text className="mt-2 text-center text-xs font-medium leading-[15px] text-white/90">{step}</Text>
            </Play>
          </View>
        ))}
      </View>

      {banner.ctaLabel ? (
        <Play moving={moving} kind="rise" delay={start + last * each + 0.5} duration={520} className="mt-4 self-start">
          <CtaPill label={banner.ctaLabel} />
        </Play>
      ) : null}
    </StoryGround>
  )
}

/** The white line between the steps, filling left to right (story-line). */
function StepsLine({
  moving,
  start,
  duration,
  inset,
}: {
  moving: boolean
  start: number
  duration: number
  inset: `${number}%`
}) {
  const progress = usePlay(moving, Math.round(start * 1000), Math.round(duration * 1000), true)
  const style = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }))
  return (
    <View aria-hidden className="absolute top-3 h-0.5" style={{ left: inset, right: inset }}>
      <Animated.View style={style} className="h-0.5 rounded-pill bg-white" />
    </View>
  )
}

/**
 * A story banner told as a spotlight: the headline word by word on the left
 * with its points ticked in under it one at a time, and the artwork on the
 * right settling in while rings of light pulse out from behind it. For a
 * promise that is a thing you get: every repair, under warranty.
 */
function SpotlightBody({
  banner,
  points,
  edgeToEdge,
  moving,
  priority,
  className,
}: {
  banner: Banner
  points: readonly string[]
  edgeToEdge: boolean
  moving: boolean
  priority: boolean
  className?: string
}) {
  const title = [banner.title, banner.titleAfter].filter(Boolean).join(' ')
  const after = title.split(' ').length * 0.07 + 0.25
  // Three at most: a fourth line makes this slide, and so the whole rail,
  // taller than the others need to be.
  const shown = points.slice(0, 3)

  return (
    <StoryGround
      banner={banner}
      edgeToEdge={edgeToEdge}
      className={cn('flex-row items-center gap-3 px-4 py-5', className)}
    >
      <View className="relative min-w-0 flex-1">
        <WordHeadline title={title} moving={moving} textClassName="text-[22px] leading-[28px]" />
        <View className="mt-2.5 gap-1">
          {shown.map((point, index) => (
            <Play
              key={point}
              moving={moving}
              kind="rise"
              delay={after + index * 0.32}
              duration={480}
              className="flex-row items-center gap-2"
            >
              <View className="size-4 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Text className="text-[10px] leading-[12px] text-white">✓</Text>
              </View>
              <Text className="text-sm text-white/90">{point}</Text>
            </Play>
          ))}
        </View>
        {banner.ctaLabel ? (
          <Play
            moving={moving}
            kind="rise"
            delay={after + shown.length * 0.32 + 0.2}
            duration={520}
            className="mt-3.5 self-start"
          >
            <CtaPill label={banner.ctaLabel} />
          </Play>
        ) : null}
      </View>

      {banner.image ? (
        <View className="relative aspect-square w-[32%] shrink-0">
          {moving ? [0, 1, 2].map((ring) => <Ring key={ring} delay={0.6 + ring * 0.9} />) : null}
          <Play moving={moving} kind="art" delay={0.2} duration={700} className="absolute inset-[12%]">
            <Img
              src={banner.image}
              alt=""
              contentFit="contain"
              priority={priority ? 'high' : 'normal'}
              className="size-full"
            />
          </Play>
        </View>
      ) : null}
    </StoryGround>
  )
}

/** A ring of light pulsing out from behind the artwork (story-ring). */
function Ring({ delay }: { delay: number }) {
  // -1 is "not started": hidden, as the web's opacity-0 before the delay.
  const progress = useSharedValue(-1)
  useEffect(() => {
    progress.value = -1
    progress.value = withDelay(
      delay * 1000,
      withSequence(
        withTiming(0, { duration: 0 }),
        withRepeat(
          withTiming(1, { duration: 2700, easing: Easing.out(Easing.ease), reduceMotion: SYSTEM }),
          -1,
          false,
          undefined,
          SYSTEM
        )
      ),
      SYSTEM
    )
  }, [delay, progress])
  const style = useAnimatedStyle(() => {
    const p = progress.value
    if (p < 0) return { opacity: 0 }
    return { opacity: 0.55 * (1 - p), transform: [{ scale: 0.55 + 0.95 * p }] }
  })
  return (
    <Animated.View
      aria-hidden
      style={style}
      className="absolute inset-0 rounded-full border-2 border-white/40"
    />
  )
}
