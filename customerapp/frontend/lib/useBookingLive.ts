'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  type FirestoreError,
} from 'firebase/firestore'
import {
  bookingEventSchema,
  bookingSchema,
  COL,
  SUB,
  type Booking,
  type BookingEvent,
} from '@app/shared'
import { db } from './firebase'

/**
 * One booking and its timeline, kept live.
 *
 * These screens are watched while something is happening to them — an expert on
 * the way, a quote arriving, a job finishing — so they listen rather than fetch.
 * A customer staring at a tracking screen should not have to pull to refresh to
 * find out their expert arrived.
 *
 * Both listeners are torn down together. A subscription left open on a screen
 * the customer has left is a socket and a document read for as long as the app
 * is running.
 */

export interface LiveBooking {
  booking: Booking | null
  events: BookingEvent[]
  status: 'loading' | 'ready' | 'error' | 'missing'
  error: FirestoreError | null
}

export function useBookingLive(bookingId: string | null): LiveBooking {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [events, setEvents] = useState<BookingEvent[]>([])
  const [status, setStatus] = useState<LiveBooking['status']>('loading')
  const [error, setError] = useState<FirestoreError | null>(null)

  useEffect(() => {
    if (!bookingId) return

    const unsubscribeBooking = onSnapshot(
      doc(db(), COL.bookings, bookingId),
      (snap) => {
        if (!snap.exists()) {
          setBooking(null)
          setStatus('missing')
          return
        }
        const parsed = bookingSchema.safeParse({ id: snap.id, ...snap.data() })
        if (!parsed.success) {
          setStatus('error')
          return
        }
        setBooking(parsed.data)
        setStatus('ready')
      },
      (caught) => {
        // A permission error here means the booking is not this customer's,
        // which reads the same as not existing and should not say otherwise.
        setError(caught)
        setStatus(caught.code === 'permission-denied' ? 'missing' : 'error')
      }
    )

    const unsubscribeEvents = onSnapshot(
      query(
        collection(db(), COL.bookings, bookingId, SUB.events),
        orderBy('at', 'asc')
      ),
      (snap) => {
        const next: BookingEvent[] = []
        for (const document of snap.docs) {
          const parsed = bookingEventSchema.safeParse({
            id: document.id,
            ...document.data(),
          })
          if (parsed.success) next.push(parsed.data)
        }
        setEvents(next)
      },
      () => {
        // The timeline is supporting detail. Losing it should not take the
        // screen down with it.
        setEvents([])
      }
    )

    return () => {
      unsubscribeBooking()
      unsubscribeEvents()
    }
  }, [bookingId])

  // No id at all is not something to hold in state — it is a fact about the
  // argument, and deriving it is one render fewer than announcing it.
  return {
    booking,
    events,
    status: bookingId ? status : 'missing',
    error,
  }
}
