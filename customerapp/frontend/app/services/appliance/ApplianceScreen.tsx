'use client'

import { useCallback, useEffect, useRef } from 'react'
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
import { HowItWorks, HOW_IT_WORKS_SUBTITLE } from '@/components/HowItWorks'
import { TrustPoints } from '@/components/TrustPoints'
import { Button } from '@/components/ui/Button'
import { Chip, Tag } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { StickyCTA, StickySpacer } from '@/components/StickyCTA'
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
import { formatPaise } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

/**
 * One appliance: what we do to it, what usually goes wrong with it, and which
 * brands we take.
 *
 * The screen is built the way the big marketplaces build theirs, because that
 * shape is what a customer already knows how to read: the appliance and its
 * cheapest visit fee at the top, a row of the services on it that jumps down
 * the page, then those services priced one per row, and a bar at the bottom
 * that books the common one without scrolling back up. The rest of the page —
 * the four steps, the promises, the brands, the warranty note — is the same
 * content the services screen carries, from the same components, so a customer
 * who arrived here from a shared link is told the same things in the same
 * order as one who browsed in.
 *
 * The appliance is a query parameter rather than a path segment. A static
 * export has no server to resolve `/services/[id]`, and `generateStaticParams`
 * would bake today's catalog into the build — a new appliance would need a new
 * release rather than a seed entry.
 *
 * A second parameter, `s`, names the service to open at. It is how the sheet
 * on Home hands over: a customer who tapped "Deep clean" lands on the deep
 * clean, not at the top of a page they now have to search. A fragment would
 * have been the obvious way to do that and does not work here — the anchor
 * does not exist when the URL is followed, because the catalog has not
 * arrived yet, so the browser scrolls nowhere and the customer sees the top
 * of the page anyway.
 */

interface ApplianceData {
  appliance: CatalogAppliance | null
  services: CatalogService[]
  issues: CatalogIssue[]
  brands: CatalogBrand[]
}

/**
 * How far down a jump from the service row has to stop.
 *
 * The mobile header and the row itself are both stuck to the top, so a browser
 * left to itself parks the heading underneath them. These are their heights.
 */
const JUMP_OFFSET = 'scroll-mt-[calc(7.75rem+var(--safe-top))] lg:scroll-mt-[8.5rem]'

export function ApplianceScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const parsed = applianceIdSchema.safeParse(params.get('a'))
  const openAt = params.get('s')
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
  const services = data.data?.services ?? []

  // The service a symptom implies. Tapping "Not draining water" should start a
  // repair, not make the customer choose between repair and installation first.
  const repairService =
    services.find((service) => service.serviceKey === 'repair') ?? null

  // What the bottom bar books, and what the price at the top is "from". When
  // the customer arrived on one service in particular, that is the one the bar
  // offers — anything else asks them to pick again what they just picked.
  const requested =
    services.find((service) => service.serviceKey === openAt) ?? null
  const headline = requested ?? repairService ?? services[0] ?? null
  const cheapestFee = services.length
    ? Math.min(...services.map((service) => service.visitFee))
    : null

  /**
   * Scroll to the service named in the URL, once it is on the page.
   *
   * After the catalog lands, not before: at navigation time the list does not
   * exist, which is why a fragment could not do this. Once only — `done` is a
   * ref rather than state so a re-render cannot fire it again and drag the
   * page back from wherever the customer has since scrolled.
   *
   * `scroll-mt` on the row keeps the sticky header off it, so the service
   * lands below the bar rather than under it.
   */
  const scrolled = useRef(false)
  useEffect(() => {
    if (scrolled.current || !requested) return
    const row = document.getElementById(`service-${requested.id}`)
    if (!row) return

    scrolled.current = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    row.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [requested])

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
          <section className="mt-5">
            <Card className="overflow-hidden" raised>
              <div className="flex items-center gap-4 bg-brand-soft p-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-card bg-bg sm:size-24">
                  <Image
                    src={appliance.image}
                    alt=""
                    fill
                    sizes="96px"
                    // Contained, for the reason the grid tile is: these are
                    // drawings with their own margins, and filling a square
                    // with one takes the appliance's feet off.
                    className="object-contain p-2"
                    priority
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-ink sm:text-2xl">
                    {appliance.name}
                  </h1>
                  <p className="mt-1 text-sm text-muted">
                    Repair, service and installation at your doorstep.
                  </p>
                  {cheapestFee !== null ? (
                    <p className="mt-2 text-sm text-muted">
                      Visit from{' '}
                      <span className="font-bold text-ink">
                        {formatPaise(cheapestFee)}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="p-4">
                <TrustPoints compact />
              </div>
            </Card>
          </section>

          {/* The jump row. Worth its space once there are enough services that
              the last one is off the bottom of the screen; below that it is a
              table of contents for a list you can already see. */}
          {services.length >= 3 ? (
            <nav
              aria-label="Services on this appliance"
              className="sticky top-[calc(3.5rem+var(--safe-top))] z-20 -mx-4 mt-6 border-b border-border bg-bg px-4 py-2 lg:top-16 lg:mx-0 lg:px-0"
            >
              <ul className="no-scrollbar flex gap-2 overflow-x-auto">
                {services.map((service) => (
                  <li key={service.id}>
                    <a
                      href={`#service-${service.id}`}
                      className="inline-flex min-h-11 items-center rounded-pill border border-border bg-bg px-4 text-sm font-medium whitespace-nowrap text-ink transition-colors duration-[var(--duration-fast)] hover:border-brand"
                    >
                      {service.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <Section
            title="Choose a service"
            subtitle="The visit fee is what you pay to book. Everything after it is quoted first."
          >
            <div className="flex flex-col gap-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  id={`service-${service.id}`}
                  className={JUMP_OFFSET}
                >
                  <ServiceCard
                    service={service}
                    image={appliance.image}
                    onSelect={() => startBooking(service.serviceKey)}
                  />
                </div>
              ))}
            </div>
          </Section>

          {data.data && data.data.issues.length > 0 ? (
            <Section
              title="Common problems"
              subtitle={
                repairService
                  ? 'Tap what you are seeing and we will start a repair booking with it noted.'
                  : 'What people most often call us about for this appliance.'
              }
            >
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

          <Section title="How it works" subtitle={HOW_IT_WORKS_SUBTITLE}>
            <HowItWorks />
          </Section>

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

          {headline ? (
            <>
              <StickySpacer aboveBottomNav />
              <StickyCTA
                aboveBottomNav
                detail={
                  <>
                    <p className="truncate text-sm font-semibold text-ink">
                      {headline.name}
                    </p>
                    <p className="text-xs text-muted">
                      {formatPaise(headline.visitFee)} visit fee
                    </p>
                  </>
                }
              >
                <Button
                  size="md"
                  onClick={() => startBooking(headline.serviceKey)}
                >
                  Book a visit
                </Button>
              </StickyCTA>
            </>
          ) : null}
        </>
      )}
    </AppShell>
  )
}
