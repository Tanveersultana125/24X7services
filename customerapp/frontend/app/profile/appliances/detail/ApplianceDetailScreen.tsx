'use client'

import { useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { PackageOpen, WashingMachine } from 'lucide-react'
import {
  bookingSchema,
  COL,
  SUB,
  userApplianceInputSchema,
  type Booking,
  type UserApplianceInput,
} from '@app/shared'

import { ProfileShell, SignInPrompt } from '@/components/ProfileShell'
import { BookingCard } from '@/components/BookingCard'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { fetchAllServices, fetchAppliances } from '@/lib/catalog'
import { db } from '@/lib/firebase'
import { relativeTime } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

/**
 * One saved appliance and everything we have done to it.
 *
 * The history is the point. A fridge that has been repaired three times in a
 * year is a fridge worth replacing, and the customer is the only one in a
 * position to draw that conclusion — so the record is theirs to see, plainly,
 * without anyone selling them the fourth repair.
 */
export function ApplianceDetailScreen() {
  const params = useSearchParams()
  const applianceDocId = params.get('id')

  return (
    <ProfileShell
      title="Appliance"
      backFallback="/profile/appliances"
      signedOut={
        <SignInPrompt
          icon={WashingMachine}
          title="This appliance"
          description="Its details and everything we have ever done to it are on your account. Log in to see them."
          // The only profile screen identified by a query parameter, so it
          // hands the way back over itself rather than losing the id.
          next={
            applianceDocId
              ? `/profile/appliances/detail?id=${encodeURIComponent(applianceDocId)}`
              : '/profile/appliances'
          }
        />
      }
    >
      {(user) => (
        <ApplianceDetail uid={user.uid} applianceDocId={applianceDocId} />
      )}
    </ProfileShell>
  )
}

function ApplianceDetail({
  uid,
  applianceDocId,
}: {
  uid: string
  applianceDocId: string | null
}) {
  const load = useCallback(async () => {
    if (!applianceDocId) return null

    const snap = await getDoc(
      doc(db(), COL.users, uid, SUB.appliances, applianceDocId)
    )
    const parsed = userApplianceInputSchema.safeParse(snap.data())
    if (!snap.exists() || !parsed.success) return null

    const [catalog, services, history] = await Promise.all([
      fetchAppliances(),
      fetchAllServices(),
      getDocs(
        query(
          collection(db(), COL.bookings),
          where('uid', '==', uid),
          where('userApplianceId', '==', applianceDocId),
          orderBy('createdAt', 'desc'),
          limit(20)
        )
      ),
    ])

    const bookings: Booking[] = []
    for (const document of history.docs) {
      const booking = bookingSchema.safeParse({
        id: document.id,
        ...document.data(),
      })
      if (booking.success) bookings.push(booking.data)
    }

    const lastServicedAt = snap.data()?.lastServicedAt
    return {
      appliance: parsed.data as UserApplianceInput,
      lastServicedAt:
        typeof lastServicedAt === 'number' ? lastServicedAt : undefined,
      applianceName:
        catalog.find((a) => a.id === parsed.data.applianceId)?.name ??
        parsed.data.applianceId,
      services,
      bookings,
    }
  }, [uid, applianceDocId])

  const data = useAsync(load)

  if (data.status === 'loading') {
    return (
      <SkeletonGroup label="Loading" className="mt-6 flex flex-col gap-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </SkeletonGroup>
    )
  }

  if (data.status === 'error') {
    return (
      <ErrorState
        className="py-16"
        onRetry={data.reload}
        retrying={data.refreshing}
      />
    )
  }

  if (!data.data) {
    return (
      <EmptyState
        className="py-16"
        icon={PackageOpen}
        title="We could not find that appliance"
        description="It may have been removed from your saved list."
        action={{ label: 'Back to my appliances', href: '/profile/appliances' }}
      />
    )
  }

  const { appliance, applianceName, lastServicedAt, services, bookings } =
    data.data

  return (
    <>
      <Card className="mt-5 p-4">
        <h1 className="text-lg font-bold text-ink">
          {appliance.nickname ?? applianceName}
        </h1>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <Row label="Appliance" value={applianceName} />
          <Row label="Brand" value={appliance.brandId.toUpperCase()} />
          {appliance.type ? <Row label="Type" value={appliance.type} /> : null}
          {appliance.modelNumber ? (
            <Row label="Model" value={appliance.modelNumber} />
          ) : null}
          <Row
            label="Last serviced"
            value={
              lastServicedAt ? relativeTime(lastServicedAt) : 'Not by us yet'
            }
          />
        </dl>
      </Card>

      <section className="mt-7">
        <h2 className="mb-3 text-sm font-semibold text-muted">
          Service history
        </h2>

        {bookings.length === 0 ? (
          <Card className="p-4 text-sm text-muted">
            Nothing yet. Bookings made against this appliance collect here.
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <BookingCard
                  booking={booking}
                  serviceName={
                    services.find(
                      (service) =>
                        service.applianceId === booking.applianceId &&
                        service.serviceKey === booking.serviceKey
                    )?.name ?? 'Service'
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href={
          `/services/appliance/?a=${appliance.applianceId}` as Route
        }
        className="mt-6 flex min-h-12 items-center justify-center rounded-pill border border-ink px-5 text-sm font-semibold text-ink"
      >
        Book this appliance again
      </Link>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  )
}
