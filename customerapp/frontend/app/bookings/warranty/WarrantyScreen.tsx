'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { doc, getDoc } from 'firebase/firestore'
import { Check, ShieldCheck, ShieldX, X } from 'lucide-react'
import { COL, warrantySchema, type Booking, type Warranty } from '@app/shared'

import { BookingShell } from '@/components/BookingShell'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { db } from '@/lib/firebase'
import { daysUntil, formatDateTime } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

/**
 * What the service warranty covers, and what it does not.
 *
 * Both lists, side by side, at the same size. A warranty that prints what it
 * covers in bold and what it excludes in grey at the bottom is a warranty
 * written to be misread, and the argument it saves today costs more later.
 *
 * The terms come from the warranty document rather than from config, because
 * they were agreed on the day the job finished and must keep saying that.
 */
export function WarrantyScreen() {
  return (
    <BookingShell title="Service warranty">
      {({ booking }) => <WarrantyBody booking={booking} />}
    </BookingShell>
  )
}

function WarrantyBody({ booking }: { booking: Booking }) {
  const warrantyId = booking.warrantyId

  const load = useCallback(async (): Promise<Warranty | null> => {
    if (!warrantyId) return null
    const snap = await getDoc(doc(db(), COL.warranties, warrantyId))
    const parsed = warrantySchema.safeParse({ id: snap.id, ...snap.data() })
    return parsed.success ? parsed.data : null
  }, [warrantyId])

  const warranty = useAsync(load)

  if (!warrantyId) {
    return (
      <EmptyState
        className="py-16"
        icon={ShieldCheck}
        title="No warranty yet"
        description="A service warranty starts the moment a job is marked complete."
      />
    )
  }

  if (warranty.status === 'loading') {
    return (
      <SkeletonGroup label="Loading warranty" className="mt-6 flex flex-col gap-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </SkeletonGroup>
    )
  }

  if (warranty.status === 'error' || !warranty.data) {
    return (
      <ErrorState
        className="py-16"
        onRetry={warranty.reload}
        retrying={warranty.refreshing}
      />
    )
  }

  const remaining = daysUntil(warranty.data.expiresAt)
  const active = remaining > 0

  return (
    <>
      <Card className="mt-5 p-5 text-center">
        <span
          className={`mx-auto flex size-14 items-center justify-center rounded-full ${
            active ? 'bg-success-soft' : 'bg-surface'
          }`}
        >
          {active ? (
            <ShieldCheck className="size-7 text-success" aria-hidden="true" />
          ) : (
            <ShieldX className="size-7 text-muted" aria-hidden="true" />
          )}
        </span>
        <p className="mt-3 text-2xl font-bold text-ink">
          {active
            ? remaining === 1
              ? '1 day left'
              : `${remaining} days left`
            : 'Expired'}
        </p>
        <p className="mt-1 text-sm text-muted">
          {active ? 'Valid until' : 'Expired on'}{' '}
          {formatDateTime(warranty.data.expiresAt)}
        </p>
      </Card>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-muted">What is covered</h2>
        <ul className="flex flex-col gap-2">
          {warranty.data.covers.map((line) => (
            <li key={line}>
              <Card className="flex items-start gap-3 p-4">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-success"
                  aria-hidden="true"
                />
                <span className="text-sm leading-relaxed text-ink">{line}</span>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-muted">
          What is not covered
        </h2>
        <ul className="flex flex-col gap-2">
          {warranty.data.excludes.map((line) => (
            <li key={line}>
              <Card className="flex items-start gap-3 p-4">
                <X
                  className="mt-0.5 size-4 shrink-0 text-muted"
                  aria-hidden="true"
                />
                <span className="text-sm leading-relaxed text-ink">{line}</span>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {active ? (
        <Card className="mt-6 p-4">
          <p className="text-sm leading-relaxed text-muted">
            If the same fault comes back while this is valid, open a support
            request against booking {booking.displayId} and the return visit
            costs nothing.
          </p>
          <Link
            href={'/support' as Route}
            className="mt-3 inline-flex min-h-11 items-center rounded-pill border border-ink px-5 text-sm font-semibold text-ink"
          >
            Report the same fault
          </Link>
        </Card>
      ) : null}
    </>
  )
}
