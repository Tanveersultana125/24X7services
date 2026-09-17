'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const { user, ready } = useAuth()
  const [tab, setTab] = useState<TabKey>('active')

  useEffect(() => {
    if (ready && !user) router.replace('/login?next=%2Fbookings')
  }, [ready, user, router])

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
    <AppShell mobileHeader={<Header title="Your bookings" />}>
      <div
        role="tablist"
        aria-label="Booking status"
        className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0"
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
        {!ready || loading ? (
          <BookingListSkeleton />
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
                  ? 'Nothing booked yet'
                  : 'Nothing finished yet'
            }
            description={
              tab === 'past'
                ? 'Completed and cancelled bookings collect here.'
                : 'Book a repair, service or installation and it will show up here.'
            }
            action={{ label: 'Book a service', href: '/services' }}
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
