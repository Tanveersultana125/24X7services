import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { COL, type BookingStatus } from '@app/shared'
import { REGION } from '../lib/options'
import { notify } from '../lib/notify'

/**
 * The moments in a booking worth telling somebody about, and no others.
 *
 * One trigger on the booking rather than a `notify()` scattered through every
 * callable that moves one. A booking's status is the single fact all of them
 * are really changing, so watching it means a path added later — a new
 * callable, the simulator, an admin tool — is announced without anybody
 * remembering to announce it.
 *
 * Not every status earns a banner. `pending_payment` is the customer still
 * looking at the screen that created it; `arrived` follows `en_route` by a
 * couple of minutes and would be the second buzz in five. What is left is the
 * four moments where something has happened that the customer either has to
 * act on or would want to know while they are doing something else.
 *
 * The id is built from the booking and the status, so a redelivered trigger —
 * and Firestore triggers are redelivered — finds its own record already there
 * and sends nothing.
 */

interface Announcement {
  title: string
  body: (displayId: string) => string
  /** Where tapping it goes. `:id` is replaced with the booking id. */
  href: string
}

const ANNOUNCEMENTS: Partial<Record<BookingStatus, Announcement>> = {
  confirmed: {
    title: 'Booking confirmed',
    body: (id) => `${id} is booked. We will tell you when a technician is on the way.`,
    href: '/bookings/detail?id=:id',
  },
  assigned: {
    title: 'A technician is assigned',
    body: (id) => `Your technician for ${id} is set. Their name and rating are on the booking.`,
    href: '/bookings/detail?id=:id',
  },
  en_route: {
    title: 'On the way',
    body: (id) => `Your technician has set off for ${id}. You can follow them on the map.`,
    href: '/bookings/track?id=:id',
  },
  awaiting_approval: {
    title: 'A quote needs your answer',
    body: (id) => `Nothing is started on ${id} until you approve what it costs.`,
    href: '/bookings/approval?id=:id',
  },
  completed: {
    title: 'Job finished',
    body: (id) => `${id} is done. Your invoice and warranty are on the booking.`,
    href: '/bookings/completed?id=:id',
  },
  cancelled: {
    title: 'Booking cancelled',
    body: (id) => `${id} has been cancelled. Anything refundable is on its way back.`,
    href: '/bookings/detail?id=:id',
  },
}

export const onBookingStatusNotify = onDocumentWritten(
  { document: `${COL.bookings}/{bookingId}`, region: REGION },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!after) return

    const status = after.status as BookingStatus | undefined
    if (!status || before?.status === status) return

    const announcement = ANNOUNCEMENTS[status]
    if (!announcement) return

    const uid = after.uid as string | undefined
    const displayId = (after.displayId as string | undefined) ?? 'Your booking'
    if (!uid) return

    const bookingId = event.params.bookingId

    await notify({
      uid,
      title: announcement.title,
      body: announcement.body(displayId),
      href: announcement.href.replace(':id', bookingId),
      bookingId,
      // The booking and the status it reached: the same event, however many
      // times the trigger runs for it.
      id: `${bookingId}__${status}`,
    })
  }
)
