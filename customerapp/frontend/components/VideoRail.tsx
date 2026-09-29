'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import type { CatalogService } from '@app/shared'
import { ServiceClip } from '@/components/ServiceClip'
import { formatPaise } from '@/lib/format'
import { useRailScroll } from '@/lib/useRailScroll'
import { cn } from '@/lib/cn'

/**
 * A row of the service reels, playing, on Home — the job shown rather than
 * described, the way the marketplaces open their pages with video.
 *
 * Tall 9:16 cards, and nothing under them: each reel carries its own caption,
 * drawn into the clip, so a name and a price below it would only say the same
 * thing twice. Two and a slice of a third on a phone, so it reads as something
 * to swipe; five across on a desktop.
 *
 * Each clip plays only while it is actually on screen (`ServiceClip` watches
 * for that), so the ones scrolled off to the side cost nothing. Anyone who has
 * asked for less motion gets the poster frame instead.
 */
export function VideoRail({
  services,
  className,
}: {
  /** In the order to show them; only those with a reel are drawn. */
  services: readonly CatalogService[]
  className?: string
}) {
  const clips = services.filter((service) => service.reel)
  const { ref, canPrev, canNext, page, railProps } =
    useRailScroll<HTMLUListElement>(clips.length)

  if (clips.length === 0) return null

  return (
    <div className={cn('relative', className)}>
      <ul
        ref={ref}
        {...railProps}
        className="no-scrollbar -mx-4 -my-1 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 py-1 lg:mx-0 lg:gap-4 lg:px-0"
      >
        {clips.map((service) => (
          <li
            key={service.id}
            className="w-[40%] shrink-0 snap-start sm:w-44 lg:w-[calc((100%-4rem)/5)]"
          >
            <Link
              href={
                `/services/appliance/?a=${service.applianceId}&s=${service.serviceKey}` as Route
              }
              // The caption is drawn into the clip, where a screen reader
              // cannot reach it; this is what it hears instead.
              aria-label={`${service.name}, visit from ${formatPaise(service.visitFee)}`}
              className="group relative block"
            >
              <ServiceClip
                video={service.reel}
                still={service.reelPoster}
                sizes="(min-width: 1024px) 190px, 40vw"
                className="aspect-[9/16] w-full rounded-card transition-transform duration-[var(--duration-base)] group-hover:scale-[1.02]"
              />
              {/* Says it is a video before it has started moving, and on a
                  phone that will never autoplay it. */}
              <span
                aria-hidden="true"
                className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-ink/45 text-bg"
              >
                <Play className="size-3.5 fill-current" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <RailArrow direction={-1} visible={canPrev} onClick={() => page(-1)} />
      <RailArrow direction={1} visible={canNext} onClick={() => page(1)} />
    </div>
  )
}

/** Arrows for a mouse only, centred on the cards. */
function RailArrow({
  direction,
  visible,
  onClick,
}: {
  direction: 1 | -1
  visible: boolean
  onClick: () => void
}) {
  if (!visible) return null
  const Icon = direction === 1 ? ChevronRight : ChevronLeft
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 1 ? 'Show more videos' : 'Show previous videos'}
      className={cn(
        'absolute top-[calc(50%-1.25rem)] z-10 hidden size-10 items-center justify-center rounded-full border border-border bg-bg text-ink shadow-md transition-colors duration-[var(--duration-fast)] hover:bg-brand-soft pointer-fine:flex',
        direction === 1 ? '-right-2 lg:-right-5' : '-left-2 lg:-left-5'
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  )
}
