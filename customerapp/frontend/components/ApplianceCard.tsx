import Image from 'next/image'
import type { Route } from 'next'
import type { CatalogAppliance } from '@app/shared'
import { CardLink } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

/**
 * A tile in the Our Services grid. The photo is the one place full colour lives
 * in this app, so the card gives it the space and keeps everything else plain.
 */

export interface ApplianceCardProps {
  appliance: CatalogAppliance
  /** "from ₹299", when the cheapest service for it is known. */
  fromLabel?: string
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
  fromLabel,
  priority = false,
  className,
}: ApplianceCardProps) {
  return (
    <CardLink
      href={`/services/appliance?a=${appliance.id}` as Route}
      ariaLabel={`${appliance.name} services`}
      className={cn('overflow-hidden', className)}
    >
      <div className="relative aspect-4/3 bg-surface">
        <Image
          src={appliance.image}
          alt=""
          fill
          // The grid is 2-up on a phone and 5-up on a desktop, so the rendered
          // width barely changes. Anything wider is wasted bytes on mobile.
          sizes="(min-width: 1024px) 220px, 45vw"
          priority={priority}
          className="object-cover"
        />
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold leading-snug text-ink">
          {appliance.name}
        </p>
        {fromLabel ? (
          <p className="mt-0.5 text-xs text-muted">{fromLabel}</p>
        ) : null}
      </div>
    </CardLink>
  )
}
