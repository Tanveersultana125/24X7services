'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/cn'

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
 * The clip is muted, looping and inline, because that is the only shape a
 * browser will play unasked, and it is never the thing carrying the meaning:
 * everything the clip shows is also said in words beside it.
 *
 * Playback waits for the box to come on screen and stops again when it leaves.
 * `autoplay` would be one attribute instead of a hook, and it starts the
 * download and the decoder whether or not the box has ever been seen — which
 * on a page of six cards, or a rail of six that scrolls sideways, is six
 * downloads for the two the customer is looking at. Watching instead keeps a
 * page of clips to the handful actually on screen.
 *
 * `play()` returns a promise that rejects when the browser declines — a tab in
 * the background, a battery-saver policy. That is the browser doing its job,
 * not an error to report, so the rejection is swallowed and the still stays.
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
   * Whether this box may play at all. On by default; it is not a licence to
   * play immediately — playback still waits for the box to be on screen.
   */
  motion?: boolean
  /** `next/image` sizes for the still. Required: a wrong one is wasted bytes. */
  sizes: string
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
  sizes,
  priority = false,
  containClassName,
  className,
}: ServiceClipProps) {
  const reducedMotion = usePrefersReducedMotion()
  const plays = motion && Boolean(video) && !reducedMotion
  const ref = useVisiblePlayback(video, reducedMotion)

  return (
    <span
      className={cn('relative block overflow-hidden bg-surface', className)}
    >
      {plays ? (
        <video
          ref={ref}
          poster={still}
          src={video}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="size-full object-cover"
        />
      ) : still ? (
        <Image
          src={still}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className={
            cover ? 'object-cover' : cn('object-contain', containClassName)
          }
        />
      ) : null}
    </span>
  )
}

/** Play the clip while its box is on screen, and pause it the rest of the time. */
function useVisiblePlayback(
  src: string | undefined,
  reducedMotion: boolean
): React.RefObject<HTMLVideoElement | null> {
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[entries.length - 1]?.isIntersecting
        if (visible === undefined) return
        if (visible) void el.play().catch(() => {})
        else el.pause()
      },
      // A screen-height early, so a clip that is scrolled to is already moving
      // rather than starting from its first frame on arrival.
      { rootMargin: '100% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [src, reducedMotion])

  return ref
}

/**
 * Whether the customer has asked their system for less movement.
 *
 * An external store rather than state in an effect, the same shape auth and
 * location use here: the media query already lives outside React and already
 * pushes changes, so subscribing to it is the whole job. It is also a setting
 * someone can change while the app is open, and the server snapshot has to be
 * a definite value — false, so the prerender matches the common case and only
 * a customer who asked for less motion sees anything swap.
 */
const MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(MOTION_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false
  )
}
