import Link from 'next/link'
import { Headphones, MessageCircle, Phone } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

/**
 * The "we are here" block on Home and at the foot of a booking.
 *
 * The phone number comes from `config/business.supportPhone` rather than being
 * written into the markup, so changing it is a config edit and not a release.
 */

export interface SupportCardProps {
  supportPhone: string
  className?: string
}

export function SupportCard({ supportPhone, className }: SupportCardProps) {
  return (
    <Card className={cn('overflow-hidden bg-surface', className)}>
      <div className="flex items-start gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink">
          <Headphones className="size-5 text-bg" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-ink">
            Help, any hour of the day
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            Something not right with a booking? Talk to us.
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-t border-border p-3">
        <a
          href={`tel:${supportPhone}`}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-pill bg-ink text-sm font-semibold text-bg"
        >
          <Phone className="size-4" aria-hidden="true" />
          Call
        </a>
        <Link
          href="/support"
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-pill border border-ink bg-bg text-sm font-semibold text-ink"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          Chat
        </Link>
      </div>
    </Card>
  )
}
