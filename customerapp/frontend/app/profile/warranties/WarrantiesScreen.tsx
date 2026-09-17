'use client'

import { useCallback } from 'react'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { ShieldCheck } from 'lucide-react'
import { COL, warrantySchema, type Warranty } from '@app/shared'

import { ProfileShell } from '@/components/ProfileShell'
import { WarrantyCard } from '@/components/WarrantyCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { fetchAllServices, fetchAppliances } from '@/lib/catalog'
import { db } from '@/lib/firebase'
import { daysUntil } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

/**
 * Every service warranty, soonest to lapse first.
 *
 * Ordered by expiry rather than by date issued, because the only question this
 * screen answers is "is this still covered" — and the one about to run out is
 * the one worth acting on today.
 */
export function WarrantiesScreen() {
  return (
    <ProfileShell title="Warranties">
      {(user) => <WarrantyList uid={user.uid} />}
    </ProfileShell>
  )
}

function WarrantyList({ uid }: { uid: string }) {
  const load = useCallback(async () => {
    const [snap, services, appliances] = await Promise.all([
      getDocs(
        query(
          collection(db(), COL.warranties),
          where('uid', '==', uid),
          orderBy('expiresAt', 'asc'),
          limit(100)
        )
      ),
      fetchAllServices(),
      fetchAppliances(),
    ])

    const warranties: Warranty[] = []
    for (const document of snap.docs) {
      const parsed = warrantySchema.safeParse({
        id: document.id,
        ...document.data(),
      })
      if (parsed.success) warranties.push(parsed.data)
    }

    return { warranties, services, appliances }
  }, [uid])

  const data = useAsync(load)

  if (data.status === 'loading') {
    return (
      <SkeletonGroup label="Loading warranties" className="mt-6 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
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

  const warranties = data.data?.warranties ?? []
  if (warranties.length === 0) {
    return (
      <EmptyState
        className="py-16"
        icon={ShieldCheck}
        title="No warranties yet"
        description="Every completed repair carries a service warranty, and it appears here the moment the job is done."
        action={{ label: 'Book a service', href: '/services' }}
      />
    )
  }

  const active = warranties.filter((w) => daysUntil(w.expiresAt) > 0)
  const expired = warranties.filter((w) => daysUntil(w.expiresAt) <= 0)

  const card = (warranty: Warranty) => (
    <li key={warranty.id}>
      <WarrantyCard
        warranty={warranty}
        serviceName={
          data.data?.services.find(
            (service) =>
              service.applianceId === warranty.applianceId &&
              service.serviceKey === warranty.serviceKey
          )?.name ?? 'Service'
        }
        applianceName={
          data.data?.appliances.find((a) => a.id === warranty.applianceId)
            ?.name ?? warranty.applianceId
        }
      />
    </li>
  )

  return (
    <>
      {active.length > 0 ? (
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-muted">Still covered</h2>
          <ul className="flex flex-col gap-3">{active.map(card)}</ul>
        </section>
      ) : null}

      {expired.length > 0 ? (
        <section className="mt-7">
          <h2 className="mb-2 text-sm font-semibold text-muted">Expired</h2>
          <ul className="flex flex-col gap-3">{expired.map(card)}</ul>
        </section>
      ) : null}
    </>
  )
}
