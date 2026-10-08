'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * One card at a time, centred, with an arrow either side — for the Services
 * page's appliances, where two half-cards side by side read as clutter.
 *
 * It is still a scroll-snap strip underneath, so a swipe works as well as the
 * arrows; the arrows wrap from the last card back to the first.
 */
export function ApplianceCarousel({
  label,
  items,
}: {
  label: string
  items: { key: string; node: React.ReactNode; name: string }[]
}) {
  const strip = useRef<HTMLUListElement>(null)
  const [index, setIndex] = useState(0)

  function go(to: number): void {
    const el = strip.current
    if (!el || items.length === 0) return
    const next = (to + items.length) % items.length
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: next * el.clientWidth, behavior: reduced ? 'auto' : 'smooth' })
    setIndex(next)
  }

  const arrow =
    'flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-bg text-ink shadow-raised hover:border-brand'

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => go(index - 1)} aria-label="Previous" className={arrow}>
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>

        <ul
          ref={strip}
          onScroll={(event) => {
            const el = event.currentTarget
            setIndex(Math.round(el.scrollLeft / el.clientWidth))
          }}
          className="no-scrollbar mx-auto flex w-full max-w-sm snap-x snap-mandatory overflow-x-auto"
        >
          {items.map((item, at) => (
            <li
              key={item.key}
              aria-roledescription="slide"
              aria-label={`${at + 1} of ${items.length}: ${item.name}`}
              className="w-full shrink-0 snap-center px-1"
            >
              {item.node}
            </li>
          ))}
        </ul>

        <button type="button" onClick={() => go(index + 1)} aria-label="Next" className={arrow}>
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
        {items.map((item, at) => (
          <span
            key={item.key}
            className={cn(
              'h-1.5 rounded-full transition-all',
              at === index ? 'w-5 bg-ink' : 'w-1.5 bg-border'
            )}
          />
        ))}
      </div>
    </div>
  )
}
