'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import type { Banner, BannerTone } from '@app/shared'
import { HOME_HEADER_CLEARANCE } from '@/components/HomeHeader'
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
 * One at a time. On a phone it runs edge to edge with square corners and
 * starts at the very top of the screen, with the header floating over its
 * upper third — so the whole coloured block at the top of Home is painted by
 * this one element and there is no seam anywhere in it. That is the shape
 * every app of this kind uses, and the reason they all use it is that the
 * alternatives show their joins: an offer inset as a card wears its margin
 * more loudly than its message, and an offer butted up under a coloured header
 * draws a line across the screen exactly where the two colours stop agreeing.
 *
 * From a laptop's width up it goes back to being an ordinary card, because a
 * banner stretched across a desktop window is not a banner, it is a stripe.
 *
 * The dots stay inside the artwork rather than under it: below it they push
 * everything down by the height of their own tap targets, and that gap reads
 * as a mistake rather than as a control.
 */

export interface PromotionalBannerProps {
  banners: readonly Banner[]
  intervalMs?: number
  className?: string
}

export function PromotionalBanner({
  banners,
  intervalMs = 5000,
  className,
}: PromotionalBannerProps) {
  const railRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [autoplay, setAutoplay] = useState(true)

  const scrollTo = useCallback((index: number) => {
    const rail = railRef.current
    const slide = rail?.children[index]
    if (!rail || !(slide instanceof HTMLElement)) return
    rail.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' })
  }, [])

  // Track which slide is in view rather than assuming, since the customer can
  // scroll the rail themselves and land between two.
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = Array.prototype.indexOf.call(rail.children, entry.target)
          if (index >= 0) setActive(index)
        }
      },
      { root: rail, threshold: 0.6 }
    )

    for (const child of Array.from(rail.children)) observer.observe(child)
    return () => observer.disconnect()
  }, [banners.length])

  useEffect(() => {
    if (!autoplay || banners.length < 2) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const timer = setInterval(() => {
      setActive((current) => {
        const next = (current + 1) % banners.length
        scrollTo(next)
        return next
      })
    }, intervalMs)
    return () => clearInterval(timer)
  }, [autoplay, banners.length, intervalMs, scrollTo])

  const stopAutoplay = useCallback(() => setAutoplay(false), [])

  if (banners.length === 0) return null

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Offers and announcements"
      className={cn('relative -mx-4 lg:mx-0', className)}
      onPointerDown={stopAutoplay}
      onKeyDown={stopAutoplay}
      onFocus={stopAutoplay}
    >
      <div
        ref={railRef}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth lg:gap-3"
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
              className={cn(
                'rounded-none lg:rounded-card',
                // Room at the top for the header that floats on this.
                HOME_HEADER_CLEARANCE,
                'min-h-[22rem] lg:min-h-56 lg:pt-5'
              )}
            />
          </article>
        ))}
      </div>

      {banners.length > 1 ? (
        <div className="absolute right-2 bottom-0 flex gap-1.5 lg:static lg:-mb-3 lg:justify-center">
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
                    ? 'w-5 bg-bg lg:bg-brand'
                    : 'w-1.5 bg-bg/45 lg:bg-border'
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
  className,
}: {
  banner: Banner
  priority?: boolean
  className?: string
}) {
  const body = (
    <div
      className={cn(
        'flex h-full min-h-52 gap-5 overflow-hidden rounded-card bg-linear-to-br p-5 text-bg sm:min-h-56',
        TONES[banner.tone],
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
        <div>
          {banner.badge ? (
            <span className="mb-2.5 inline-flex items-center rounded-pill bg-bg/20 px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] uppercase text-bg">
              {banner.badge}
            </span>
          ) : null}
          <h3 className="text-xl font-bold leading-snug">{banner.title}</h3>
          {banner.subtitle ? (
            <p className="mt-1.5 line-clamp-3 text-sm text-bg/80">
              {banner.subtitle}
            </p>
          ) : null}
        </div>

        {banner.ctaLabel ? (
          <span className="inline-flex w-fit items-center rounded-pill bg-bg px-4 py-2 text-sm font-semibold text-brand">
            {banner.ctaLabel}
          </span>
        ) : null}
      </div>

      {banner.image ? (
        // Under a third, and a full gutter clear of the words. The artwork is
        // drawn to the edges of its own box, so whatever this column is set to
        // is exactly how close the picture comes to the end of a line of text.
        <div className="relative w-[30%] shrink-0">
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
