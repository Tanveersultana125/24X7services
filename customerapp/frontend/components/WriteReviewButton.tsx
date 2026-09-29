'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { PenLine } from 'lucide-react'
import type { ApplianceId, ServiceKey } from '@app/shared'
import { useAuth } from '@/lib/auth'
import { useMyBookings } from '@/lib/useMyBookings'
import { cn } from '@/lib/cn'

const COMPLETED = ['completed'] as const

/**
 * The way into writing a review, from a page that lists them.
 *
 * A review belongs to a finished job — that is what makes the stars above it
 * worth reading — so this never opens a blank form. It looks for the
 * customer's own completed booking on this appliance (and this service, when
 * the page is about one) that has not been reviewed yet, and takes them to
 * that booking's review. Without one it says when they will be able to,
 * rather than showing a button that goes nowhere.
 */
export function WriteReviewButton({
  applianceId,
  serviceKey,
  className,
}: {
  applianceId: ApplianceId
  /** Narrows it to one service; absent on the appliance page. */
  serviceKey?: ServiceKey
  className?: string
}) {
  const { user, ready } = useAuth()
  const { bookings, loading } = useMyBookings(user?.uid, COMPLETED)

  if (!ready) return null

  if (!user) {
    const here =
      typeof window === 'undefined'
        ? '/home'
        : `${window.location.pathname}${window.location.search}`
    return (
      <p className={cn('text-sm text-muted', className)}>
        Had this service with us?{' '}
        <Link
          href={`/login?next=${encodeURIComponent(here)}` as Route}
          className="font-semibold text-brand hover:text-brand-deep"
        >
          Log in to review it
        </Link>
      </p>
    )
  }

  if (loading) return null

  const due = bookings.find(
    (booking) =>
      booking.applianceId === applianceId &&
      (serviceKey === undefined || booking.serviceKey === serviceKey) &&
      !booking.reviewId
  )

  if (!due) {
    return (
      <p className={cn('text-sm text-muted', className)}>
        You can review this once we have finished a job for you.
      </p>
    )
  }

  return (
    <Link
      href={`/bookings/review?id=${due.id}` as Route}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-card border border-brand px-4 text-sm font-semibold text-brand hover:bg-brand-soft',
        className
      )}
    >
      <PenLine className="size-4" aria-hidden="true" />
      Write a review
    </Link>
  )
}
