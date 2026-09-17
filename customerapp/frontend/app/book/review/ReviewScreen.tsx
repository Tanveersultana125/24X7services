'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { Pencil } from 'lucide-react'
import type { Route } from 'next'
import {
  addressSchema,
  COL,
  SUB,
  type Address,
  type BusinessConfig,
  type CatalogAppliance,
  type CatalogIssue,
  type CatalogService,
  type PaymentMode,
} from '@app/shared'

import { BookingStep } from '@/components/BookingStep'
import { Card, CardButton } from '@/components/ui/Card'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import {
  fetchAppliance,
  fetchBusinessConfig,
  fetchIssuesFor,
  fetchServicesFor,
} from '@/lib/catalog'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth'
import { formatPaise, formatSlotWindow, relativeDateLabel, shortAddress } from '@/lib/format'
import { patchDraft, useBookingDraft } from '@/lib/bookingDraft'
import { useAsync } from '@/lib/useAsync'

/**
 * Everything, in one place, before anything is charged.
 *
 * The visit fee shown here is read from the catalog, which is public — so it is
 * the same number `createBooking` will price the booking at, but it is not
 * where that number comes from. The server prices it again from the same
 * document inside a transaction, and what it returns is what the payment screen
 * charges. This screen is a quote to read, not a total to trust.
 *
 * Every line has a way back to the step that set it. A customer who spots the
 * wrong address here should not have to press back six times to fix it.
 */

interface ReviewData {
  appliance: CatalogAppliance | null
  service: CatalogService | null
  issues: CatalogIssue[]
  address: Address | null
  config: BusinessConfig | null
}

export function ReviewScreen() {
  const router = useRouter()
  const { draft } = useBookingDraft()
  const { user } = useAuth()
  const uid = user?.uid

  const [mode, setMode] = useState<PaymentMode>(draft.paymentMode ?? 'online')

  const { applianceId, serviceKey, addressId } = draft

  const load = useCallback(async (): Promise<ReviewData> => {
    if (!applianceId || !serviceKey) {
      return { appliance: null, service: null, issues: [], address: null, config: null }
    }

    const [appliance, services, issues, config, address] = await Promise.all([
      fetchAppliance(applianceId),
      fetchServicesFor(applianceId),
      fetchIssuesFor(applianceId),
      fetchBusinessConfig(),
      addressId && uid
        ? getDoc(doc(db(), COL.users, uid, SUB.addresses, addressId)).then(
            (snap) => {
              const parsed = addressSchema.safeParse({
                id: snap.id,
                ...snap.data(),
              })
              return parsed.success ? parsed.data : null
            }
          )
        : Promise.resolve(null),
    ])

    return {
      appliance,
      service: services.find((s) => s.serviceKey === serviceKey) ?? null,
      issues,
      address,
      config,
    }
  }, [applianceId, serviceKey, addressId, uid])

  const data = useAsync(load)
  const service = data.data?.service
  const config = data.data?.config
  const address = data.data?.address ?? draft.address ?? null

  const issueLabels = (draft.issueIds ?? [])
    .map((id) => data.data?.issues.find((issue) => issue.id === id)?.label)
    .filter((label): label is string => Boolean(label))

  function submit(): void {
    patchDraft({ paymentMode: mode })
    router.push('/book/payment')
  }

  return (
    <BookingStep
      stepKey="review"
      title="Check your booking"
      cta={{
        label: mode === 'online' ? 'Pay visit fee' : 'Confirm booking',
        onClick: submit,
        disabled: !service,
      }}
      ctaDetail={
        service ? (
          <p className="text-sm text-muted">
            Visit fee{' '}
            <span className="text-base font-bold text-ink">
              {formatPaise(service.visitFee)}
            </span>
          </p>
        ) : null
      }
    >
      {data.status === 'loading' ? (
        <SkeletonGroup label="Loading" className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </SkeletonGroup>
      ) : data.status === 'error' || !service ? (
        <ErrorState
          className="py-16"
          onRetry={data.reload}
          retrying={data.refreshing}
        />
      ) : (
        <>
          <dl className="mt-5 flex flex-col gap-3">
            <Line
              label="Service"
              value={service.name}
              detail={data.data?.appliance?.name}
              editRoute="/services"
            />
            <Line
              label="Brand"
              value={(draft.brandId ?? '').toUpperCase()}
              editRoute="/book/brand"
            />
            <Line
              label="Appliance"
              value={draft.applianceType ?? 'Not specified'}
              detail={draft.modelNumber}
              editRoute="/book/details"
            />
            <Line
              label="Problem"
              value={
                issueLabels.length > 0
                  ? issueLabels.join(', ')
                  : 'Described in your own words'
              }
              detail={draft.otherIssueText}
              editRoute="/book/issue"
            />
            {draft.media && draft.media.length > 0 ? (
              <Line
                label="Photos"
                value={`${draft.media.length} attached`}
                editRoute="/book/media"
              />
            ) : null}
            <Line
              label="Address"
              value={address ? shortAddress(address) : 'Not chosen'}
              detail={address?.landmark ? `Near ${address.landmark}` : undefined}
              editRoute="/book/address"
            />
            <Line
              label="When"
              value={
                draft.slot
                  ? `${relativeDateLabel(draft.slot.date)}, ${formatSlotWindow(
                      draft.slot.start,
                      draft.slot.end
                    )}`
                  : 'Not chosen'
              }
              editRoute="/book/slot"
            />
            <Line
              label="Expert"
              value={
                draft.techPreference === 'specific'
                  ? 'A specific expert'
                  : draft.techPreference === 'top_rated'
                    ? 'A top-rated expert'
                    : 'Any available expert'
              }
              editRoute="/book/technician"
            />
          </dl>

          <section className="mt-7">
            <h2 className="mb-2 text-sm font-semibold text-muted">
              What you pay now
            </h2>

            <div className="flex flex-col gap-3">
              <CardButton
                onClick={() => setMode('online')}
                selected={mode === 'online'}
                className="p-4"
              >
                <p className="text-sm font-semibold text-ink">
                  Pay {formatPaise(service.visitFee)} now
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  The visit and inspection fee. It confirms your slot straight
                  away.
                </p>
              </CardButton>

              {config?.allowPayAfterService ? (
                <CardButton
                  onClick={() => setMode('pay_after_service')}
                  selected={mode === 'pay_after_service'}
                  className="p-4"
                >
                  <p className="text-sm font-semibold text-ink">
                    Pay after the service
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    Settle everything when the job is done. Your slot is
                    confirmed now.
                  </p>
                </CardButton>
              ) : null}
            </div>

            <Card className="mt-4 p-4">
              <p className="text-sm leading-relaxed text-muted">
                Anything beyond the visit fee is quoted on site, itemised, and
                started only after you approve it. Nothing is charged without
                your say-so.
              </p>
              {config ? (
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Cancelling more than {config.cancellationPolicy.freeUntilHours}{' '}
                  hours before your slot is free. After that a{' '}
                  {formatPaise(config.cancellationPolicy.feePaise)} fee applies.
                </p>
              ) : null}
            </Card>
          </section>
        </>
      )}
    </BookingStep>
  )
}

function Line({
  label,
  value,
  detail,
  editRoute,
}: {
  label: string
  value: string
  detail?: string
  editRoute: Route
}) {
  const router = useRouter()
  return (
    <Card className="flex items-start gap-3 p-4">
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium leading-relaxed text-ink">
          {value}
        </dd>
        {detail ? (
          <dd className="mt-0.5 text-xs leading-relaxed text-muted">{detail}</dd>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => router.push(editRoute)}
        aria-label={`Change ${label.toLowerCase()}`}
        className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </button>
    </Card>
  )
}
