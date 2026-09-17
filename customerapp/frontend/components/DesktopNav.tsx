'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { brand } from '@/config/brand'
import { cn } from '@/lib/cn'

/**
 * The top bar from 1024px up, where the bottom nav is hidden. Same four
 * destinations, plus the things that live in the mobile Header — location,
 * notifications — because on desktop there is room for them in one row.
 */

const LINKS = [
  { href: '/home', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/bookings', label: 'Bookings' },
  { href: '/support', label: 'Support' },
  { href: '/profile', label: 'Profile' },
] as const satisfies ReadonlyArray<{ href: Route; label: string }>

export function DesktopNav({
  locationLabel,
  unreadCount = 0,
  className,
}: {
  /** e.g. "Home · Kondapur, Hyderabad". Omitted until a location is chosen. */
  locationLabel?: string
  unreadCount?: number
  className?: string
}) {
  const pathname = usePathname()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 hidden border-b border-border bg-bg lg:block',
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
        <Link
          href="/home"
          className="text-xl font-extrabold tracking-tight text-ink"
        >
          {brand.wordmark}
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-pill px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-surface text-ink'
                    : 'text-muted hover:text-ink'
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {locationLabel ? (
            <Link
              href="/location"
              className="max-w-xs truncate rounded-pill border border-border px-3 py-2 text-sm text-ink hover:border-ink"
            >
              <span className="text-muted">Service at</span>{' '}
              <span className="font-medium">{locationLabel}</span>
            </Link>
          ) : null}

          <Link
            href="/profile/notifications"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : 'Notifications'
            }
            className="relative rounded-full p-2 text-ink hover:bg-surface"
          >
            <Bell className="size-5" aria-hidden="true" />
            {unreadCount > 0 ? (
              <span
                className="absolute right-1.5 top-1.5 size-2 rounded-full bg-error"
                aria-hidden="true"
              />
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  )
}
