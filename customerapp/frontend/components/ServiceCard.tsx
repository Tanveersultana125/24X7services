'use client'

import { ChevronRight } from 'lucide-react'
import type { CatalogService } from '@app/shared'
import { formatPaise } from '@/lib/format'
import { CardButton } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

/**
 * A service on the appliance page. It states the visit fee as a fact rather
 * than a range, because that is the only number the customer is committing to
 * at this point — anything beyond it needs their approval first, and the card
 * says so.
 */

export interface ServiceCardProps {
  service: CatalogService
  onSelect: (service: CatalogService) => void
  selected?: boolean
  className?: string
}

export function ServiceCard({
  service,
  onSelect,
  selected = false,
  className,
}: ServiceCardProps) {
  return (
    <CardButton
      onClick={() => onSelect(service)}
      selected={selected}
      ariaLabel={`${service.name}, visit fee ${formatPaise(service.visitFee)}`}
      className={cn('p-4', className)}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-ink">{service.name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {service.description}
          </p>

          <dl className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <div className="flex items-baseline gap-1.5">
              <dt className="text-xs text-muted">Visit fee</dt>
              <dd className="text-base font-bold text-ink">
                {formatPaise(service.visitFee)}
              </dd>
            </div>
            {service.startingPrice > service.visitFee ? (
              <div className="flex items-baseline gap-1.5">
                <dt className="text-xs text-muted">Repairs from</dt>
                <dd className="text-sm font-semibold text-ink">
                  {formatPaise(service.startingPrice)}
                </dd>
              </div>
            ) : null}
          </dl>

          <p className="mt-2 text-xs text-muted">
            Any repair beyond this is quoted on site and starts only after you
            approve it.
          </p>
        </div>

        <ChevronRight
          className="mt-1 size-5 shrink-0 text-muted"
          aria-hidden="true"
        />
      </div>
    </CardButton>
  )
}
