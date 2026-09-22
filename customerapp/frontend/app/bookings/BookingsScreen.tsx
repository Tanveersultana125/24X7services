'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { CalendarX } from 'lucide-react'
import {
  ACTIVE_STATUSES,
  CLOSED_STATUSES,
  UPCOMING_STATUSES,
  type BookingStatus,
  type CatalogService,
} from '@app/shared'

import { AppShell } from '@/components/AppShell'
import { Header } from '@/components/Header'
import { BookingCard } from '@/components/BookingCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { useSignInHref } from '@/components/ProfileShell'
import { BookingListSkeleton } from '@/components/SkeletonLoader'
import { useAuth } from '@/lib/auth'
import { fetchAllServices } from '@/lib/catalog'
import { useAsync } from '@/lib/useAsync'
import { useMyBookings } from '@/lib/useMyBookings'
import { cn } from '@/lib/cn'

/**
 * Every booking, in three tabs.
 *
 * The tabs are the three states a customer thinks in: something is coming,
 * something is happening right now, and something is done. They are not the
 * eleven statuses the system tracks — a customer does not care whether a
 * booking is `en_route` or `arrived`, only that someone is on their way.
 *
 * Active leads, because a job in progress is the one thing on this screen that
 * might need an answer in the next ten minutes.
 *
 * Signed out it draws itself rather than bouncing to the login form. The tabs
 * are the point of the screen and they still make sense empty; a phone number
 * field in their place tells somebody nothing about what they tapped.
 */

const TABS = [
  { key: 'active', label: 'Active', statuses: ACTIVE_STATUSES },
  { key: 'upcoming', label: 'Upcoming', statuses: UPCOMING_STATUSES },
  { key: 'past', label: 'Past', statuses: CLOSED_STATUSES },
] as const satisfies ReadonlyArray<{
  key: string
  label: string
  statuses: readonly BookingStatus[]
}>

type TabKey = (typeof TABS)[number]['key']

export function BookingsScreen() {
  const { user, ready } = useAuth()
  const [tab, setTab] = useState<TabKey>('active')
  const signIn = useSignInHref()

  const loadServices = useCallback(() => fetchAllServices(), [])
  const services = useAsync(loadServices)

  const active = TABS.find((t) => t.key === tab) ?? TABS[0]
  const { bookings, loading, error } = useMyBookings(user?.uid, active.statuses)

  // Every card needs the catalog name for what was booked; the booking stores
  // the ids, not the wording, so that a renamed service renames everywhere.
  const nameFor = (applianceId: string, serviceKey: string): string =>
    services.data?.find(
      (service: CatalogService) =>
        service.applianceId === applianceId && service.serviceKey === serviceKey
    )?.name ?? 'Service'

  return (
    <AppShell
      mobileHeader={
        <Header
          title="My bookings"
          showBack
          backFallback="/home"
          // Help sits on this screen because this is where the questions are.
          // A booking that has gone wrong is the reason most people open
          // support at all, and making them find it from the nav is a tap
          // spent on navigation instead of on the problem.
          right={
            <Link
              href={'/support' as Route}
              className="inline-flex h-9 items-center rounded-pill border border-border px-4 text-sm font-semibold text-brand hover:border-brand"
            >
              Help
            </Link>
          }
        />
      }
    >
      {/* Wraps rather than scrolling. Three pills come to about 270px, and a
          row that cannot shrink below that turns into a scroller on a narrow
          phone — which slices the last pill at the edge and, because an
          overflow box clips vertically too, shaves the focus ring off the
          top and bottom of whichever one you just tapped. The Balance screen
          made the same call for the same three-pill row. */}
      <div
        role="tablist"
        aria-label="Booking status"
        className="mt-4 flex flex-wrap gap-2"
      >
        {TABS.map((option) => {
          const selected = option.key === tab
          return (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(option.key)}
              className={cn(
                'min-h-11 shrink-0 rounded-pill border px-4 text-sm font-medium',
                'transition-colors duration-[var(--duration-fast)]',
                selected
                  ? 'border-brand bg-brand text-bg'
                  : 'border-border bg-bg text-ink hover:border-brand'
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="mt-5">
        {!ready || (user && loading) ? (
          <BookingListSkeleton />
        ) : !user ? (
          // Signed out, the truthful thing to say is not "sign in" — it is
          // that there is nothing here, which is the same sentence anyone
          // with an empty account gets. So the way to fill it leads, and the
          // way back into an account that already has bookings sits under it
          // for the smaller number of people who need that instead.
          <>
            <EmptyState
              className="pt-14 pb-2"
              icon={CalendarX}
              title="No bookings yet"
              description="Looks like you have not had us out yet. A repair, a service or an installation all start the same way."
              action={{ label: 'Explore our services', href: '/services' }}
            />
            <p className="pb-14 text-center text-sm text-muted">
              Booked with us before?{' '}
              <Link href={signIn} className="font-semibold text-brand">
                Sign in
              </Link>
            </p>
          </>
        ) : error ? (
          <ErrorState
            className="py-16"
            description="We could not load your bookings. Please try again."
          />
        ) : bookings.length === 0 ? (
          <EmptyState
            className="py-16"
            icon={CalendarX}
            title={
              tab === 'active'
                ? 'Nothing happening right now'
                : tab === 'upcoming'
                  ? 'No bookings yet'
                  : 'Nothing finished yet'
            }
            description={
              tab === 'past'
                ? 'Completed and cancelled bookings collect here.'
                : tab === 'active'
                  ? 'A job shows up here from the moment your technician is on the way until it is done.'
                  : 'Looks like you have not had us out yet. A repair, a service or an installation all start the same way.'
            }
            action={{ label: 'Explore our services', href: '/services' }}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <BookingCard
                  booking={booking}
                  serviceName={nameFor(booking.applianceId, booking.serviceKey)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
