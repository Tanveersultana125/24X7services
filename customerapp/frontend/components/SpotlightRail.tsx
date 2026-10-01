import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { ChevronRight } from 'lucide-react'

/**
 * "In the spotlight": a row of large photograph cards, one per appliance, the
 * way the marketplaces break up Home between the categories and the lists.
 * Each card is a technician at work on that appliance, darkened at the foot
 * where its name and its starting price sit, and opens the appliance's page.
 *
 * Scrolls sideways with the next card peeking in, so it reads as a row and
 * not as the end of the page. The words are white over a fixed dark scrim,
 * so they hold in either theme.
 */

export interface SpotlightItem {
  id: string
  title: string
  /** "Starts at ₹299". */
  note?: string
  photo: string
  href: Route
}

export function SpotlightRail({ items }: { items: readonly SpotlightItem[] }) {
  if (items.length === 0) return null
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 lg:mx-0 lg:px-0">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="w-[82%] shrink-0 snap-start sm:w-[60%] lg:w-[calc((100%-1.5rem)/3)]"
        >
          <Link
            href={item.href}
            className="group relative block aspect-[16/10] overflow-hidden rounded-card bg-plate"
          >
            <Image
              src={item.photo}
              alt=""
              fill
              sizes="(min-width: 1024px) 320px, 82vw"
              priority={index === 0}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-t from-night/80 via-night/20 to-transparent"
            />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white">
              <span className="min-w-0">
                <span className="block text-lg leading-tight font-bold">
                  {item.title}
                </span>
                {item.note ? (
                  <span className="mt-1 block text-sm text-white/85">
                    {item.note}
                  </span>
                ) : null}
              </span>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-night transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5">
                <ChevronRight className="size-5" aria-hidden="true" />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
