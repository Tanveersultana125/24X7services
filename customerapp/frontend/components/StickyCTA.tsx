'use client'

import { cn } from '@/lib/cn'

/**
 * The bar pinned to the bottom of a booking step, carrying the one action that
 * moves the customer forward, and usually a price beside it.
 *
 * It sits above the bottom nav on screens that have one, and the page it is on
 * has to reserve the same height at the end of its content — `<StickySpacer />`
 * does that — or the bar covers the last thing on the page.
 */

export interface StickyCTAProps {
  /** The price, a slot summary, a count — whatever the action applies to. */
  detail?: React.ReactNode
  children: React.ReactNode
  /** True on screens with a bottom nav underneath. */
  aboveBottomNav?: boolean
  className?: string
}

export function StickyCTA({
  detail,
  children,
  aboveBottomNav = false,
  className,
}: StickyCTAProps) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 z-30 border-t border-border bg-bg',
        'px-4 py-3 pb-[calc(0.75rem+var(--safe-bottom))]',
        aboveBottomNav ? 'bottom-[72px] lg:bottom-0' : 'bottom-0',
        className
      )}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 lg:max-w-2xl">
        {detail ? <div className="min-w-0 flex-1">{detail}</div> : null}
        <div className={cn(detail ? 'shrink-0' : 'w-full')}>{children}</div>
      </div>
    </div>
  )
}

/** Reserves the space the fixed bar occupies, so nothing hides under it. */
export function StickySpacer({
  aboveBottomNav = false,
}: {
  aboveBottomNav?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'h-[calc(4.5rem+var(--safe-bottom))]',
        aboveBottomNav && 'h-[calc(4.5rem+72px+var(--safe-bottom))]'
      )}
    />
  )
}
