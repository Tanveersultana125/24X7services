'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import {
  CalendarClock,
  CalendarX,
  ReceiptIndianRupee,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react'
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
import { Card } from '@/components/ui/Card'
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
 * Signed out it draws itself rather than bouncing to the login form — but not
 * with the tabs. Three filters over nothing all show the same block, so
 * tapping one does nothing, and a control that does nothing is worse than no
 * control. They come back with the account that has something to filter.
 *
 * What fills the screen instead is what a booking here actually carries: the
 * technician tracked on the way, the invoice, the warranty. Those are facts
 * about this business rather than about one account, they are true before
 * anybody signs in, and they are the answer to the question a signed-out
 * visitor on this screen is really asking — what do I get for booking through
 * the app rather than ringing someone. The same block sits under an empty
 * list for somebody who has signed in and not booked yet, because that screen
 * is just as blank and the answer is just as useful.
 *
 * Sign in leads. Somebody who opened "My bookings" most likely has some; a
 * screen that puts the catalogue first and signing in in the small print is
 * telling a returning customer they are in the wrong place.
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
      {user ? (
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
      ) : null}

      <div className="mt-5">
        {!ready || (user && loading) ? (
          <BookingListSkeleton />
        ) : !user ? (
          <>
            <div className="flex flex-col items-center gap-3 px-6 pt-8 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-surface">
                <CalendarClock
                  className="size-6 text-muted"
                  aria-hidden="true"
                />
              </span>
              <h2 className="text-lg font-semibold text-ink">
                Your bookings live here
              </h2>
              <p className="max-w-xs text-sm text-muted">
                Sign in to pick up a job you have already booked, or start a new
                one — a repair, a service and an installation all begin the same
                way.
              </p>
              {/* Stacked on a phone and side by side once there is room, so
                  neither reads as the footnote of the other. */}
              <div className="mt-2 flex w-full max-w-xs flex-col gap-2 sm:max-w-md sm:flex-row sm:justify-center">
                <Link
                  href={signIn}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-pill bg-brand px-5 text-sm font-semibold text-bg transition-colors duration-[var(--duration-fast)] hover:bg-brand-deep"
                >
                  Sign in
                </Link>
                <Link
                  href={'/services' as Route}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-pill border border-border px-5 text-sm font-semibold text-ink transition-colors duration-[var(--duration-fast)] hover:border-brand hover:text-brand"
                >
                  Explore our services
                </Link>
              </div>
            </div>
            <WhatBookingsCarry className="mt-8" />
          </>
        ) : error ? (
          <ErrorState
            className="py-16"
            description="We could not load your bookings. Please try again."
          />
        ) : bookings.length === 0 ? (
          <>
            <EmptyState
              className="pb-4 pt-10"
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
            <WhatBookingsCarry className="mt-4" />
          </>
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

/**
 * What booking through the app gets you, on the screen with nothing on it.
 *
 * Each line is a screen that already exists — `/bookings/track`,
 * `/bookings/invoice`, `/bookings/warranty` — so this is a description of the
 * product rather than a promise made on its behalf. Nothing here is a number
 * or a guarantee, because those are the parts that go stale without anybody
 * noticing.
 */
const CARRIED: ReadonlyArray<{
  key: string
  icon: LucideIcon
  label: string
  detail: string
}> = [
  {
    key: 'track',
    icon: Truck,
    label: 'The technician, tracked',
    detail:
      'From the moment they set off — where they are, when they are due, and the code that starts the job.',
  },
  {
    key: 'invoice',
    icon: ReceiptIndianRupee,
    label: 'An itemised GST invoice',
    detail:
      'Parts and labour listed separately, in the app, as soon as the job is closed.',
  },
  {
    key: 'warranty',
    icon: ShieldCheck,
    label: 'The warranty, in one place',
    detail:
      'What is covered and until when, with the claim started from the booking itself.',
  },
]

function WhatBookingsCarry({ className }: { className?: string }) {
  return (
    <Card className={cn('p-4', className)}>
      <h3 className="text-sm font-semibold text-ink">
        What a booking here carries
      </h3>
      <ul className="mt-3 flex flex-col gap-3.5">
        {CARRIED.map(({ key, icon: Icon, label, detail }) => (
          <li key={key} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface">
              <Icon className="size-4 text-brand" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">
                {label}
              </span>
              <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                {detail}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
