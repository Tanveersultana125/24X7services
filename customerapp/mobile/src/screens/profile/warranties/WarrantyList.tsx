import { useCallback } from 'react'
import { View } from 'react-native'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { ShieldCheck } from 'lucide-react-native'
import { COL, warrantySchema, type Warranty } from '@app/shared'

import { WarrantyCard } from '@/components/WarrantyCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { Text } from '@/components/ui/Text'
import { fetchAllServices, fetchAppliances } from '@/lib/catalog'
import { db } from '@/lib/firebase'
import { daysUntil } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

export function WarrantyList({ uid }: { uid: string }) {
  const load = useCallback(async () => {
    const [snap, services, appliances] = await Promise.all([
      getDocs(
        query(collection(db(), COL.warranties), where('uid', '==', uid), orderBy('expiresAt', 'asc'), limit(100))
      ),
      fetchAllServices(),
      fetchAppliances(),
    ])

    const warranties: Warranty[] = []
    for (const document of snap.docs) {
      const parsed = warrantySchema.safeParse({ id: document.id, ...document.data() })
      if (parsed.success) warranties.push(parsed.data)
    }

    return { warranties, services, appliances }
  }, [uid])

  const data = useAsync(load)

  if (data.status === 'loading') {
    return (
      <SkeletonGroup label="Loading warranties" className="mt-6 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </SkeletonGroup>
    )
  }

  if (data.status === 'error') {
    return <ErrorState className="py-16" onRetry={data.reload} retrying={data.refreshing} />
  }

  return (
    <WarrantiesView
      warranties={data.data?.warranties ?? []}
      services={data.data?.services ?? []}
      appliances={data.data?.appliances ?? []}
    />
  )
}

/** The list itself, once the reads are in. */
export function WarrantiesView({
  warranties,
  services,
  appliances,
}: {
  warranties: readonly Warranty[]
  services: ReadonlyArray<{ applianceId: string; serviceKey: string; name: string }>
  appliances: ReadonlyArray<{ id: string; name: string }>
}) {
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
    <WarrantyCard
      key={warranty.id}
      warranty={warranty}
      serviceName={
        services.find(
          (service) => service.applianceId === warranty.applianceId && service.serviceKey === warranty.serviceKey
        )?.name ?? 'Service'
      }
      applianceName={appliances.find((a) => a.id === warranty.applianceId)?.name ?? warranty.applianceId}
    />
  )

  return (
    <>
      {active.length > 0 ? (
        <View className="mt-5">
          <Text accessibilityRole="header" className="mb-2 text-sm font-semibold text-muted">
            Still covered
          </Text>
          <View className="gap-3">{active.map(card)}</View>
        </View>
      ) : null}

      {expired.length > 0 ? (
        <View className="mt-7">
          <Text accessibilityRole="header" className="mb-2 text-sm font-semibold text-muted">
            Expired
          </Text>
          <View className="gap-3">{expired.map(card)}</View>
        </View>
      ) : null}
    </>
  )
}
