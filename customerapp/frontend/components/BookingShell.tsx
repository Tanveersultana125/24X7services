'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Route } from 'next'
import type { Booking, BookingEvent } from '@app/shared'

import { Header } from '@/components/Header'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { useAuth } from '@/lib/auth'
import { useBookingLive } from '@/lib/useBookingLive'

/**
 * The frame every screen about one booking sits in.
 *
 * All of them take the booking as `?id=`, all of them need the customer signed
 * in, and all of them have the same three ways of going wrong — no id, not
 * signed in, no such booking. Doing that once means the seven screens behind it
 * only contain what makes them different from each other.
 *
 * A booking that belongs to someone else is reported as missing, not forbidden.
 * "You cannot see this" confirms it exists.
 */

export interface BookingShellProps {
  title: string
  subtitle?: string
  /** Where back goes when this screen was opened from a link. */
  backFallback?: Route
  right?: React.ReactNode
  children: (data: { booking: Booking; events: BookingEvent[] }) => React.ReactNode
}

export function BookingShell({
  title,
  subtitle,
  backFallback = '/bookings',
  right,
  children,
}: BookingShellProps) {
  const router = useRouter()
  const params = useSearchParams()
  const bookingId = params.get('id')
  const { user, ready } = useAuth()

  const { booking, events, status } = useBookingLive(
    ready && user ? bookingId : null
  )

  useEffect(() => {
    if (ready && !user) {
      router.replace(
        `/login?next=${encodeURIComponent(
          `${window.location.pathname}${window.location.search}`
        )}` as Route
      )
    }
  }, [ready, user, router])

  return (
    <div className="min-h-dvh bg-bg">
      <Header
        title={title}
        subtitle={subtitle}
        showBack
        backFallback={backFallback}
        right={right}
      />

      <main id="content" className="mx-auto w-full max-w-lg px-4 pb-16 lg:max-w-2xl">
        {!ready || status === 'loading' ? (
          <SkeletonGroup label="Loading" className="mt-6 flex flex-col gap-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-40 w-full" />
          </SkeletonGroup>
        ) : status === 'missing' ? (
          <ErrorState
            className="py-20"
            kind="notFound"
            title="We could not find that booking"
            description="It may have been removed, or the link may be out of date."
          />
        ) : status === 'error' || !booking ? (
          <ErrorState className="py-20" />
        ) : (
          children({ booking, events })
        )}
      </main>
    </div>
  )
}
