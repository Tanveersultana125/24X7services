import {
  BadgeCheck,
  Check,
  ClipboardCheck,
  EyeOff,
  FileText,
  Headphones,
  IndianRupee,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { TRUST_POINTS } from '@/config/brand'
import { cn } from '@/lib/cn'

/**
 * The promises the app repeats, rendered the same way everywhere they appear.
 *
 * The list itself lives in config/brand so the wording is changed in one place.
 * Nothing here is absolute — no guarantees, no percentages nobody measures —
 * because every line on this list is one the business has to keep.
 */
/** A picture for each promise, for the tile layout. */
const ICONS: Record<(typeof TRUST_POINTS)[number]['key'], LucideIcon> = {
  pricing: IndianRupee,
  verified: BadgeCheck,
  'no-hidden': EyeOff,
  approval: ClipboardCheck,
  warranty: ShieldCheck,
  invoice: FileText,
  support: Headphones,
}

export function TrustPoints({
  compact = false,
  tiles = false,
  className,
}: {
  /**
   * Each promise as a tile with its own icon, two to a row — for a page where
   * the promises are a section in their own right rather than a footnote.
   */
  tiles?: boolean
  /**
   * Two narrow columns of smaller type, for where the list is reassurance
   * beside the screen's actual job rather than the job itself. Seven lines at
   * body size under a sign-in form is a wall that outweighs the form.
   */
  compact?: boolean
  className?: string
}) {
  if (tiles) {
    return (
      <ul className={cn('grid grid-cols-2 gap-2.5 sm:grid-cols-3', className)}>
        {TRUST_POINTS.map((point, index) => {
          const Icon = ICONS[point.key]
          // An odd one out at the end takes the whole row, not half of it.
          const last = index === TRUST_POINTS.length - 1 && TRUST_POINTS.length % 2 === 1
          return (
            <li
              key={point.key}
              className={cn(
                'flex flex-col items-start gap-2.5 rounded-card border border-border bg-bg p-3.5',
                last && 'col-span-2 flex-row items-center sm:col-span-1 sm:flex-col sm:items-start'
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft">
                <Icon className="size-[18px] text-brand" aria-hidden="true" />
              </span>
              <span className="text-[13px] font-semibold leading-snug text-ink">
                {point.label}
              </span>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <ul
      className={cn(
        'grid gap-2',
        compact ? 'grid-cols-2 gap-x-3' : 'sm:grid-cols-2',
        className
      )}
    >
      {TRUST_POINTS.map((point) => (
        <li
          key={point.key}
          className={cn(
            'flex items-start gap-2 text-ink',
            compact ? 'text-xs leading-snug' : 'items-center text-sm'
          )}
        >
          <Check
            className={cn(
              'shrink-0 text-success',
              compact ? 'mt-px size-3.5' : 'size-4'
            )}
            aria-hidden="true"
          />
          {point.label}
        </li>
      ))}
    </ul>
  )
}
