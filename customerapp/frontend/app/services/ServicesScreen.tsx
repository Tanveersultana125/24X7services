'use client'

import { useCallback } from 'react'
import type { CatalogAppliance, CatalogService } from '@app/shared'

import { AppShell, Section } from '@/components/AppShell'
import { Header } from '@/components/Header'
import { ApplianceCard } from '@/components/ApplianceCard'
import { TrustPoints } from '@/components/TrustPoints'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { ApplianceGridSkeleton } from '@/components/SkeletonLoader'
import {
  cheapestByAppliance,
  fetchAllServices,
  fetchAppliances,
} from '@/lib/catalog'
import { formatPaise } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { PackageOpen } from 'lucide-react'

/**
 * Everything we service, and what happens after someone books it.
 *
 * The "how it works" block is here rather than on Home because this is the
 * screen a customer reaches when they are deciding whether to trust the
 * process, not when they already know what they want. The order of those four
 * steps is the actual order of the job, including the one that matters: nobody
 * repairs anything before the customer has said yes to a price.
 */

interface ServicesData {
  appliances: CatalogAppliance[]
  services: CatalogService[]
}

const STEPS = [
  {
    title: 'Pick the appliance and what is wrong',
    detail: 'Brand, model details and the symptoms you have noticed.',
  },
  {
    title: 'Choose a day and a two-hour window',
    detail: 'You pay only the visit fee to confirm the slot.',
  },
  {
    title: 'The expert inspects and quotes',
    detail: 'A written estimate for the repair, itemised, before any work.',
  },
  {
    title: 'You approve, and only then does work start',
    detail: 'Finished with a GST invoice and a service warranty in the app.',
  },
] as const

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

  return (
    <AppShell mobileHeader={<Header title="All services" />}>
      <Section className="mt-5" title="What we service">
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
            {all.data?.appliances.map((appliance, index) => {
              const from = fromPrices?.get(appliance.id)
              return (
                <ApplianceCard
                  key={appliance.id}
                  appliance={appliance}
                  // The tiles on screen before any scrolling.
                  priority={index < 2}
                  fromLabel={
                    from === undefined
                      ? undefined
                      : `Visit from ${formatPaise(from)}`
                  }
                />
              )
            })}
          </div>
        )}
      </Section>

      <Section title="How it works">
        <ol className="flex flex-col gap-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Card className="flex items-start gap-3 p-4">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-bg"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">
                    {step.detail}
                  </span>
                </span>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="What you get either way">
        <Card className="p-4">
          <TrustPoints />
        </Card>
      </Section>
    </AppShell>
  )
}
