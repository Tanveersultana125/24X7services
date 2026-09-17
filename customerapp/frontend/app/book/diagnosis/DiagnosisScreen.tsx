'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lightbulb, Stethoscope } from 'lucide-react'

import { BookingStep } from '@/components/BookingStep'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { callFn } from '@/lib/callables'
import { patchDraft, useBookingDraft } from '@/lib/bookingDraft'
import { useAsync } from '@/lib/useAsync'

/**
 * What might be wrong, and what it is not.
 *
 * This is a lookup against the catalog, not a diagnosis and not a model. The
 * wording says so in three places and never softens: "possible causes", "your
 * expert will confirm", and no price anywhere on the screen. A number beside a
 * cause would read as a quote for a repair nobody has looked at yet, and a
 * customer who arrives at the review screen expecting that figure has been
 * misled by this one.
 *
 * What is shown is recorded on the booking. If a customer later says they were
 * told it was the compressor, the record is of what this screen actually put in
 * front of them.
 */
export function DiagnosisScreen() {
  const router = useRouter()
  const { draft } = useBookingDraft()
  const applianceId = draft.applianceId
  const issueIds = draft.issueIds ?? []
  const issueKey = issueIds.join(',')

  const load = useCallback(async () => {
    if (!applianceId || issueIds.length === 0) {
      return { possibleCauses: [], tips: [] }
    }
    return callFn('getDiagnosis', {
      applianceId,
      // The callable takes ten at most; nobody ticks more than that in practice.
      issueIds: issueIds.slice(0, 10),
    })
    // issueKey stands in for the array, which is a new object every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applianceId, issueKey])

  const diagnosis = useAsync(load)
  const causes = diagnosis.data?.possibleCauses ?? []
  const tips = diagnosis.data?.tips ?? []

  // Recorded as soon as it is on screen, so the booking matches what was read.
  useEffect(() => {
    if (diagnosis.status !== 'ready') return
    patchDraft({ diagnosisShown: causes })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagnosis.status, causes.join('|')])

  return (
    <BookingStep
      stepKey="diagnosis"
      title="What it might be"
      cta={{ label: 'Continue', onClick: () => router.push('/book/media') }}
    >
      {diagnosis.status === 'loading' ? (
        <SkeletonGroup label="Loading" className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </SkeletonGroup>
      ) : diagnosis.status === 'error' ? (
        <ErrorState
          className="py-16"
          onRetry={diagnosis.reload}
          retrying={diagnosis.refreshing}
          description="We could not load the possible causes. You can carry on booking without them."
        />
      ) : causes.length === 0 ? (
        <Card className="mt-6 p-4">
          <p className="text-sm leading-relaxed text-muted">
            We do not have common causes listed for what you described. Your
            expert will inspect it and explain what they find before any work
            starts.
          </p>
        </Card>
      ) : (
        <>
          <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-muted">
            <Stethoscope
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            These are the usual reasons for what you described. None of it is
            confirmed — your expert checks the appliance on site and tells you
            what it actually is before anything is repaired.
          </p>

          <section className="mt-6">
            <h2 className="text-sm font-semibold text-muted">Possible causes</h2>
            <ul className="mt-2 flex flex-col gap-2">
              {causes.map((cause) => (
                <li key={cause}>
                  <Card className="p-4 text-sm leading-relaxed text-ink">
                    {cause}
                  </Card>
                </li>
              ))}
            </ul>
          </section>

          {tips.length > 0 ? (
            <section className="mt-7">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted">
                <Lightbulb className="size-4" aria-hidden="true" />
                Worth trying first
              </h2>
              <ul className="mt-2 flex flex-col gap-2">
                {tips.map((tip) => (
                  <li
                    key={tip}
                    className="rounded-card bg-surface px-4 py-3 text-sm leading-relaxed text-ink"
                  >
                    {tip}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">
                If one of these fixes it, you can stop here — no visit needed.
              </p>
            </section>
          ) : null}
        </>
      )}
    </BookingStep>
  )
}
