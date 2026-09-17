'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import {
  applianceIdSchema,
  type ApplianceId,
  type CatalogAppliance,
  type CatalogBrand,
  type CatalogIssue,
  type CatalogService,
} from '@app/shared'

import { AppShell, Section } from '@/components/AppShell'
import { Header } from '@/components/Header'
import { ServiceCard } from '@/components/ServiceCard'
import { BrandDisclaimer } from '@/components/BrandCard'
import { Chip, Tag } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ErrorState'
import { ServiceListSkeleton } from '@/components/SkeletonLoader'
import { MANUFACTURER_WARRANTY_NOTICE } from '@/config/brand'
import { startDraft } from '@/lib/bookingDraft'
import {
  fetchAppliance,
  fetchBrands,
  fetchIssuesFor,
  fetchServicesFor,
} from '@/lib/catalog'
import { useAsync } from '@/lib/useAsync'

/**
 * One appliance: what we do to it, what usually goes wrong with it, and which
 * brands we take.
 *
 * The appliance is a query parameter rather than a path segment. A static
 * export has no server to resolve `/services/[id]`, and `generateStaticParams`
 * would bake today's catalog into the build — a new appliance would need a new
 * release rather than a seed entry.
 */

interface ApplianceData {
  appliance: CatalogAppliance | null
  services: CatalogService[]
  issues: CatalogIssue[]
  brands: CatalogBrand[]
}

export function ApplianceScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const parsed = applianceIdSchema.safeParse(params.get('a'))
  const applianceId: ApplianceId | null = parsed.success ? parsed.data : null

  const load = useCallback(async (): Promise<ApplianceData> => {
    if (!applianceId) {
      return { appliance: null, services: [], issues: [], brands: [] }
    }
    const [appliance, services, issues, brands] = await Promise.all([
      fetchAppliance(applianceId),
      fetchServicesFor(applianceId),
      fetchIssuesFor(applianceId),
      fetchBrands(),
    ])
    return { appliance, services, issues, brands }
  }, [applianceId])

  const data = useAsync(load)
  const appliance = data.data?.appliance ?? null

  // The service a symptom implies. Tapping "Not draining water" should start a
  // repair, not make the customer choose between repair and installation first.
  const repairService =
    data.data?.services.find((service) => service.serviceKey === 'repair') ??
    null

  /**
   * Starting a booking is starting a new draft, not adding to whatever was left
   * half-filled before — a different appliance is a different job.
   *
   * The draft is seeded here rather than from query parameters on the first
   * step, so that step never renders against a draft that has not been written
   * yet and bounces the customer back out of the flow it just sent them into.
   */
  function startBooking(serviceKey: CatalogService['serviceKey'], issueId?: string): void {
    if (!applianceId) return
    startDraft({
      applianceId,
      serviceKey,
      issueIds: issueId ? [issueId] : [],
      techPreference: 'any',
    })
    router.push('/book/brand')
  }

  const unknown =
    applianceId === null || (data.status === 'ready' && appliance === null)

  return (
    <AppShell
      bottomNav={false}
      mobileHeader={
        <Header
          title={appliance?.name ?? 'Services'}
          showBack
          backFallback="/services"
        />
      }
    >
      {unknown ? (
        <ErrorState
          kind="notFound"
          className="py-20"
          title="We could not find that appliance"
          description="It may have been removed from the catalog. Browse everything we service instead."
        />
      ) : data.status === 'error' ? (
        <ErrorState
          className="py-20"
          onRetry={data.reload}
          retrying={data.refreshing}
        />
      ) : data.status === 'loading' || !appliance ? (
        <div className="mt-6">
          <ServiceListSkeleton />
        </div>
      ) : (
        <>
          <section className="mt-5 flex items-center gap-4">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-card bg-surface">
              <Image
                src={appliance.image}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-ink">{appliance.name}</h1>
              <p className="mt-1 text-sm text-muted">
                Repair, service and installation at your doorstep.
              </p>
            </div>
          </section>

          <Section title="Choose a service">
            <div className="flex flex-col gap-3">
              {data.data?.services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onSelect={() => startBooking(service.serviceKey)}
                />
              ))}
            </div>
          </Section>

          {data.data && data.data.issues.length > 0 ? (
            <Section title="Common problems">
              <p className="-mt-1 mb-3 text-sm text-muted">
                {repairService
                  ? 'Tap what you are seeing and we will start a repair booking with it noted.'
                  : 'What people most often call us about for this appliance.'}
              </p>
              <ul className="flex flex-wrap gap-2">
                {data.data.issues.map((issue) => (
                  <li key={issue.id}>
                    {repairService ? (
                      <Chip
                        onClick={() =>
                          startBooking(repairService.serviceKey, issue.id)
                        }
                      >
                        {issue.label}
                      </Chip>
                    ) : (
                      <Tag>{issue.label}</Tag>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {data.data && data.data.brands.length > 0 ? (
            <Section title="Brands we take">
              <ul className="flex flex-wrap gap-2">
                {data.data.brands.map((brand) => (
                  <li
                    key={brand.id}
                    className="rounded-card border border-border px-4 py-3 text-sm font-bold tracking-[0.08em] text-ink"
                  >
                    {brand.wordmark}
                  </li>
                ))}
              </ul>
              <BrandDisclaimer className="mt-3" />
            </Section>
          ) : null}

          <Section>
            {/* Said here, before a slot is chosen, rather than after the job. */}
            <Card className="p-4 text-sm leading-relaxed text-muted">
              {MANUFACTURER_WARRANTY_NOTICE}
            </Card>
          </Section>
        </>
      )}
    </AppShell>
  )
}
