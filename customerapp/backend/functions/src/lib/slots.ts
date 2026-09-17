import type { SlotAvailability, SlotDay, SlotWindow } from '@app/shared'
import { LIMITED_SLOT_THRESHOLD } from '@app/shared'

/**
 * Reading a slot day the same way everywhere: the availability the customer is
 * shown, and the availability `createBooking` checks before it takes a hold.
 *
 * Capacity numbers never leave the server. A client that could see how full a
 * window is could read the whole operation's load off the booking screen.
 */

/** Places left in a window: booked jobs and unpaid holds both take one. */
export function freeIn(window: SlotWindow): number {
  return Math.max(0, window.capacity - window.booked - window.held)
}

export function availabilityOf(window: SlotWindow): SlotAvailability {
  const free = freeIn(window)
  if (free <= 0) return 'unavailable'
  return free <= window.capacity * LIMITED_SLOT_THRESHOLD
    ? 'limited'
    : 'available'
}

/** IST is the only timezone this business operates in. */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

/** Today in IST as the `YYYY-MM-DD` key slots are stored under. */
export function istDateKey(now: number = Date.now()): string {
  return new Date(now + IST_OFFSET_MS).toISOString().slice(0, 10)
}

/** Minutes since midnight, IST. */
export function istMinutesOfDay(now: number = Date.now()): number {
  const ist = new Date(now + IST_OFFSET_MS)
  return ist.getUTCHours() * 60 + ist.getUTCMinutes()
}

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/**
 * How long before a window opens it stops being bookable.
 *
 * A window that starts in ten minutes cannot have a technician sent to it, and
 * offering it produces a booking somebody has to ring up and move.
 */
export const SLOT_LEAD_MINUTES = 90

/** A window on today that has already started, or is about to. */
export function windowHasPassed(
  dateKey: string,
  window: Pick<SlotWindow, 'start'>,
  now: number = Date.now()
): boolean {
  if (dateKey > istDateKey(now)) return false
  if (dateKey < istDateKey(now)) return true
  return minutesOf(window.start) - SLOT_LEAD_MINUTES <= istMinutesOfDay(now)
}

/** The window a booking asked for, matched on both ends so a shifted grid misses. */
export function findWindow(
  day: SlotDay,
  start: string,
  end: string
): { index: number; window: SlotWindow } | null {
  const index = day.windows.findIndex((w) => w.start === start && w.end === end)
  const window = day.windows[index]
  return window ? { index, window } : null
}
