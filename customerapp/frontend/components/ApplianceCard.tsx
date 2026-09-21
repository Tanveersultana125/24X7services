import Image from 'next/image'
import type { Route } from 'next'
import { ChevronRight } from 'lucide-react'
import type { CatalogAppliance } from '@app/shared'
import { CardLink } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

/**
 * A tile in the Our Services grid. Tapping it opens that appliance.
 *
 * The illustration is contained rather than cropped to fill. These are drawings
 * with their own margins, not photographs — covering a 4:3 box with a squarer
 * drawing takes a slice off the top and bottom, which is how the geyser lost
 * its base and the microwave lost its feet.
 *
 * The chevron is not decoration either. A grid of drawings with a caption under
 * each reads as a picture list, and customers were treating it as one; the
 * chevron and the pressed state are what say the tile goes somewhere.
 */

export interface ApplianceCardProps {
  appliance: CatalogAppliance
  /** The cheapest visit fee for it, already formatted — "₹299". */
  from?: string
  /**
   * Lay the tile out sideways and let it take the full width of a phone.
   *
   * An odd number of appliances leaves the last one alone in a two-column row
   * with a hole beside it, which reads as a layout that broke rather than a
   * catalog that ended. Given to the odd tile, this turns that hole into the
   * end of the list.
   */
  wide?: boolean
  /**
   * Fetch this image straight away instead of lazily.
   *
   * `next/image` lazy-loads by default, which is right for a grid — except for
   * the tiles already on screen. The first of those is the largest thing above
   * the fold, so lazily loading it means the browser does not even ask for it
   * until layout has run, and the page's LCP is whatever that costs. Measured
   * on a throttled mobile profile it was the difference between 4.8s and
   * something respectable.
   *
   * Set it on the tiles that are visible without scrolling and on no others:
   * eager-loading the whole grid just moves the problem down the page.
   */
  priority?: boolean
  className?: string
}

export function ApplianceCard({
  appliance,
  from,
  wide = false,
  priority = false,
  className,
}: ApplianceCardProps) {
  return (
    <CardLink
      // The trailing slash matters here for the reason it does in the config:
      // the export writes `/services/appliance/index.html`, and a hard load of
      // the slashless path — a reload, a shared link, a WebView over file:// —
      // has no server to redirect it.
      href={`/services/appliance/?a=${appliance.id}` as Route}
      ariaLabel={`${appliance.name} services`}
      className={cn(
        'group flex h-full overflow-hidden',
        // The press state is the tap's only feedback on a phone, where there
        // is no hover to lean on.
        'touch-manipulation hover:shadow-raised active:border-brand',
        'transition-[border-color,box-shadow,transform] active:scale-[0.99]',
        wide ? 'col-span-2 flex-row md:col-span-1 md:flex-col' : 'flex-col',
        className
      )}
    >
      <div
        className={cn(
          'relative shrink-0 bg-surface',
          wide
            ? 'aspect-square w-28 sm:w-32 md:aspect-4/3 md:w-auto'
            : 'aspect-4/3'
        )}
      >
        <Image
          src={appliance.image}
          alt=""
          fill
          // The grid is 2-up on a phone and 5-up on a desktop, so the rendered
          // width barely changes. Anything wider is wasted bytes on mobile.
          sizes="(min-width: 1024px) 220px, 45vw"
          priority={priority}
          className="object-contain p-4"
        />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-snug text-ink">
            {appliance.name}
          </p>
          {from ? (
            <p className="mt-0.5 text-xs text-muted">
              Visit from{' '}
              <span className="font-semibold text-ink">{from}</span>
            </p>
          ) : null}
        </div>
        <ChevronRight
          className="size-4 shrink-0 text-muted transition-colors group-hover:text-brand"
          aria-hidden="true"
        />
      </div>
    </CardLink>
  )
}
