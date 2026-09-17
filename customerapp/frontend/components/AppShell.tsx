'use client'

import { BottomNavigation } from '@/components/BottomNavigation'
import { DesktopNav } from '@/components/DesktopNav'
import { useLocation } from '@/lib/useLocation'
import { locationLabel } from '@/lib/location'
import { cn } from '@/lib/cn'

/**
 * The frame every tab screen sits in: the top bar on desktop, the bottom nav on
 * a phone, and a content column between them.
 *
 * The bottom padding is not decoration. The nav is fixed, so without it the
 * last card on every scrolling screen sits underneath the nav and cannot be
 * reached.
 */

export interface AppShellProps {
  /** The mobile-only header — a Header, or Home's location and search block. */
  mobileHeader?: React.ReactNode
  /** Off on screens pushed onto the stack, like a single appliance. */
  bottomNav?: boolean
  className?: string
  children: React.ReactNode
}

export function AppShell({
  mobileHeader,
  bottomNav = true,
  className,
  children,
}: AppShellProps) {
  const { location } = useLocation()

  return (
    <div className="min-h-dvh bg-bg">
      <DesktopNav
        locationLabel={location ? locationLabel(location) : undefined}
      />

      {mobileHeader}

      <main
        id="content"
        className={cn(
          'mx-auto w-full max-w-lg px-4 lg:max-w-5xl lg:px-6',
          bottomNav
            ? 'pb-[calc(72px+2rem+var(--safe-bottom))] lg:pb-16'
            : 'pb-12',
          className
        )}
      >
        {children}
      </main>

      {bottomNav ? <BottomNavigation /> : null}
    </div>
  )
}

/**
 * A titled block of content. Every screen is a stack of these, so the space
 * between a heading and what it heads is decided once.
 */
export function Section({
  title,
  action,
  className,
  children,
}: {
  title?: string
  /** A "See all" link, aligned with the heading. */
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn('mt-8 first:mt-6', className)}>
      {title ? (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}
