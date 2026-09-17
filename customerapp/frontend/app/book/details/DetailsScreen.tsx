'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, getDocs, query, where } from 'firebase/firestore'
import {
  COL,
  SUB,
  userApplianceInputSchema,
  type CatalogAppliance,
  type DetailField,
} from '@app/shared'

import { BookingStep } from '@/components/BookingStep'
import { Chip } from '@/components/ui/Chip'
import { Card, CardButton } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { MANUFACTURER_WARRANTY_NOTICE } from '@/config/brand'
import { fetchAppliance } from '@/lib/catalog'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth'
import { patchDraft, useBookingDraft } from '@/lib/bookingDraft'
import { useAsync } from '@/lib/useAsync'

/**
 * What kind of appliance it is, and which model.
 *
 * The questions are data, not code. `detailFields` on the appliance decides
 * what is asked and what the options are, so a new appliance that needs a
 * different question is a seed entry rather than a new screen.
 *
 * Only the question marked required blocks the step. A customer standing in
 * front of a machine whose sticker has worn off still needs to be able to book;
 * the model number helps the expert arrive with the right part, and that is a
 * reason to ask, not a reason to insist.
 *
 * DECISION NEEDED: the draft carries `modelPhotoPath` and nothing here sets it.
 * Photographing the sticker belongs with saving an appliance to the profile,
 * which is Phase 5 — until then the number is typed or left out.
 *
 * DECISION NEEDED: the catalog lets an appliance declare several detail fields
 * — a washing machine has both a type and a capacity — but the draft carries a
 * single `applianceType`, so only one can be asked and the rest are ignored.
 * Only the field that decides the job is shown. Either the draft grows a
 * `details` map keyed by field, or the extra fields come out of the fixtures;
 * leaving both as they are means the seed promises a question nobody is asked.
 */

interface SavedAppliance {
  id: string
  type?: string
  modelNumber?: string
  nickname?: string
}

export function DetailsScreen() {
  const router = useRouter()
  const { draft } = useBookingDraft()
  const { user } = useAuth()

  const applianceId = draft.applianceId
  const brandId = draft.brandId
  const uid = user?.uid

  const [type, setType] = useState(draft.applianceType ?? '')
  const [modelNumber, setModelNumber] = useState(draft.modelNumber ?? '')
  const [error, setError] = useState<string | undefined>(undefined)

  const load = useCallback(async (): Promise<{
    appliance: CatalogAppliance | null
    saved: SavedAppliance[]
  }> => {
    if (!applianceId) return { appliance: null, saved: [] }

    const appliance = await fetchAppliance(applianceId)

    // A returning customer has usually told us about this machine already.
    if (!uid || !brandId) return { appliance, saved: [] }
    const snap = await getDocs(
      query(
        collection(db(), COL.users, uid, SUB.appliances),
        where('applianceId', '==', applianceId),
        where('brandId', '==', brandId)
      )
    )
    const saved: SavedAppliance[] = []
    for (const doc of snap.docs) {
      const parsed = userApplianceInputSchema.safeParse(doc.data())
      if (!parsed.success) continue
      saved.push({
        id: doc.id,
        type: parsed.data.type,
        modelNumber: parsed.data.modelNumber,
        nickname: parsed.data.nickname,
      })
    }
    return { appliance, saved }
  }, [applianceId, brandId, uid])

  const data = useAsync(load)
  const fields = data.data?.appliance?.detailFields ?? []
  // The one question that changes what the expert brings: the required one, or
  // the first if the appliance marks none. See the note above.
  const primaryField = fields.find((field) => field.required) ?? fields[0]

  function reuse(saved: SavedAppliance): void {
    setType(saved.type ?? '')
    setModelNumber(saved.modelNumber ?? '')
    setError(undefined)
    patchDraft({
      userApplianceId: saved.id,
      applianceType: saved.type,
      modelNumber: saved.modelNumber,
    })
  }

  function submit(): void {
    if (primaryField?.required && type.trim().length === 0) {
      setError(`Please choose the ${primaryField.label.toLowerCase()}`)
      return
    }

    patchDraft({
      applianceType: type.trim().length > 0 ? type : undefined,
      modelNumber: modelNumber.trim().length > 0 ? modelNumber.trim() : undefined,
      // Choosing different details than the saved appliance's makes this a
      // different machine as far as the booking is concerned.
      userApplianceId:
        draft.userApplianceId &&
        data.data?.saved.some(
          (s) =>
            s.id === draft.userApplianceId &&
            (s.type ?? '') === type &&
            (s.modelNumber ?? '') === modelNumber.trim()
        )
          ? draft.userApplianceId
          : undefined,
    })
    router.push('/book/issue')
  }

  return (
    <BookingStep
      stepKey="details"
      title="About the appliance"
      cta={{ label: 'Continue', onClick: submit }}
    >
      {data.status === 'loading' ? (
        <SkeletonGroup label="Loading" className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </SkeletonGroup>
      ) : data.status === 'error' ? (
        <ErrorState
          className="py-16"
          onRetry={data.reload}
          retrying={data.refreshing}
        />
      ) : (
        <div className="mt-5 flex flex-col gap-7">
          {data.data && data.data.saved.length > 0 ? (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted">
                Your saved appliances
              </h2>
              <div className="flex flex-col gap-2">
                {data.data.saved.map((saved) => (
                  <CardButton
                    key={saved.id}
                    onClick={() => reuse(saved)}
                    selected={draft.userApplianceId === saved.id}
                    className="p-4"
                  >
                    <p className="text-sm font-semibold text-ink">
                      {saved.nickname ?? 'Saved appliance'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {[saved.type, saved.modelNumber]
                        .filter(Boolean)
                        .join(' · ') || 'No details saved'}
                    </p>
                  </CardButton>
                ))}
              </div>
            </section>
          ) : null}

          {primaryField ? (
            <DetailFieldInput
              field={primaryField}
              value={type}
              onChange={(value) => {
                setType(value)
                setError(undefined)
              }}
              error={error}
            />
          ) : null}

          <Input
            label="Model number (optional)"
            value={modelNumber}
            onChange={(event) => setModelNumber(event.target.value.slice(0, 60))}
            hint="Usually on a sticker inside the door or behind the unit."
            placeholder="e.g. RT34C4523S8"
          />

          {/* Said before a slot is chosen, not after the job is done. */}
          <Card className="p-4 text-sm leading-relaxed text-muted">
            {MANUFACTURER_WARRANTY_NOTICE}
          </Card>
        </div>
      )}
    </BookingStep>
  )
}

/**
 * One catalog-defined question. Both kinds write to the same place — the draft
 * holds a single `applianceType`, which is what every appliance's required
 * field asks for.
 */
function DetailFieldInput({
  field,
  value,
  onChange,
  error,
}: {
  field: DetailField
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  if (field.kind === 'text') {
    return (
      <Input
        label={field.label}
        required={field.required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={error}
        placeholder={field.placeholder}
      />
    )
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">
        {field.label}
        {field.required ? (
          <span className="text-error" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {(field.options ?? []).map((option) => (
          <Chip
            key={option}
            selected={value === option}
            onClick={() => onChange(value === option ? '' : option)}
          >
            {option}
          </Chip>
        ))}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-error">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
