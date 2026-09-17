'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import {
  bookingSchema,
  COL,
  type Booking,
  type BookingStatus,
} from '@app/shared'
import { db } from './firebase'

/**
 * This customer's bookings in one group of statuses, newest slot first.
 *
 * The query is scoped by `uid` because the rules require it — a list over the
 * whole collection is refused outright, which is deliberate: the only way to
 * read bookings is to ask for your own.
 *
 * Watched rather than fetched, so a booking that gets assigned or completed
 * while the list is open changes tab underneath without a refresh.
 */
/** The ceiling the security rules enforce on any bookings list. */
const PAGE = 100

export function useMyBookings(
  uid: string | undefined,
  statuses: readonly BookingStatus[]
): { bookings: Booking[]; loading: boolean; error: boolean } {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // The array is a new object every render; its contents are what matter.
  const key = statuses.join(',')

  useEffect(() => {
    if (!uid) return

    const unsubscribe = onSnapshot(
      query(
        collection(db(), COL.bookings),
        where('uid', '==', uid),
        where('status', 'in', key.split(',')),
        orderBy('slot.date', 'desc'),
        // Stated rather than left open: the rules refuse a list without a limit
        // at or under a hundred, so a query that omits it is a query that fails.
        limit(PAGE)
      ),
      (snap) => {
        const next: Booking[] = []
        for (const document of snap.docs) {
          const parsed = bookingSchema.safeParse({
            id: document.id,
            ...document.data(),
          })
          if (parsed.success) next.push(parsed.data)
        }
        setBookings(next)
        setLoading(false)
        setError(false)
      },
      () => {
        setError(true)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [uid, key])

  return { bookings, loading, error }
}
