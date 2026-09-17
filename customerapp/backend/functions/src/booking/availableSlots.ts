import { COL, slotDaySchema, slotDocId, type SlotOption } from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'
import { availabilityOf, windowHasPassed } from '../lib/slots'

/**
 * The windows a customer may pick, for a pincode, over the next few days.
 *
 * What comes back is a verdict — available, filling fast, unavailable — and
 * never a count. Capacity is operational information: how many jobs we can take
 * in Kondapur on a Tuesday is not something a booking screen should be able to
 * tell anyone who opens it.
 *
 * A day with no slot document is a day we have not opened yet, which reads as
 * an empty list rather than an error.
 */
export const getAvailableSlots = defineCallable(
  'getAvailableSlots',
  async ({ pincode, fromDate, days }) => {
    const dates = datesFrom(fromDate, days)
    const refs = dates.map((date) =>
      db().collection(COL.slots).doc(slotDocId(pincode, date))
    )
    const snaps = await db().getAll(...refs)
    const now = Date.now()

    return {
      days: dates.map((date, index) => {
        const snap = snaps[index]
        const parsed = snap?.exists
          ? slotDaySchema.safeParse(snap.data())
          : null

        const windows: SlotOption[] =
          parsed?.success === true
            ? parsed.data.windows.map((window) => ({
                start: window.start,
                end: window.end,
                // A window that has already started today is unavailable no
                // matter how much room is left in it.
                availability: windowHasPassed(date, window, now)
                  ? ('unavailable' as const)
                  : availabilityOf(window),
              }))
            : []

        return { date, windows }
      }),
    }
  }
)

/** `YYYY-MM-DD` keys, counting forward from one. */
function datesFrom(fromDate: string, days: number): string[] {
  const [y, m, d] = fromDate.split('-').map(Number)
  // Noon UTC keeps the arithmetic clear of any daylight-saving edge.
  const start = Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12)
  return Array.from({ length: days }, (_, i) =>
    new Date(start + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  )
}
