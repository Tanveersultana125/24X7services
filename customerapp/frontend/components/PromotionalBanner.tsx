'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import type { Banner } from '@app/shared'
import { cn } from '@/lib/cn'

/**
 * The banner rail on Home: swipeable, with dots, and advancing on its own.
 *
 * It is a scroll container rather than a transform carousel, so the platform
 * provides the swipe, the momentum and the snap, and a keyboard user gets arrow
 * keys for free. Autoplay stops the moment anyone touches it and does not come
 * back — a rail that keeps moving while someone is reading it is worse than one
 * that never moved.
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
    if (!(slide instanceof HTMLElement)) return
    rail?.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' })
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
      className={cn('flex flex-col gap-2', className)}
      onPointerDown={stopAutoplay}
      onKeyDown={stopAutoplay}
      onFocus={stopAutoplay}
    >
      <div
        ref={railRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth"
      >
        {banners.map((banner, index) => (
          <article
            key={banner.id}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${banners.length}`}
            className="w-full shrink-0 snap-start"
          >
            <BannerCard banner={banner} />
          </article>
        ))}
      </div>

      {banners.length > 1 ? (
        <div className="flex justify-center gap-1.5">
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
              <span
                className={cn(
                  'h-1.5 rounded-full transition-all duration-[var(--duration-base)]',
                  index === active ? 'w-4 bg-ink' : 'w-1.5 bg-border'
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function BannerCard({ banner }: { banner: Banner }) {
  const body = (
    <div className="flex h-full flex-col justify-between gap-4 rounded-card border border-border bg-ink p-5 text-bg">
      <div>
        <h3 className="text-xl font-bold leading-snug">{banner.title}</h3>
        {banner.subtitle ? (
          <p className="mt-1.5 text-sm text-bg/70">{banner.subtitle}</p>
        ) : null}
      </div>
      {banner.ctaLabel ? (
        <span className="inline-flex w-fit items-center rounded-pill bg-bg px-4 py-2 text-sm font-semibold text-ink">
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
