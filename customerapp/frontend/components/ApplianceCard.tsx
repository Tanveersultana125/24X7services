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
  className?: string
}

export function ApplianceCard({
  appliance,
  fromLabel,
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
