'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { CalendarX } from 'lucide-react'
import { addressSchema, COL, SUB, type SlotOption } from '@app/shared'

import { BookingStep } from '@/components/BookingStep'
import { DateStrip } from '@/components/DateStrip'
import { TimeSlot } from '@/components/TimeSlot'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { callFn } from '@/lib/callables'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth'
import { relativeDateLabel, todayKey } from '@/lib/format'
import { patchDraft, useBookingDraft } from '@/lib/bookingDraft'
import { useAsync } from '@/lib/useAsync'

/** Two weeks is as far ahead as the seed opens, and as far as anyone plans. */
const DAYS_AHEAD = 14

/**
 * When the expert comes.
 *
 * Availability is a verdict from the server — available, filling fast,
 * unavailable — and never a count, so the screen cannot be read as a report on
 * how busy the business is. A window that has already started today is
 * unavailable no matter how much room is left in it; the server decides that
 * too, because a phone's clock is not something to book against.
 *
 * Choosing a window does not hold it. The hold is taken by `createBooking`, and
 * the window can fill between here and there — which is why that call can still
 * say no, in a sentence this screen's customer can act on.
 */
export function SlotScreen() {
  const router = useRouter()
  const { draft } = useBookingDraft()
  const { user } = useAuth()
  const uid = user?.uid

  const [date, setDate] = useState(draft.slot?.date ?? '')
  const [chosen, setChosen] = useState<SlotOption | null>(
    draft.slot
      ? { start: draft.slot.start, end: draft.slot.end, availability: 'available' }
      : null
  )

  const addressId = draft.addressId
  const inlinePincode = draft.address?.pincode

  const load = useCallback(async () => {
    const pincode = addressId
      ? await pincodeOfSavedAddress(uid, addressId)
      : inlinePincode
    if (!pincode) throw new Error('No pincode for the chosen address')

    const result = await callFn('getAvailableSlots', {
      pincode,
      fromDate: todayKey(),
      days: DAYS_AHEAD,
    })
    return result.days
  }, [uid, addressId, inlinePincode])

  const slots = useAsync(load)

  const days = (slots.data ?? []).map((day) => ({
    date: day.date,
    hasAvailability: day.windows.some(
      (window) => window.availability !== 'unavailable'
    ),
  }))

  // The first day with anything free, unless the customer has already picked.
  const activeDate =
    date || days.find((day) => day.hasAvailability)?.date || days[0]?.date || ''
  const windows =
    slots.data?.find((day) => day.date === activeDate)?.windows ?? []

  const nothingOpen = days.length > 0 && days.every((day) => !day.hasAvailability)

  function submit(): void {
    if (!chosen || !activeDate) return
    patchDraft({
      slot: { date: activeDate, start: chosen.start, end: chosen.end },
    })
    router.push('/book/technician')
  }

  return (
    <BookingStep
      stepKey="slot"
      title="Pick a time"
      cta={{
        label: 'Continue',
        onClick: submit,
        disabled: chosen === null,
      }}
      ctaDetail={
        chosen ? (
          <p className="truncate text-sm text-muted">
            <span className="font-semibold text-ink">
              {relativeDateLabel(activeDate)}
            </span>
            , {chosen.start.slice(0, 5)}–{chosen.end.slice(0, 5)}
          </p>
        ) : null
      }
    >
      {slots.status === 'loading' ? (
        <SkeletonGroup label="Loading times" className="mt-6 flex flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </SkeletonGroup>
      ) : slots.status === 'error' ? (
        <ErrorState
          className="py-16"
          onRetry={slots.reload}
          retrying={slots.refreshing}
          description="We could not load the available times. Please try again."
        />
      ) : nothingOpen ? (
        <EmptyState
          className="py-16"
          icon={CalendarX}
          title="No times available"
          description="Every window in the next two weeks is taken for your area. Support can usually find something sooner."
          action={{ label: 'Talk to support', href: '/support' }}
        />
      ) : (
        <>
          <p className="mt-5 text-sm text-muted">
            A two-hour window. Your expert calls before setting off.
          </p>

          <DateStrip
            className="mt-4"
            days={days}
            value={activeDate}
            onChange={(next) => {
              setDate(next)
              // A window on one day means nothing on another.
              setChosen(null)
            }}
          />

          <div className="mt-5 grid grid-cols-2 gap-3">
            {windows.map((window) => (
              <TimeSlot
                key={`${window.start}-${window.end}`}
                slot={window}
                selected={
                  chosen?.start === window.start && chosen?.end === window.end
                }
                onSelect={setChosen}
              />
            ))}
          </div>

          {windows.length === 0 ? (
            <p className="mt-5 text-sm text-muted">
              Nothing is open on this day. Try another date above.
            </p>
          ) : null}
        </>
      )}
    </BookingStep>
  )
}

async function pincodeOfSavedAddress(
  uid: string | undefined,
  addressId: string
): Promise<string | undefined> {
  if (!uid) return undefined
  const snap = await getDoc(
    doc(db(), COL.users, uid, SUB.addresses, addressId)
  )
  const parsed = addressSchema.safeParse({ id: snap.id, ...snap.data() })
  return parsed.success ? parsed.data.pincode : undefined
}
