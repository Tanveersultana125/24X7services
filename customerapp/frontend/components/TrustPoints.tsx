import { Check } from 'lucide-react'
import { TRUST_POINTS } from '@/config/brand'
import { cn } from '@/lib/cn'

/**
 * The promises the app repeats, rendered the same way everywhere they appear.
 *
 * The list itself lives in config/brand so the wording is changed in one place.
 * Nothing here is absolute — no guarantees, no percentages nobody measures —
 * because every line on this list is one the business has to keep.
 */
export function TrustPoints({
  compact = false,
  className,
}: {
  /**
   * Two narrow columns of smaller type, for where the list is reassurance
   * beside the screen's actual job rather than the job itself. Seven lines at
   * body size under a sign-in form is a wall that outweighs the form.
   */
  compact?: boolean
  className?: string
}) {
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
