'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { BadgeCheck } from 'lucide-react'
import { usePrefersReducedMotion } from '@/components/ServiceClip'
import { cn } from '@/lib/cn'

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
  const count = slides.length
  const current = slides[Math.min(index, count - 1)]

  useEffect(() => {
    if (reducedMotion || count < 2) return
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), DWELL_MS)
    return () => clearTimeout(timer)
  }, [index, count, reducedMotion])

  if (!current) return null

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      className={cn(
        'relative -mx-4 flex min-h-56 overflow-hidden bg-plate px-4 pt-6 pb-9 lg:mx-0 lg:min-h-64 lg:rounded-card lg:px-8',
        className
      )}
    >
      {/* Every photograph is laid out at once and only the current one shown,
          so moving between them is a fade rather than a fetch. */}
      <div className="absolute inset-y-0 right-0 w-1/2">
        {slides.map((slide, i) => (
          <Image
            key={slide.key}
            src={slide.photo}
            alt=""
            fill
            sizes="(min-width: 1024px) 320px, 50vw"
            // The first is the one picture above the fold on this screen.
            priority={i === 0}
            className={cn(
              'object-cover object-[68%_center] transition-opacity duration-500',
              i === index ? 'opacity-100' : 'opacity-0'
            )}
          />
        ))}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-plate to-transparent"
        />
      </div>

      <div
        className="relative flex w-[54%] min-w-0 flex-col justify-center pr-2"
        aria-live="polite"
      >
        <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-success px-2 py-1 text-[11px] font-semibold tracking-[0.04em] uppercase text-white">
          <BadgeCheck className="size-3.5" aria-hidden="true" />
          Verified technicians
        </span>
        <p className="mt-3 text-xl font-bold leading-tight text-night sm:text-2xl">
          {current.title}
        </p>
        {current.note ? (
          <p className="mt-2 text-base text-night/70">{current.note}</p>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="absolute inset-x-4 bottom-2 flex gap-2 lg:inset-x-8">
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${slide.title}`}
              aria-current={i === index}
              className="flex h-6 flex-1 items-center"
            >
              <span className="block h-1 w-full overflow-hidden rounded-pill bg-night/15">
                <span
                  // Re-keyed on every change so the fill starts from empty.
                  key={i === index ? `on-${index}` : 'off'}
                  className={cn(
                    'block h-full origin-left rounded-pill bg-night',
                    i === index
                      ? reducedMotion
                        ? 'scale-x-100'
                        : 'animate-[hero-progress_4500ms_linear_forwards]'
                      : i < index
                        ? 'scale-x-100 opacity-40'
                        : 'scale-x-0'
                  )}
                />
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}
