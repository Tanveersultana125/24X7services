import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { ArrowRight } from 'lucide-react'
import type { CatalogAppliance } from '@app/shared'
import { cn } from '@/lib/cn'

/**
 * The grid of everything we service, as the first thing under the banners.
 *
 * It replaced a two-up grid of photo cards. Two-up meant a customer saw two and
 * a half appliances before scrolling, which is the wrong trade on the one
 * screen whose job is to show the whole range at a glance — so the tiles got
 * smaller, the photograph became a centred icon on a plain fill, and the label
 * moved outside the tile where it can run to two lines without being cropped.
 *
 * No prices here. The grid is an index: it says what we touch, and the rails
 * underneath say what each thing costs. A "from" price on a tile is the
 * cheapest visit fee for that appliance, which across today's catalog is the
 * same number five times over — true, and indistinguishable from a bug.
 *
 * The last cell is the way out to the full list. It sits in the grid rather
 * than as a "See all" beside the heading because at three columns it also
 * completes the row: five appliances and one door out is two clean rows, and
 * the sixth appliance simply pushes it along.
 */

export interface CategoryGridProps {
  appliances: readonly CatalogAppliance[]
  className?: string
}

export function CategoryGrid({ appliances, className }: CategoryGridProps) {
  return (
    <ul
      className={cn(
        'grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6',
        className
      )}
    >
      {appliances.map((appliance, index) => (
        <li key={appliance.id}>
          <Link
            href={`/services/appliance?a=${appliance.id}` as Route}
            className="group flex flex-col items-center gap-2"
          >
            <span className="relative block aspect-square w-full overflow-hidden rounded-card bg-surface transition-colors duration-[var(--duration-fast)] group-hover:bg-border">
              <Image
                src={appliance.image}
                alt=""
                fill
                // Roughly a third of a phone's width, and never larger than the
                // 132px the tile reaches on a desktop.
                sizes="(min-width: 1024px) 132px, 30vw"
                // The three tiles above the fold, and no others: the rest of
                // the grid can wait for layout.
                priority={index < 3}
                className="object-contain p-4"
              />
            </span>
            <span className="text-center text-xs font-semibold leading-tight text-ink">
              {appliance.name}
            </span>
          </Link>
        </li>
      ))}

      <li>
        <Link
          href="/services"
          className="group flex flex-col items-center gap-2"
          aria-label="See everything we service"
        >
          <span className="flex aspect-square w-full items-center justify-center rounded-card border border-dashed border-border transition-colors duration-[var(--duration-fast)] group-hover:border-ink">
            <ArrowRight className="size-5 text-muted" aria-hidden="true" />
          </span>
          <span className="text-center text-xs font-semibold leading-tight text-ink">
            All services
          </span>
        </Link>
      </li>
    </ul>
  )
}
