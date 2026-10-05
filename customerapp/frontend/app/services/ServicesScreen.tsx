'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import type { CatalogAppliance, CatalogService } from '@app/shared'

import { AppShell, Section } from '@/components/AppShell'
import { Header } from '@/components/Header'
import { CartButton } from '@/components/CartButton'
import { SearchBar } from '@/components/SearchBar'
import { ServicesHero } from '@/components/ServicesHero'
import { SERVICES_QUICK_LINKS } from '@/lib/trending'
import { ApplianceSpaceCard } from '@/components/ApplianceSpaceCard'
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
import { PackageOpen, TrendingUp } from 'lucide-react'

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
  const router = useRouter()
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
        <Header
          title="All services"
          showBack
          backFallback="/home"
          right={<CartButton className="mr-2 size-11" />}
        />
      }
    >
      <ServicesHero />

      {/* The search field floats over the foot of the photograph: the first
          thing to reach for, and it ties the picture to the page. It opens
          the search screen rather than searching in place; the chips under it
          open their service on the appliance page directly. */}
      <div className="relative z-10 -mt-8">
        <SearchBar
          readOnly
          prominent
          onOpen={() => router.push('/search')}
        />
        <ul
          aria-label="Popular services"
          className="mt-3 grid grid-cols-2 gap-2 lg:flex lg:flex-wrap"
        >
          {SERVICES_QUICK_LINKS.map((chip) => (
            <li key={chip.label}>
              <Link
                // The trailing slash: the static export serves the folder's index.html.
                href={`/services/appliance/?a=${chip.applianceId}&s=${chip.serviceKey}` as Route}
                className="flex min-h-10 items-center justify-center gap-1.5 rounded-pill border border-border bg-bg px-3 text-[13px] font-medium text-ink hover:border-brand lg:inline-flex"
              >
                <TrendingUp className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
                <span className="truncate">{chip.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* The appliances as tall photographs on a rail, the way a catalogue
          of rooms is browsed: the picture says what it is before the name
          does. */}
      <Section className="mt-8" title="What we service">
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
          <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
            {all.data?.appliances.map((appliance, index) => {
              const from = fromPrices?.get(appliance.id)
              return (
                <li key={appliance.id} className="w-[46%] shrink-0 snap-start lg:w-auto">
                  <ApplianceSpaceCard
                    appliance={appliance}
                    serviceCount={countFor(appliance.id)}
                    from={from === undefined ? undefined : formatPaise(from)}
                    rating={summaries?.get(appliance.id)?.rating}
                    priority={index < 2}
                  />
                </li>
              )
            })}
          </ul>
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
