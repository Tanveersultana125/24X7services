import { useCallback } from 'react'
import type { BookingStatus } from '@app/shared'
import type { Booking, Slot } from '@app/shared/catalog-v2'

import { APPROVALS, type ApprovalItem, type MockApproval } from '@/lib/mock/approvals'
import { BOOKINGS } from '@/lib/mock/bookings'
import { mockRequest } from '@/lib/mock/request'
import { useAsync, type AsyncState } from '@/lib/useAsync'

/**
 * What a customer can do to a booking after it is made: cancel it,
 * reschedule it, approve extra work, rate it, and watch the professional on
 * the way. Each is what the backend swap replaces with a callable; here they
 * change the mock bookings in place, so every screen that reads a booking
 * again sees the change.
 */

export type { ApprovalItem }
export type Approval = MockApproval

/** Statuses a booking can still be cancelled or rescheduled from (up to In progress). */
const MANAGEABLE: readonly BookingStatus[] = ['pending_payment', 'confirmed', 'assigned', 'en_route']

export function canManage(booking: Booking): boolean {
  return MANAGEABLE.includes(booking.status)
}

function find(id: string): Booking {
  const booking = BOOKINGS.find((b) => b.id === id)
  if (!booking) throw new Error('We could not find that booking.')
  return booking
}

function stamp(booking: Booking, status: BookingStatus, note?: string): void {
  booking.status = status
  booking.timeline = [...booking.timeline, { status, at: new Date().toISOString(), ...(note ? { note } : {}) }]
}

/** Cancels, and refunds straight away when it was paid for. */
export async function cancelBooking(id: string, reason: string): Promise<Booking> {
  await mockRequest(undefined)
  const booking = find(id)
  if (!canManage(booking)) throw new Error('This booking can no longer be cancelled.')
  const paid = booking.status !== 'pending_payment'
  stamp(booking, 'cancelled', reason)
  if (paid) stamp(booking, 'refunded', 'Refund to the original payment method in 3–5 working days')
  return booking
}

export async function rescheduleBooking(id: string, slot: Slot): Promise<Booking> {
  await mockRequest(undefined)
  const booking = find(id)
  if (!canManage(booking)) throw new Error('This booking can no longer be moved.')
  booking.slot = slot
  return booking
}

/** The rating and what was said with it, kept beside the booking until the review store exists. */
export interface Review {
  bookingId: string
  rating: number
  tags: string[]
  comment: string
}
const REVIEWS: Review[] = []

export async function rateBooking(review: Review): Promise<void> {
  await mockRequest(undefined)
  find(review.bookingId).rating = review.rating
  REVIEWS.push(review)
}

// ---------------------------------------------------------------------------
// Repair approval
// ---------------------------------------------------------------------------

export function fetchApproval(bookingId: string): Promise<Approval | null> {
  return mockRequest(APPROVALS.find((a) => a.bookingId === bookingId) ?? null)
}

export function useApproval(bookingId: string): AsyncState<Approval | null> {
  return useAsync(useCallback(() => fetchApproval(bookingId), [bookingId]))
}

/** Approve and the work goes on; reject and the visit is billed as it stands. */
export async function respondToApproval(bookingId: string, approve: boolean): Promise<Booking> {
  await mockRequest(undefined)
  const approval = APPROVALS.find((a) => a.bookingId === bookingId)
  const booking = find(bookingId)
  if (!approval || approval.answer) throw new Error('There is nothing waiting for your approval.')
  approval.answer = approve ? 'approved' : 'rejected'
  if (approve) {
    const extra = approval.items.reduce((sum, item) => sum + item.price, 0)
    booking.price = { ...booking.price, items: booking.price.items + extra, total: booking.price.total + extra }
  }
  stamp(booking, 'in_progress', approve ? 'You approved the extra work' : 'You declined the extra work')
  return booking
}

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

export interface LivePosition {
  lat: number
  lng: number
  /** Minutes until they arrive. */
  etaMinutes: number
}

/**
 * Where the professional is. The mock starts them about 3 km out and brings
 * them closer a step at a time, so the map has something moving.
 */
export function fetchPosition(booking: Booking, step: number): Promise<LivePosition> {
  const home = booking.address.geo ?? { lat: 17.4126, lng: 78.4392 }
  const left = Math.max(0, 1 - step * 0.08)
  return mockRequest({
    lat: home.lat + 0.022 * left,
    lng: home.lng - 0.018 * left,
    etaMinutes: Math.max(1, Math.round(18 * left)),
  })
}
