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
import { SERVICES_SEARCH_CHIPS } from '@/lib/trending'
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
  const overall = summaries ? overallRating([...summaries.values()]) : undefined
  const lowest = fromPrices && fromPrices.size > 0 ? Math.min(...fromPrices.values()) : undefined

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
      {/* The search field, first: someone who came here to find a thing by
          name should not have to scan a grid for it. It opens the search
          screen rather than searching in place, and the chips under it start
          a search that is known to land. */}
      <div className="mt-3">
        <SearchBar
          readOnly
          prominent
          onOpen={() => router.push('/search')}
        />
        <ul
          aria-label="Popular searches"
          className="mt-2.5 grid grid-cols-2 gap-2 lg:flex lg:flex-wrap"
        >
          {SERVICES_SEARCH_CHIPS.map((chip) => (
            <li key={chip.label}>
              <Link
                href={`/search?q=${encodeURIComponent(chip.query)}` as Route}
                className="flex min-h-10 items-center justify-center gap-1.5 rounded-pill border border-border bg-bg px-3 text-[13px] font-medium text-ink hover:border-brand lg:inline-flex"
              >
                <TrendingUp className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
                <span className="truncate">{chip.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <ServicesHero
        appliances={all.data?.appliances}
        fromPaise={lowest}
        rating={overall}
      />

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
                  // The photograph of a technician on this appliance, when
                  // there is one, and then nothing moves: a grid of people at
                  // work reads as the service, where a drawing reads as a
                  // diagram of it. The clip is the fallback for an appliance
                  // nobody has photographed, and only the first tile plays —
                  // five clips in a grid is a page that twitches.
                  motion={!appliance.heroImage && index === 0}
                  video={appliance.heroImage ? undefined : summary?.video}
                  poster={appliance.heroImage ?? summary?.poster}
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

/** Every appliance's score, weighted by how many reviews stand behind it. */
function overallRating(
  summaries: readonly { rating?: number; reviewCount?: number }[]
): { average: number; count: number } | undefined {
  let score = 0
  let count = 0
  for (const each of summaries) {
    if (each.rating === undefined || each.reviewCount === undefined) continue
    score += each.rating * each.reviewCount
    count += each.reviewCount
  }
  return count > 0 ? { average: score / count, count } : undefined
}
