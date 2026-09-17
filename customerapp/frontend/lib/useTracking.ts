'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { COL, trackingSchema, type Tracking } from '@app/shared'
import { db } from './firebase'

/**
 * Where the expert is, live.
 *
 * Kept apart from the booking listener because it updates on a different
 * rhythm: a booking changes a handful of times over a job, a position changes
 * every few seconds while someone is driving. Watching them separately means a
 * position update does not re-render everything that depends on the booking.
 *
 * The document only exists once someone is assigned, so nothing here is an
 * error — no document means nobody is on the way yet.
 */
export function useTracking(bookingId: string | null): Tracking | null {
  const [tracking, setTracking] = useState<Tracking | null>(null)

  useEffect(() => {
    if (!bookingId) return

    const unsubscribe = onSnapshot(
      doc(db(), COL.tracking, bookingId),
      (snap) => {
        const parsed = trackingSchema.safeParse(snap.data())
        setTracking(parsed.success ? parsed.data : null)
      },
      () => setTracking(null)
    )

    return unsubscribe
  }, [bookingId])

  return tracking
}
