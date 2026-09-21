'use client'

import {
  BottomNavigation,
  BOTTOM_NAV_CLEARANCE,
} from '@/components/BottomNavigation'
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
          bottomNav ? BOTTOM_NAV_CLEARANCE : 'pb-12',
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
  subtitle,
  action,
  className,
  children,
}: {
  title?: string
  /** A line under the heading saying what the section covers. */
  subtitle?: string
  /** A "See all" link, aligned with the heading. */
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn('mt-8 first:mt-6', className)}>
      {title ? (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-ink">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}
