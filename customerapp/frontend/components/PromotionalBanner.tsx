'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import type { Banner } from '@app/shared'
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
 * One card at a time. On a phone it runs edge to edge with square corners and
 * starts at the very top of the screen, with the header floating over its upper
 * third — so the coloured block at the top of Home is painted by one element
 * and there is no join to see. Butting a coloured header up against it was the
 * previous attempt, and a join between two elements is only invisible while
 * their colours agree, which lasts exactly until the next banner is seeded a
 * different shade. From a laptop's width up it goes back to being an ordinary
 * card, because a banner stretched across a desktop window is not a banner, it
 * is a stripe.
 *
 * The dots sit inside the artwork on a phone for the same reason: below it they
 * push the first heading down by the height of their own tap targets, and that
 * gap reads as a mistake rather than as a control.
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
 * One banner, as a card.
 *
 * Exported because the same card does a second job further down the page: a
 * banner seeded into the `inline` slot is dropped between two sections on its
 * own, which is what breaks a long run of near-identical service rails into
 * something with a shape.
 *
 * Its height comes from its content and from whatever the rail stretches it to,
 * with a floor under it. A fixed height fits the shortest banner somebody seeds
 * and cuts the longest one off above its own button; no floor at all leaves a
 * one-line banner as a strip too thin to carry a picture.
 *
 * With an image it is that image behind a scrim; without one it is a brand
 * gradient. The scrim is not optional and it is not flat — the copy is seeded,
 * the artwork behind it is seeded separately, and white text over an unknown
 * image is a contrast failure waiting for the first pale one anyone uploads.
 * It is weighted to the left, where the words are, so the right-hand side of
 * the picture still arrives in full colour instead of under a grey sheet.
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
        'relative flex h-full min-h-52 flex-col justify-between gap-4 overflow-hidden rounded-card bg-linear-to-br from-brand-deep to-brand p-5 text-bg sm:min-h-56',
        className
      )}
    >
      {banner.image ? (
        <>
          <Image
            src={banner.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            priority={priority}
            // Pinned to its right edge. The card is nearly square on a
            // phone and a long strip on a desktop, and a centred crop of the
            // same picture cannot survive both — anchoring it means the
            // artwork is always the part that gets kept and the empty left of
            // the gradient is always the part that goes.
            className="object-cover object-right"
          />
          <span
            className="absolute inset-0 bg-linear-to-r from-ink/55 via-ink/20 to-transparent"
            aria-hidden="true"
          />
        </>
      ) : null}

      {/* The artwork keeps to the right-hand third, so the words keep to the
          left two. Without the cap a long seeded title runs straight across
          whatever is drawn there, and neither is readable. */}
      <div className="relative max-w-[68%]">
        {banner.badge ? (
          <span className="mb-2.5 inline-flex items-center rounded-pill bg-bg/20 px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] uppercase text-bg">
            {banner.badge}
          </span>
        ) : null}
        <h3 className="text-xl font-bold leading-snug">{banner.title}</h3>
        {banner.subtitle ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-bg/80">
            {banner.subtitle}
          </p>
        ) : null}
      </div>

      {banner.ctaLabel ? (
        <span className="relative inline-flex w-fit items-center rounded-pill bg-bg px-4 py-2 text-sm font-semibold text-brand">
          {banner.ctaLabel}
        </span>
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
