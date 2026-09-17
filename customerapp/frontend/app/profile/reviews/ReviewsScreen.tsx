'use client'

import { useCallback } from 'react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { Star } from 'lucide-react'
import {
  bookingSchema,
  COL,
  reviewSchema,
  type Booking,
  type Review,
} from '@app/shared'

import { ProfileShell } from '@/components/ProfileShell'
import { ReviewCard } from '@/components/ReviewCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { fetchAllServices } from '@/lib/catalog'
import { db } from '@/lib/firebase'
import { useAsync } from '@/lib/useAsync'

/**
 * What this customer told us, kept where they can read it back.
 *
 * Read-only. A review is a record of what someone thought at the time, and one
 * that can be quietly rewritten later is worth less to everyone — including the
 * next customer reading a technician's rating.
 */
export function ReviewsScreen() {
  return (
    <ProfileShell title="Your reviews">
      {(user) => <ReviewList uid={user.uid} />}
    </ProfileShell>
  )
}

function ReviewList({ uid }: { uid: string }) {
  const load = useCallback(async () => {
    const [snap, services] = await Promise.all([
      getDocs(
        query(
          collection(db(), COL.reviews),
          where('uid', '==', uid),
          orderBy('createdAt', 'desc'),
          limit(100)
        )
      ),
      fetchAllServices(),
    ])

    const reviews: Review[] = []
    for (const document of snap.docs) {
      const parsed = reviewSchema.safeParse({
        id: document.id,
        ...document.data(),
      })
      if (parsed.success) reviews.push(parsed.data)
    }

    // The service a review was left against lives on its booking. The review
    // carries the booking id, so each is one document read by key rather than a
    // query — no second index, and nothing to keep in step.
    const bookings = new Map<string, Booking>()
    await Promise.all(
      reviews.map(async (review) => {
        const snapshot = await getDoc(doc(db(), COL.bookings, review.bookingId))
        const booking = bookingSchema.safeParse({
          id: snapshot.id,
          ...snapshot.data(),
        })
        if (booking.success) bookings.set(review.id, booking.data)
      })
    )

    return { reviews, services, bookings }
  }, [uid])

  const data = useAsync(load)

  if (data.status === 'loading') {
    return (
      <SkeletonGroup label="Loading reviews" className="mt-6 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </SkeletonGroup>
    )
  }

  if (data.status === 'error') {
    return (
      <ErrorState
        className="py-16"
        onRetry={data.reload}
        retrying={data.refreshing}
      />
    )
  }

  if ((data.data?.reviews.length ?? 0) === 0) {
    return (
      <EmptyState
        className="py-16"
        icon={Star}
        title="You have not rated anything yet"
        description="After a job is finished you can rate the service and the expert. It takes a tap."
        action={{ label: 'See your bookings', href: '/bookings' }}
      />
    )
  }

  return (
    <ul className="mt-5 flex flex-col gap-3">
      {data.data?.reviews.map((review) => {
        const booking = data.data?.bookings.get(review.id)
        return (
          <li key={review.id}>
            <ReviewCard
              review={review}
              serviceName={
                booking
                  ? data.data?.services.find(
                      (service) =>
                        service.applianceId === booking.applianceId &&
                        service.serviceKey === booking.serviceKey
                    )?.name
                  : undefined
              }
              technicianName={booking?.technicianSnapshot?.name}
            />
          </li>
        )
      })}
    </ul>
  )
}
