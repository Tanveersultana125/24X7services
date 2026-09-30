'use client'

import { useCallback } from 'react'
import { Clock } from 'lucide-react'
import { callFn } from '@/lib/callables'
import { formatTime, relativeDateLabel, todayKey } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { useLocation } from '@/lib/useLocation'
import { cn } from '@/lib/cn'

/**
 * "Earliest — Tomorrow, 9 AM": the first visit window with room in it, for
 * the pincode the customer has set, beside an appliance's name.
 *
 * It is the answer to the question a customer has before any price: can
 * somebody come soon. It says nothing at all rather than something vague —
 * no pincode yet, the lookup failed, or nothing is open in the week ahead —
 * because "Earliest: —" is a worse thing to read than no box.
 */

/** How far ahead to look. A week with nothing open is not worth a box. */
const DAYS_AHEAD = 7

/**
 * The first open window as "Tomorrow, 9 AM", or null while it is loading and
 * whenever there is nothing honest to say. The header and the box beside the
 * name both read it, so each loads it once.
 */
export function useEarliestSlot(): string | null {
  const { location } = useLocation()
  const pincode = location?.serviceable ? location.pincode : undefined

  const load = useCallback(async () => {
    if (!pincode) return null
    const { days } = await callFn('getAvailableSlots', {
      pincode,
      fromDate: todayKey(),
      days: DAYS_AHEAD,
    })
    for (const day of days) {
      const open = day.windows.find(
        (window) => window.availability !== 'unavailable'
      )
      if (open) return { date: day.date, start: open.start }
    }
    return null
  }, [pincode])

  const earliest = useAsync(load)
  const slot = earliest.status === 'ready' ? earliest.data : null
  return slot
    ? `${relativeDateLabel(slot.date)}, ${formatTime(slot.start)}`
    : null
}

export function EarliestSlot({
  label,
  className,
}: {
  /** From `useEarliestSlot`. */
  label: string | null
  className?: string
}) {
  if (!label) return null

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden rounded-card border border-success/40 text-center',
        className
      )}
    >
      <p className="flex items-center justify-center gap-1.5 bg-success/10 px-3 py-1.5 text-sm font-semibold text-success">
        <Clock className="size-3.5" aria-hidden="true" />
        Earliest
      </p>
      <p className="px-3 py-1.5 text-sm font-semibold text-ink">
        {label}
      </p>
    </div>
  )
}
