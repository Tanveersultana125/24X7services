'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { UserX } from 'lucide-react'
import {
  addressSchema,
  COL,
  SUB,
  type TechnicianPublic,
  type TechPreference,
} from '@app/shared'

import { BookingStep } from '@/components/BookingStep'
import { TechnicianCard } from '@/components/TechnicianCard'
import { CardButton } from '@/components/ui/Card'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { callFn } from '@/lib/callables'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth'
import { patchDraft, useBookingDraft } from '@/lib/bookingDraft'
import { useAsync } from '@/lib/useAsync'

/**
 * Who comes.
 *
 * "Any available expert" is the default and the honest one: assignment happens
 * against the roster on the day, and it is what gets someone there soonest.
 * Picking a name is a preference, not a reservation, and the screen says so
 * rather than letting a customer believe a particular person is now booked.
 *
 * Every expert listed covers this pincode, works on this appliance and knows
 * this brand — the server filters on all three, so the list is people who could
 * actually take the job rather than the whole roster.
 */

const CHOICES: ReadonlyArray<{
  value: Exclude<TechPreference, 'specific'>
  title: string
  detail: string
}> = [
  {
    value: 'any',
    title: 'Any available expert',
    detail: 'Usually the fastest. Everyone we send is verified and trained.',
  },
  {
    value: 'top_rated',
    title: 'A top-rated expert',
    detail: 'Rated 4.5 and above. May mean a slightly longer wait.',
  },
]

export function TechnicianScreen() {
  const router = useRouter()
  const { draft } = useBookingDraft()
  const { user } = useAuth()
  const uid = user?.uid

  const [preference, setPreference] = useState<TechPreference>(
    draft.techPreference ?? 'any'
  )
  const [technicianId, setTechnicianId] = useState<string | undefined>(
    draft.technicianId
  )

  const addressId = draft.addressId
  const inlinePincode = draft.address?.pincode
  const { applianceId, brandId, slot } = draft

  const load = useCallback(async (): Promise<TechnicianPublic[]> => {
    if (!applianceId || !brandId || !slot) return []
    const pincode = addressId
      ? await pincodeOfSavedAddress(uid, addressId)
      : inlinePincode
    if (!pincode) return []

    const result = await callFn('getTechnicianOptions', {
      pincode,
      applianceId,
      brandId,
      slot,
      // The list is asked for as "anyone who could take this", and the choice
      // of a specific person is made from it here.
      preference: preference === 'specific' ? 'any' : preference,
    })
    return result.technicians
    // slot is an object; its identity changes every render, so the parts of it
    // that matter are what this depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, addressId, inlinePincode, applianceId, brandId, preference, slot?.date, slot?.start])

  const options = useAsync(load)

  function submit(): void {
    patchDraft({
      techPreference: preference,
      technicianId: preference === 'specific' ? technicianId : undefined,
    })
    router.push('/book/review')
  }

  return (
    <BookingStep
      stepKey="technician"
      title="Who should come?"
      cta={{
        label: 'Continue',
        onClick: submit,
        disabled: preference === 'specific' && !technicianId,
      }}
    >
      <div className="mt-5 flex flex-col gap-3">
        {CHOICES.map((choice) => (
          <CardButton
            key={choice.value}
            onClick={() => {
              setPreference(choice.value)
              setTechnicianId(undefined)
            }}
            selected={preference === choice.value}
            className="p-4"
          >
            <p className="text-sm font-semibold text-ink">{choice.title}</p>
            <p className="mt-0.5 text-sm text-muted">{choice.detail}</p>
          </CardButton>
        ))}

        <CardButton
          onClick={() => setPreference('specific')}
          selected={preference === 'specific'}
          className="p-4"
        >
          <p className="text-sm font-semibold text-ink">Choose someone</p>
          <p className="mt-0.5 text-sm text-muted">
            Pick from the experts who cover your area.
          </p>
        </CardButton>
      </div>

      {preference === 'specific' ? (
        <section className="mt-6">
          {options.status === 'loading' ? (
            <SkeletonGroup label="Loading experts" className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </SkeletonGroup>
          ) : options.status === 'error' ? (
            <ErrorState
              onRetry={options.reload}
              retrying={options.refreshing}
              description="We could not load the experts for your area."
            />
          ) : (options.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={UserX}
              title="Nobody to choose from"
              description="No expert covering your area matches this appliance and brand. Any available expert is the way to get this booked."
              action={{
                label: 'Use any available expert',
                onClick: () => {
                  setPreference('any')
                  setTechnicianId(undefined)
                },
              }}
            />
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {options.data?.map((technician) => (
                  <TechnicianCard
                    key={technician.id}
                    technician={technician}
                    onSelect={(chosen) => setTechnicianId(chosen.id)}
                    selected={technicianId === technician.id}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                A preference, not a reservation. If they are not free on the day
                we will send someone else and tell you before the visit.
              </p>
            </>
          )}
        </section>
      ) : null}
    </BookingStep>
  )
}

async function pincodeOfSavedAddress(
  uid: string | undefined,
  addressId: string
): Promise<string | undefined> {
  if (!uid) return undefined
  const snap = await getDoc(doc(db(), COL.users, uid, SUB.addresses, addressId))
  const parsed = addressSchema.safeParse({ id: snap.id, ...snap.data() })
  return parsed.success ? parsed.data.pincode : undefined
}
