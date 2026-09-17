'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { CalendarCheck, Headphones, Home, User } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * The four places a customer goes. Mobile only — the desktop layout puts the
 * same destinations in DesktopNav across the top.
 */

const TABS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/support', label: 'Support', icon: Headphones },
  { href: '/profile', label: 'Profile', icon: User },
] as const satisfies ReadonlyArray<{
  href: Route
  label: string
  icon: typeof Home
}>

/** The height sticky CTAs and the toast viewport have to clear. */
export const BOTTOM_NAV_HEIGHT = 72

export function BottomNavigation({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg lg:hidden',
        'pb-[var(--safe-bottom)]',
        className
      )}
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map(({ href, label, icon: Icon }) => {
          // /bookings/track is still the Bookings tab, so this matches the
          // section rather than the exact path.
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-[72px] flex-col items-center justify-center gap-1',
                  'text-xs font-medium transition-colors duration-[var(--duration-fast)]',
                  active ? 'text-brand' : 'text-muted'
                )}
              >
                <Icon
                  className="size-5"
                  // A filled-looking icon is how the active tab reads at a
                  // glance in a palette with no accent colour to spend.
                  strokeWidth={active ? 2.4 : 1.8}
                  aria-hidden="true"
                />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
