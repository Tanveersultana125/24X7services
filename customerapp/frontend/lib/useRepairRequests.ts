'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import {
  COL,
  repairRequestSchema,
  SUB,
  type RepairRequest,
} from '@app/shared'
import { db } from './firebase'

/**
 * The quotes raised against a booking, newest last.
 *
 * Watched rather than fetched because this is the one thing in the app that
 * arrives while the customer is already looking at the screen — an expert finds
 * something, raises it, and the approval screen should show it without anyone
 * pulling to refresh.
 */
export function useRepairRequests(bookingId: string | null): {
  requests: RepairRequest[]
  loading: boolean
} {
  const [requests, setRequests] = useState<RepairRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookingId) return

    const unsubscribe = onSnapshot(
      query(
        collection(db(), COL.bookings, bookingId, SUB.repairRequests),
        orderBy('createdAt', 'asc')
      ),
      (snap) => {
        const next: RepairRequest[] = []
        for (const document of snap.docs) {
          const parsed = repairRequestSchema.safeParse({
            id: document.id,
            ...document.data(),
          })
          if (parsed.success) next.push(parsed.data)
        }
        setRequests(next)
        setLoading(false)
      },
      () => setLoading(false)
    )

    return unsubscribe
  }, [bookingId])

  return { requests, loading }
}
