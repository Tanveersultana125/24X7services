'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import type { Banner, BannerTone } from '@app/shared'
import { cn } from '@/lib/cn'

/**
 * The banner rail at the top of Home: swipeable, with dots, and advancing on
 * its own.
 *
 * It is a scroll container rather than a transform carousel, so the platform
 * provides the swipe, the momentum and the snap, and a keyboard user gets arrow
 * keys for free. Autoplay stops the moment anyone touches it and does not come
 * back — a rail that keeps moving while someone is reading it is worse than one
 * that never moved.
 *
 * One at a time, as a rounded card inset under the header on every screen
 * size. It used to run edge to edge from the very top of the phone with the
 * header floating over its upper third, which put the header's words over the
 * banner's words the moment the page moved. Under a solid header it cannot:
 * the two never share a pixel.
 *
 * The dots stay inside the artwork rather than under it: below it they push
 * everything down by the height of their own tap targets, and that gap reads
 * as a mistake rather than as a control.
 */

export interface PromotionalBannerProps {
  banners: readonly Banner[]
  intervalMs?: number
  /**
   * Edge to edge under a header painted the slide's own colour, on a phone —
   * the way the marketplaces open Home. The header and the slide never share a
   * pixel, so the words cannot collide; the colour just runs on from one into
   * the other. A rounded card again from a laptop up.
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
  const railRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [autoplay, setAutoplay] = useState(true)

  // With more than one banner, the first is repeated after the last, so the
  // rail only ever moves forward: 1, 2, 3, then on into the copy of 1, which
  // is swapped for the real one without any motion once the rail comes to
  // rest there. Scrolling straight back to the start would run the whole rail
  // backwards past every slide in between.
  const looping = banners.length > 1

  const scrollTo = useCallback((index: number) => {
    const rail = railRef.current
    const slide = rail?.children[index]
    if (!rail || !(slide instanceof HTMLElement)) return
    rail.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' })
  }, [])

  // Track which slide is in view rather than assuming, since the customer can
  // scroll the rail themselves and land between two. The copy counts as the
  // first slide, so the dots move on to the first as it slides in.
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = Array.prototype.indexOf.call(rail.children, entry.target)
          if (index >= 0) setActive(index % banners.length)
        }
      },
      { root: rail, threshold: 0.6 }
    )

    for (const child of Array.from(rail.children)) observer.observe(child)
    return () => observer.disconnect()
  }, [banners.length])

  // Resting on the copy — by autoplay or by a swipe — means resting on the
  // first slide, so jump there with no animation. The two look identical, so
  // nothing on screen changes.
  useEffect(() => {
    const rail = railRef.current
    if (!rail || !looping) return

    let settle: ReturnType<typeof setTimeout> | undefined
    function onScroll(): void {
      clearTimeout(settle)
      settle = setTimeout(() => {
        const copy = rail?.children[banners.length]
        if (!rail || !(copy instanceof HTMLElement)) return
        if (rail.scrollLeft >= copy.offsetLeft - 2) {
          rail.scrollTo({ left: 0, behavior: 'instant' })
        }
      }, 120)
    }

    rail.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(settle)
      rail.removeEventListener('scroll', onScroll)
    }
  }, [banners.length, looping])

  useEffect(() => {
    if (!autoplay || !looping) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    // A story slide stays long enough to be told; the rest, the usual time.
    const dwell = banners[active]?.chips?.length ? STORY_MS : intervalMs
    const timer = setTimeout(() => {
      // From the last slide, on into the copy rather than back to the start.
      scrollTo(active + 1)
      setActive((active + 1) % banners.length)
    }, dwell)
    return () => clearTimeout(timer)
  }, [active, autoplay, banners, intervalMs, looping, scrollTo])

  const stopAutoplay = useCallback(() => setAutoplay(false), [])

  const tone = banners[active]?.tone
  useEffect(() => {
    if (tone) onToneChange?.(tone)
  }, [tone, onToneChange])

  if (banners.length === 0) return null

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Offers and announcements"
      className={cn('relative', className)}
      onPointerDown={stopAutoplay}
      onKeyDown={stopAutoplay}
      onFocus={stopAutoplay}
    >
      <div
        ref={railRef}
        className={cn(
          'no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth',
          edgeToEdge ? 'gap-0 lg:-my-1 lg:gap-3 lg:py-1' : '-my-1 gap-3 py-1'
        )}
      >
        {banners.map((banner, index) => (
          <article
            key={banner.id}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${banners.length}`}
            className="w-full shrink-0 snap-start"
          >
            <BannerCard
              banner={banner}
              priority={index === 0}
              edgeToEdge={edgeToEdge}
              active={index === active}
            />
          </article>
        ))}
        {looping && banners[0] ? (
          // The copy of the first slide. Hidden from assistive tech and out of
          // the tab order: it is there for the motion, not as a fourth offer.
          <article aria-hidden="true" inert className="w-full shrink-0 snap-start">
            <BannerCard banner={banners[0]} edgeToEdge={edgeToEdge} />
          </article>
        ) : null}
      </div>

      {banners.length > 1 ? (
        <div
          className={cn(
            'absolute bottom-0 flex gap-1.5 lg:static lg:-mb-3 lg:justify-center',
            edgeToEdge ? 'right-4' : 'right-2'
          )}
        >
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => {
                stopAutoplay()
                scrollTo(index)
              }}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === active ? 'true' : undefined}
              // 44px of tappable height around a 6px dot.
              className="flex h-11 w-4 items-center justify-center"
            >
              {/* White over the artwork; brand blue once the dots drop onto the
                  page below it on a desktop. A blue dot on a green banner is
                  not a dot. */}
              <span
                className={cn(
                  'h-1.5 rounded-full transition-all duration-[var(--duration-base)]',
                  index === active
                    ? 'w-5 bg-white lg:bg-brand'
                    : 'w-1.5 bg-white/45 lg:bg-border'
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}

/**
 * The five house gradients a banner can be painted in.
 *
 * Content colour, not interface colour: brand blue means "this is tappable"
 * everywhere else in the app, and these mean nothing at all beyond telling one
 * offer apart from the next as it slides past. They live here rather than in
 * the token block for exactly that reason, and nothing outside a banner may
 * reach for them.
 *
 * Every one of them starts dark enough at the top left to carry white text at
 * well over AA, which is what lets the card go without a scrim.
 */
/** How long a story slide stays: its chips, its answer, a moment to read. */
const STORY_MS = 8000

/** The lines under a banner's headline, rising in after it. */
const RISE =
  'motion-safe:animate-[banner-rise_520ms_cubic-bezier(0.2,0.7,0.2,1)_both]'

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
 * The same gradients run top to bottom, from `TONE_TOP` down. On a phone they
 * are painted by Home behind the header and the banner together, as one
 * block, not by the card.
 */
export const TONES_EDGE: Record<BannerTone, string> = {
  blue: 'from-[#1E3A8A] via-[#2547D0] to-[#4AA8DC]',
  amber: 'from-[#3B1A05] via-[#8C4F10] to-[#E0952E]',
  green: 'from-[#08402F] via-[#0B7A50] to-[#2FB483]',
  teal: 'from-[#11293E] via-[#1E6E8C] to-[#5FC9E8]',
  violet: 'from-[#0E0E22] via-[#2B2A6E] to-[#5A4ED0]',
}

const TONES: Record<BannerTone, string> = {
  blue: 'from-brand-deep via-brand to-[#4AA8DC]',
  amber: 'from-[#3B1A05] via-[#8C4F10] to-[#E0952E]',
  green: 'from-[#08402F] via-[#0B7A50] to-[#2FB483]',
  teal: 'from-[#11293E] via-[#1E6E8C] to-[#5FC9E8]',
  violet: 'from-[#0E0E22] via-[#2B2A6E] to-[#5A4ED0]',
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
 * stack. They used to be layered: a full-bleed image with the subject painted
 * into one corner of it, and the text capped at a width chosen to miss that
 * corner. Which corner the subject lands in after `object-cover` depends on the
 * card's aspect ratio, and the card is nearly square on a phone and a long
 * strip on a desktop — so the width that cleared it on one screen put a shield
 * through the middle of a headline on the next. As a row they cannot overlap at
 * any size, because neither one is allowed into the other's column.
 *
 * That also retires the scrim. It was there because white text over a seeded
 * photograph is a contrast failure waiting for the first pale image; now the
 * ground under the text is one of five gradients this file controls, and the
 * seeded artwork is a subject on transparency that never goes behind a word.
 *
 * Its height comes from its content and from whatever the rail stretches it to,
 * with a floor under it. A fixed height fits the shortest banner somebody seeds
 * and cuts the longest one off above its own button; no floor at all leaves a
 * one-line banner as a strip too thin to carry a picture.
 */
export function BannerCard({
  banner,
  priority = false,
  edgeToEdge = false,
  active = false,
  className,
}: {
  banner: Banner
  priority?: boolean
  /** Square-cornered, a top-to-bottom gradient, and taller — see the rail. */
  edgeToEdge?: boolean
  /**
   * The slide in view. Edge to edge, it plays in like footage each time it
   * arrives: the headline word by word, then the lines under it, the artwork
   * settling and floating, a light drifting across. Off-screen slides hold
   * still, so arriving again plays it again.
   */
  active?: boolean
  className?: string
}) {
  const moving = edgeToEdge && active
  const words = banner.title.split(' ')
  // When the lines under the headline follow: once its last word is up.
  const after = words.length * 70 + 120

  const body = banner.chips?.length ? (
    <StoryBody
      banner={banner}
      chips={banner.chips}
      edgeToEdge={edgeToEdge}
      moving={moving}
      className={className}
    />
  ) : banner.photo ? (
    <PhotoBody
      banner={banner}
      photo={banner.photo}
      priority={priority}
      className={className}
    />
  ) : (
    <div
      className={cn(
        'relative flex h-full min-h-52 gap-5 overflow-hidden rounded-card p-5 text-white sm:min-h-56',
        !edgeToEdge && 'bg-linear-to-br',
        edgeToEdge
          ? cn(
              // No ground of its own on a phone: Home paints one gradient
              // behind the header and this card together. A card again, with
              // its own gradient, from a laptop up.
              'min-h-48 rounded-none px-4 pt-4 pb-7 lg:min-h-56 lg:rounded-card lg:bg-linear-to-br lg:p-5',
              TONES[banner.tone]
            )
          : TONES[banner.tone],
        className
      )}
    >
      {/* A soft band of light drifting across the ground, now and then. */}
      {moving ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-white/12 to-transparent opacity-0 motion-safe:animate-[banner-sheen_5.5s_ease-in-out_1.2s_infinite] motion-safe:opacity-100"
        />
      ) : null}

      <div className="relative flex min-w-0 flex-1 flex-col justify-between gap-4">
        <div>
          {banner.badge ? (
            <span
              className={cn(
                'mb-2.5 inline-flex items-center rounded-pill bg-white/20 px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] uppercase text-white',
                moving && RISE
              )}
            >
              {banner.badge}
            </span>
          ) : null}
          <h3
            className={cn(
              'font-bold',
              edgeToEdge
                ? 'text-[1.375rem] leading-tight lg:text-xl lg:leading-snug'
                : 'text-xl leading-snug'
            )}
            // Read whole, however it is drawn.
            aria-label={moving ? banner.title : undefined}
          >
            {moving
              ? words.map((word, index) => (
                  <span key={`${word}-${index}`} aria-hidden="true">
                    <span
                      className="inline-block motion-safe:animate-[banner-word_620ms_cubic-bezier(0.2,0.7,0.2,1)_both]"
                      style={{ animationDelay: `${index * 70}ms` }}
                    >
                      {word}
                    </span>
                    {index < words.length - 1 ? ' ' : null}
                  </span>
                ))
              : banner.title}
          </h3>
          {banner.subtitle ? (
            <p
              className={cn(
                'mt-1.5 line-clamp-3 text-sm text-white/80',
                moving && RISE
              )}
              style={moving ? { animationDelay: `${after}ms` } : undefined}
            >
              {banner.subtitle}
            </p>
          ) : null}
        </div>

        {banner.ctaLabel ? (
          <span
            className={cn(
              'inline-flex w-fit items-center rounded-pill bg-white px-4 py-2 text-sm font-semibold text-royal',
              moving && RISE
            )}
            style={moving ? { animationDelay: `${after + 140}ms` } : undefined}
          >
            {banner.ctaLabel}
          </span>
        ) : null}
      </div>

      {banner.image ? (
        // Under a third, and a full gutter clear of the words. The artwork is
        // drawn to the edges of its own box, so whatever this column is set to
        // is exactly how close the picture comes to the end of a line of text.
        <div
          className={cn(
            'relative w-[30%] shrink-0',
            moving &&
              'motion-safe:animate-[banner-art-in_700ms_cubic-bezier(0.2,0.7,0.2,1)_150ms_both]'
          )}
        >
          <div
            className={cn(
              'absolute inset-0',
              moving &&
                'motion-safe:animate-[banner-float_4.5s_ease-in-out_900ms_infinite]'
            )}
          >
          <Image
            src={banner.image}
            alt=""
            fill
            // Never wider than a third of a phone's screen.
            sizes="140px"
            priority={priority}
            className="object-contain object-right"
          />
          </div>
        </div>
      ) : null}
    </div>
  )

  return banner.ctaHref ? (
    <Link href={banner.ctaHref as Route} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  )
}

/**
 * A banner that is a photograph: the words on the left, a technician at work
 * on the right.
 *
 * Two columns again, for the reason `BannerCard` gives. Laid full-bleed behind
 * the words, the photograph's subject landed wherever `object-cover` put it,
 * and on a phone-shaped card that was under the headline — a face with a
 * sentence across it. Confined to the right-hand column it is cropped to the
 * technician and cannot reach the text. The column's inner edge fades into the
 * card, so the photograph reads as the room the card is in rather than a
 * picture pasted beside it.
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
  return (
    <div
      className={cn(
        'relative flex h-full min-h-52 overflow-hidden rounded-card bg-plate p-5 sm:min-h-56',
        className
      )}
    >
      <div className="absolute inset-y-0 right-0 w-[46%]">
        <Image
          src={photo}
          alt=""
          fill
          sizes="(min-width: 1024px) 340px, 46vw"
          priority={priority}
          // The technician stands a little right of centre in every one of
          // these shots, with the appliance beyond them.
          className="object-cover object-[68%_center]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-plate to-transparent"
        />
      </div>

      <div className="relative flex w-[54%] min-w-0 flex-col justify-between gap-4 pr-2">
        <div>
          {banner.badge ? (
            <span className="mb-2.5 inline-flex items-center rounded-pill bg-royal px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] uppercase text-white">
              {banner.badge}
            </span>
          ) : null}
          <h3 className="text-xl font-bold leading-snug text-night">
            {banner.title}
          </h3>
          {banner.subtitle ? (
            <p className="mt-1.5 line-clamp-3 text-sm text-night/70">
              {banner.subtitle}
            </p>
          ) : null}
        </div>

        {banner.ctaLabel ? (
          <span className="inline-flex w-fit items-center rounded-pill bg-royal px-4 py-2 text-sm font-semibold text-white">
            {banner.ctaLabel}
          </span>
        ) : null}
      </div>
    </div>
  )
}

/**
 * A banner told as a short story, the way the marketplaces open Home: the
 * problems float in around the middle as chips and drift there, the headline
 * rises out of a blur — "4 problems." — then the chips fade and the answer
 * arrives beside it — "1 visit." — with the way in under them.
 *
 * Played once each time the slide arrives, and held on its last frame.
 * Somebody who asked for less motion gets that last frame straight away: the
 * global reduced-motion rule shortens every animation to nothing, and every
 * one of these keeps its end state.
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
  // Where each chip floats, as fractions of the slide: around the headline,
  // never over it.
  // Two bands, above and below the headline's row, so a chip never crosses it.
  const spots = [
    'left-[8%] top-[10%]',
    'right-[5%] top-[18%]',
    'left-[4%] bottom-[14%]',
    'right-[10%] bottom-[8%]',
    'left-[40%] top-[4%]',
    'left-[36%] bottom-[4%]',
  ]
  const leave = 3.6 // seconds: when the chips go and the answer arrives

  return (
    <div
      className={cn(
        'relative flex h-full min-h-52 flex-col items-center justify-center overflow-hidden px-4 py-8 text-center text-white sm:min-h-56',
        edgeToEdge
          ? cn('min-h-48 rounded-none lg:rounded-card lg:bg-linear-to-br', TONES[banner.tone])
          : cn('rounded-card bg-linear-to-br', TONES[banner.tone]),
        className
      )}
    >
      {chips.map((chip, index) => (
        <span
          key={chip}
          aria-hidden="true"
          className={cn(
            'absolute rounded-pill border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-white backdrop-blur-sm',
            spots[index % spots.length],
            // Still, with no story to tell, the chips are not shown at all.
            !moving && 'hidden'
          )}
          style={
            moving
              ? {
                  animation: [
                    `story-chip-in 600ms cubic-bezier(0.2,0.7,0.2,1) ${0.15 + index * 0.35}s both`,
                    `story-drift 3.2s ease-in-out ${0.8 + index * 0.35}s infinite`,
                    `story-chip-out 500ms ease-in ${leave + index * 0.08}s forwards`,
                  ].join(', '),
                }
              : undefined
          }
        >
          {chip}
        </span>
      ))}

      <h3
        className="relative text-[1.75rem] leading-tight font-bold"
        aria-label={[banner.title, banner.titleAfter].filter(Boolean).join(' ')}
      >
        <span
          aria-hidden="true"
          className="inline-block bg-linear-to-r from-white to-[#CFE0FF] bg-clip-text text-transparent"
          style={
            moving
              ? { animation: 'banner-word 700ms cubic-bezier(0.2,0.7,0.2,1) 0.5s both' }
              : undefined
          }
        >
          {banner.title}
        </span>
        {banner.titleAfter ? (
          <>
            {' '}
            <span
              aria-hidden="true"
              className="inline-block text-white"
              style={
                moving
                  ? {
                      animation: `banner-word 700ms cubic-bezier(0.2,0.7,0.2,1) ${leave + 0.3}s both`,
                    }
                  : undefined
              }
            >
              {banner.titleAfter}
            </span>
          </>
        ) : null}
      </h3>

      {banner.ctaLabel ? (
        <span
          className="relative mt-3 inline-flex items-center gap-2 text-base font-semibold text-white/75"
          style={
            moving
              ? {
                  animation: `banner-rise 520ms cubic-bezier(0.2,0.7,0.2,1) ${leave + 0.9}s both`,
                }
              : undefined
          }
        >
          {banner.ctaLabel}
          <span aria-hidden="true">→</span>
        </span>
      ) : null}
    </div>
  )
}

