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
export function TrustPoints({ className }: { className?: string }) {
  return (
    <ul className={cn('grid gap-2 sm:grid-cols-2', className)}>
      {TRUST_POINTS.map((point) => (
        <li key={point.key} className="flex items-center gap-2 text-sm text-ink">
          <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
          {point.label}
        </li>
      ))}
    </ul>
  )
}
