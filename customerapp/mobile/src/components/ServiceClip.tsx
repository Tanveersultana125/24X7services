import { useCallback, useEffect, useState } from 'react'
import { AccessibilityInfo, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video'
import { cn } from '@/lib/cn'
import { isProductShot } from '@/lib/photoFit'
import { publicAsset } from '@/lib/publicAsset'
import { Img } from '@/components/ui/Img'

/**
 * A short clip of the work, or a still of it, in a box the caller shapes.
 *
 * Four screens show the same thing now — the card on an appliance page, the
 * rails on Home, the tiles on All services, the row in a search result — and
 * each of them had, or would have had, its own copy of the same three rules:
 * play only what is on screen, never play for somebody who asked their system
 * for less motion, and fall back to a still that is a frame of the clip rather
 * than a picture of something else. One copy, here.
 *
 * The clip is muted, looping and inline, and it is never the thing carrying
 * the meaning: everything the clip shows is also said in words beside it.
 *
 * Playback runs while the screen holding the box is the one in front, and
 * stops when another screen is pushed over it. The web app watches each box
 * scroll in and out; here a screen of clips is a handful, and the player is
 * released with the box.
 *
 * The clip is drawn with `expo-video` and no controls. The still sits under it
 * and the video stays transparent until its first frame lands, so the box is
 * never blank while it decodes.
 */

export interface ServiceClipProps {
  /** The clip. Absent for a service nobody has drawn one for. */
  video?: string
  /**
   * What stands in before a frame decodes, for good on a connection that never
   * gets one, and instead of the clip under reduced motion.
   */
  still?: string
  /**
   * Whether `still` is a frame of the clip.
   *
   * A frame fills the box the way the clip does. An appliance drawing is a
   * drawing on a plate and needs the room around it, so it is contained and
   * padded instead — pass `false` and the padding in `containClassName`.
   */
  cover?: boolean
  /**
   * Whether this box may play at all. On by default; playback still waits for
   * the screen to be in front.
   */
  motion?: boolean
  /** Kept for parity with the web component (`next/image` sizes); unused here. */
  sizes?: string
  /** Fetch the still straight away — for the boxes above the fold, and no others. */
  priority?: boolean
  /** Padding for a contained drawing, e.g. `p-6`. Ignored when `cover`. */
  containClassName?: string
  /** The box: its aspect, its width, its corners. */
  className?: string
}

export function ServiceClip({
  video,
  still,
  cover = true,
  motion = true,
  priority = false,
  containClassName,
  className,
}: ServiceClipProps) {
  const reducedMotion = usePrefersReducedMotion()
  const source = video ? (publicAsset(video) as VideoSource | undefined) : undefined
  const plays = motion && source !== undefined && !reducedMotion

  return (
    <View className={cn('relative overflow-hidden bg-plate', className)}>
      {still ? (
        !cover ? (
          <View className={cn('absolute inset-0', containClassName)}>
            <Img src={still} alt="" contentFit="contain" priority={priority ? 'high' : 'normal'} className="size-full" />
          </View>
        ) : isProductShot(still) ? (
          // Whole, with room to breathe; see `isProductShot`. The brightness
          // lifts a sweep shot at 247 up to true white, so multiplying it
          // leaves no faint grey box behind.
          <View
            className="absolute inset-0"
            style={{ padding: '8%', mixBlendMode: 'multiply', filter: [{ brightness: 1.035 }] }}
          >
            <Img
              src={still}
              alt=""
              contentFit="contain"
              priority={priority ? 'high' : 'normal'}
              className="size-full"
            />
          </View>
        ) : (
          <Img src={still} alt="" priority={priority ? 'high' : 'normal'} className="absolute inset-0" />
        )
      ) : null}
      {plays ? <Clip source={source} /> : null}
    </View>
  )
}

/** The playing clip over the still: transparent until the first frame lands. */
function Clip({ source }: { source: VideoSource }) {
  const [shown, setShown] = useState(false)
  const player = useVideoPlayer(source, (p) => {
    p.muted = true
    p.loop = true
  })

  // Plays while this screen is in front, pauses while another covers it.
  useFocusEffect(
    useCallback(() => {
      try {
        player.play()
      } catch {
        // Declined (a background app, a battery policy): the still stays.
      }
      return () => {
        try {
          player.pause()
        } catch {
          // Already released with the box.
        }
      }
    }, [player])
  )

  return (
    <VideoView
      player={player}
      nativeControls={false}
      contentFit="cover"
      allowsPictureInPicture={false}
      onFirstFrameRender={() => setShown(true)}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: shown ? 1 : 0 }}
    />
  )
}

/**
 * Whether the customer has asked their system for less movement.
 *
 * Read once and then followed: it is a setting someone can change while the
 * app is open. False until the first answer, so the common case renders
 * straight away and only a customer who asked for less motion sees anything
 * swap.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    let live = true
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (live) setReduced(value)
      })
      .catch(() => {})
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    return () => {
      live = false
      subscription.remove()
    }
  }, [])
  return reduced
}
