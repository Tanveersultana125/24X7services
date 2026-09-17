import type { Route } from 'next'
import { ShieldCheck, ShieldX } from 'lucide-react'
import type { Warranty } from '@app/shared'
import { CardLink } from '@/components/ui/Card'
import { ToneBadge } from '@/components/StatusBadge'
import { daysUntil, formatDateKey } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * A service warranty. The headline is how long is left, not when it started —
 * that is the only part a customer is checking when they open this.
 *
 * Expiry is computed against the stored `expiresAt` each render rather than
 * being stored as a flag, so a warranty that lapses while the app is open stops
 * claiming to be active.
 */

export interface WarrantyCardProps {
  warranty: Pick<
    Warranty,
    'id' | 'bookingId' | 'serviceKey' | 'startsAt' | 'expiresAt'
  >
  /** The service name, resolved from the catalog by the caller. */
  serviceName: string
  applianceName: string
  className?: string
}

export function WarrantyCard({
  warranty,
  serviceName,
  applianceName,
  className,
}: WarrantyCardProps) {
  const remaining = daysUntil(warranty.expiresAt)
  const active = remaining > 0
  const expiringSoon = active && remaining <= 7

  return (
    <CardLink
      href={`/bookings/warranty?id=${warranty.bookingId}` as Route}
      ariaLabel={`${serviceName} warranty, ${
        active ? `${remaining} days left` : 'expired'
      }`}
      className={cn('p-4', className)}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full',
            active ? 'bg-success-soft' : 'bg-surface'
          )}
        >
          {active ? (
            <ShieldCheck className="size-5 text-success" aria-hidden="true" />
          ) : (
            <ShieldX className="size-5 text-muted" aria-hidden="true" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-ink">
            {serviceName}
          </h3>
          <p className="mt-0.5 text-xs text-muted">{applianceName}</p>
          <p className="mt-2 text-sm text-ink">
            {active
              ? `Valid until ${formatDateKey(toDateKey(warranty.expiresAt))}`
              : `Expired on ${formatDateKey(toDateKey(warranty.expiresAt))}`}
          </p>
        </div>

        <ToneBadge
          tone={active ? (expiringSoon ? 'warning' : 'success') : 'neutral'}
          label={
            active
              ? remaining === 1
                ? '1 day left'
                : `${remaining} days left`
              : 'Expired'
          }
        />
      </div>
    </CardLink>
  )
}

/** formatDateKey takes the stored YYYY-MM-DD form that slots use. */
function toDateKey(epochMs: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(epochMs))
}
