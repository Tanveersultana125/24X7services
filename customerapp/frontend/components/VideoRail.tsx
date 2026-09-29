'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRailScroll } from '@/lib/useRailScroll'
import { cn } from '@/lib/cn'

/**
 * Home's row of tall reel cards, straight under the hero — the shape the
 * marketplaces open with: a real room, moving, with a tag and a title laid
 * over its foot, and nothing written underneath.
 *
 * There is no footage of this business's work yet, so each card is a
 * photograph of the appliance where it lives — the technician at the AC, the
 * geyser on the bathroom wall — drifting slowly in and across so it reads as
 * a shot rather than a still. The name of the service is the only thing
 * written on it — no price; the card is there to draw the eye, and the price
 * is one tap away. The drawn clips were tried here first and read
 * as cartoons next to everything else on the page. The day real footage
 * exists, it goes in `video` and plays instead of the drift.
 *
 * The words are HTML over the picture, not burned into it: crisp at any size,
 * readable by a screen reader, and changed without re-rendering anything.
 */

export interface ReelItem {
  id: string
  /** The room: a photograph of the appliance in use, never a product cut-out. */
  photo: string
  /** Real footage, when there is some; plays in place of the drift. */
  video?: string
  /** An optional pill over the title — "New", say. Never a price. */
  tag?: string
  title: string
  href: Route
}

const DRIFTS = ['reel-drift-a', 'reel-drift-b', 'reel-drift-c', 'reel-drift-d']

export function VideoRail({
  items,
  className,
}: {
  items: readonly ReelItem[]
  className?: string
}) {
  const { ref, canPrev, canNext, page, railProps } =
    useRailScroll<HTMLUListElement>(items.length)

  if (items.length === 0) return null

  return (
    <div className={cn('relative', className)}>
      <ul
        ref={ref}
        {...railProps}
        className="no-scrollbar -mx-4 -my-1 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 py-1 lg:mx-0 lg:gap-4 lg:px-0"
      >
        {items.map((item, index) => (
          <li
            key={item.id}
            className="w-[42%] shrink-0 snap-start sm:w-44 lg:w-[calc((100%-4rem)/5)]"
          >
            <Link
              href={item.href}
              aria-label={item.tag ? `${item.title}, ${item.tag}` : item.title}
              className="group relative block aspect-[9/16] overflow-hidden rounded-card bg-ink"
            >
              {item.video ? (
                <video
                  src={item.video}
                  poster={item.photo}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                  aria-hidden="true"
                  className="absolute inset-0 size-full object-cover"
                />
              ) : (
                <Image
                  src={item.photo}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 190px, 42vw"
                  className="object-cover will-change-transform"
                  style={{
                    animation: `${DRIFTS[index % DRIFTS.length]} ${11 + (index % 3) * 2}s ease-in-out ${-index * 1.7}s infinite alternate`,
                  }}
                />
              )}

              {/* Dark enough at the foot to carry white text over a bright
                  kitchen, clear by the middle so the room still shows. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-ink/85 via-ink/35 to-transparent"
              />

              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-3"
              >
                {item.tag ? (
                  <span className="rounded-pill border border-bg/40 bg-bg/20 px-2.5 py-1 text-[11px] font-semibold text-bg backdrop-blur-sm">
                    {item.tag}
                  </span>
                ) : null}
                <span className="text-base leading-tight font-bold text-bg">
                  {item.title}
                </span>
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
      aria-label={direction === 1 ? 'Show more' : 'Show previous'}
      className={cn(
        'absolute top-[calc(50%-1.25rem)] z-10 hidden size-10 items-center justify-center rounded-full border border-border bg-bg text-ink shadow-md transition-colors duration-[var(--duration-fast)] hover:bg-brand-soft pointer-fine:flex',
        direction === 1 ? '-right-2 lg:-right-5' : '-left-2 lg:-left-5'
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  )
}
