'use client'

import { useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Route } from 'next'
import {
  applianceIdSchema,
  serviceKeySchema,
  type CatalogAppliance,
  type CatalogIssue,
  type CatalogService,
} from '@app/shared'

import { Header } from '@/components/Header'
import {
  BottomNavigation,
  BOTTOM_NAV_CLEARANCE,
} from '@/components/BottomNavigation'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { ServiceDetails } from '@/components/ServiceSheet'
import {
  fetchAppliance,
  fetchIssuesFor,
  fetchServicesFor,
} from '@/lib/catalog'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * One service, in full, on a page of its own — where a shared link lands,
 * and where "Rate card" leads.
 *
 * It is the same thing the sheet shows when a service is tapped on Home or on
 * an appliance page, laid out full width: photographs across the top, the
 * name and what it starts at, the choices it needs, then how it goes, who
 * comes, the brands, the promise, what is not included, the questions and the
 * reviews, with Add pinned at the foot. One design wherever a service is
 * opened; a page that said one thing and a sheet another would leave a
 * customer wondering which was current.
 *
 * Everything on it is read from the catalog, the business config, the brands
 * list and the reviews — see `ServiceDetails`.
 */

interface DetailData {
  appliance: CatalogAppliance | null
  service: CatalogService | null
  issues: CatalogIssue[]
}

export function ServiceDetailScreen() {
  const params = useSearchParams()
  const appliance = applianceIdSchema.safeParse(params.get('a'))
  const key = serviceKeySchema.safeParse(params.get('s'))

  const applianceId = appliance.success ? appliance.data : null
  const serviceKey = key.success ? key.data : null

  const load = useCallback(async (): Promise<DetailData> => {
    if (!applianceId || !serviceKey) {
      return { appliance: null, service: null, issues: [] }
    }
    const [found, services, issues] = await Promise.all([
      fetchAppliance(applianceId),
      fetchServicesFor(applianceId),
      fetchIssuesFor(applianceId),
    ])
    return {
      appliance: found,
      service: services.find((each) => each.serviceKey === serviceKey) ?? null,
      issues,
    }
  }, [applianceId, serviceKey])

  const data = useAsync(load)
  const service = data.data?.service ?? null

  const missing =
    !applianceId || !serviceKey || (data.status === 'ready' && !service)

  return (
    <div className="min-h-dvh bg-bg">
      <Header
        title={service?.name ?? 'Service'}
        showBack
        backFallback={
          (applianceId
            ? `/services/appliance?a=${applianceId}`
            : '/services') as Route
        }
      />

      <main
        id="content"
        className={cn(
          'mx-auto w-full max-w-lg px-4 lg:max-w-2xl',
          BOTTOM_NAV_CLEARANCE
        )}
      >
        {missing ? (
          <ErrorState
            className="py-20"
            kind="notFound"
            title="We could not find that service"
            description="It may have been renamed or withdrawn. Everything we service is one tap away."
          />
        ) : data.status === 'error' ? (
          <ErrorState
            className="py-20"
            onRetry={data.reload}
            retrying={data.refreshing}
          />
        ) : data.status === 'loading' || !service ? (
          <SkeletonGroup label="Loading" className="mt-5 flex flex-col gap-4">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </SkeletonGroup>
        ) : (
          <ServiceDetails
            variant="page"
            service={service}
            appliance={data.data?.appliance ?? undefined}
            issues={data.data?.issues ?? []}
          />
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}
