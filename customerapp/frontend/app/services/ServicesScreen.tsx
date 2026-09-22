'use client'

import { useCallback } from 'react'
import type { CatalogAppliance, CatalogService } from '@app/shared'

import { AppShell, Section } from '@/components/AppShell'
import { Header } from '@/components/Header'
import { ApplianceCard } from '@/components/ApplianceCard'
import { TrustPoints } from '@/components/TrustPoints'
import { HowItWorks, HOW_IT_WORKS_SUBTITLE } from '@/components/HowItWorks'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { ApplianceGridSkeleton } from '@/components/SkeletonLoader'
import {
  cheapestByAppliance,
  fetchAllServices,
  fetchAppliances,
  summaryByAppliance,
} from '@/lib/catalog'
import { formatPaise } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { PackageOpen } from 'lucide-react'

/**
 * Everything we service, and what happens after someone books it.
 *
 * The "how it works" block is here rather than on Home because this is the
 * screen a customer reaches when they are deciding whether to trust the
 * process, not when they already know what they want. It is the same block the
 * appliance page carries, from the same component, so the two never drift.
 */

interface ServicesData {
  appliances: CatalogAppliance[]
  services: CatalogService[]
}

export function ServicesScreen() {
  const load = useCallback(async (): Promise<ServicesData> => {
    const [appliances, services] = await Promise.all([
      fetchAppliances(),
      fetchAllServices(),
    ])
    return { appliances, services }
  }, [])

  const all = useAsync(load)
  const fromPrices = all.data ? cheapestByAppliance(all.data.services) : null
  // An appliance carries no clip and no score of its own — both are worked
  // out from the services under it, and so is how many there are.
  const summaries = all.data ? summaryByAppliance(all.data.services) : null
  const countFor = (applianceId: string): number =>
    all.data?.services.filter(
      (service) => service.applianceId === applianceId
    ).length ?? 0

  return (
    // Services is a tab, and tabs do not usually carry a back arrow. This one
    // does, because most people do not arrive at it through the tab bar: they
    // tap "All services" at the end of Home's grid, and without an arrow the
    // only way back to where they were is to work out that Home is a tab.
    <AppShell
      mobileHeader={
        <Header title="All services" showBack backFallback="/home" />
      }
    >
      <Section
        className="mt-5"
        title="What we service"
        subtitle="Tap an appliance for its repairs, service and installation, with the visit fee shown before you book."
      >
        {all.status === 'loading' ? (
          <ApplianceGridSkeleton />
        ) : all.status === 'error' ? (
          <ErrorState onRetry={all.reload} retrying={all.refreshing} />
        ) : all.data && all.data.appliances.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="Nothing listed yet"
            description="The catalog is being set up. Please check back shortly."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {all.data?.appliances.map((appliance, index, appliances) => {
              const from = fromPrices?.get(appliance.id)
              const summary = summaries?.get(appliance.id)
              return (
                <ApplianceCard
                  key={appliance.id}
                  appliance={appliance}
                  serviceCount={countFor(appliance.id)}
                  // One tile moves, and it is the first. Five clips in a grid
                  // is a page that twitches; the rest are frames of their own.
                  motion={index === 0}
                  video={summary?.video}
                  poster={summary?.poster}
                  rating={summary?.rating}
                  reviewCount={summary?.reviewCount}
                  // The tiles on screen before any scrolling.
                  priority={index < 2}
                  // The last one, when it would otherwise sit alone in a row.
                  wide={
                    appliances.length % 2 === 1 &&
                    index === appliances.length - 1
                  }
                  from={from === undefined ? undefined : formatPaise(from)}
                />
              )
            })}
          </div>
        )}
      </Section>

      <Section title="How it works" subtitle={HOW_IT_WORKS_SUBTITLE}>
        <HowItWorks />
      </Section>

      <Section title="What you get either way">
        <Card className="p-4">
          <TrustPoints />
        </Card>
      </Section>
    </AppShell>
  )
}
