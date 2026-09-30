'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/cn'
import { isProductShot } from '@/lib/photoFit'

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
 *
 * The clip is painted onto a canvas; the <video> that decodes it is never put
 * in the page. Samsung Internet pins its own download and "video assistant"
 * buttons over any <video> that plays, `controlsList` or not, and on a card
 * those read as part of the picture. A canvas is not a video to any browser,
 * so there is nothing for it to decorate.
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
  const ref = useVisiblePlayback(plays ? video : undefined)

  return (
    <span
      className={cn('relative block overflow-hidden bg-plate', className)}
    >
      {still ? (
        <Image
          src={still}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className={
            !cover
              ? cn('object-contain', containClassName)
              : isProductShot(still)
                ? // Whole, with room to breathe; see `isProductShot`. The
                  // brightness lifts a sweep shot at 247 up to true white, so
                  // multiplying it leaves no faint grey box behind.
                  'object-contain p-[8%] mix-blend-multiply brightness-[1.035]'
                : 'object-cover'
          }
        />
      ) : null}
      {plays ? (
        // Transparent until the first frame lands, so the still shows through
        // instead of a blank box.
        <canvas
          ref={ref}
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover opacity-0"
        />
      ) : null}
    </span>
  )
}

/**
 * Play the clip onto the canvas while its box is on screen, and pause it the
 * rest of the time.
 */
function useVisiblePlayback(
  src: string | undefined
): React.RefObject<HTMLCanvasElement | null> {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context || !src) return

    const clip = document.createElement('video')
    clip.muted = true
    clip.loop = true
    clip.playsInline = true
    clip.preload = 'metadata'
    clip.src = src

    let frame = 0
    let running = false
    // Whether the box is on screen now. `play()` settles later, by which time
    // the box may have left again.
    let onScreen = false
    const paint = () => {
      if (!running) return
      if (clip.videoWidth) {
        if (canvas.width !== clip.videoWidth) {
          canvas.width = clip.videoWidth
          canvas.height = clip.videoHeight
        }
        context.drawImage(clip, 0, 0)
        canvas.style.opacity = '1'
      }
      frame = requestAnimationFrame(paint)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(frame)
      clip.pause()
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[entries.length - 1]?.isIntersecting
        if (visible === undefined) return
        onScreen = visible
        if (!visible) return stop()
        clip
          .play()
          .then(() => {
            if (!onScreen) return clip.pause()
            if (running) return
            running = true
            frame = requestAnimationFrame(paint)
          })
          .catch(() => {})
      },
      // A screen-height early, so a clip that is scrolled to is already moving
      // rather than starting from its first frame on arrival.
      { rootMargin: '100% 0px' }
    )
    observer.observe(canvas)

    return () => {
      observer.disconnect()
      stop()
      // Let go of the connection and the decoder, not just the frames.
      clip.removeAttribute('src')
      clip.load()
    }
  }, [src])

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
