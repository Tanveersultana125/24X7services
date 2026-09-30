'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Route } from 'next'
import { Check, ChevronRight, ShieldCheck, Star } from 'lucide-react'
import {
  applianceIdSchema,
  type ApplianceId,
  type BusinessConfig,
  type CatalogAppliance,
  type CatalogBrand,
  type CatalogPlan,
  type CatalogIssue,
  type CatalogService,
  type ServiceKey,
  type ServiceReview,
} from '@app/shared'

import { AppShell, Section } from '@/components/AppShell'
import { Header } from '@/components/Header'
import { CartButton } from '@/components/CartButton'
import { ServiceRow } from '@/components/ServiceRow'
import { SectionMenu } from '@/components/SectionMenu'
import { typeLabel, typePhoto } from '@/lib/applianceTypes'
import { ReviewsSheet } from '@/components/ReviewsSheet'
import { OfferBanner } from '@/components/OfferBanner'
import { AddButton, durationNote } from '@/components/ServiceRail'
import { ServiceReviews } from '@/components/ServiceReviews'
import { WriteReviewButton } from '@/components/WriteReviewButton'
import { ServiceSheet, serviceOptions } from '@/components/ServiceSheet'
import { CartBar } from '@/components/CartBar'
import { BrandDisclaimer } from '@/components/BrandCard'
import { BrandLogoRow } from '@/components/BrandLogoRow'
import { HowItWorks, HOW_IT_WORKS_SUBTITLE } from '@/components/HowItWorks'
import { TrustPoints } from '@/components/TrustPoints'
import { Chip, Tag } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ErrorState'
import { ServiceListSkeleton } from '@/components/SkeletonLoader'
import { MANUFACTURER_WARRANTY_NOTICE } from '@/config/brand'
import { startDraft } from '@/lib/bookingDraft'
import { useCart } from '@/lib/cart'
import {
  fetchAppliance,
  fetchBrands,
  fetchBusinessConfig,
  fetchIssuesFor,
  fetchServiceReviews,
  fetchServicesFor,
  summaryByAppliance,
} from '@/lib/catalog'
import { countNote } from '@/components/ServiceScore'
import { ApplianceHero, type HeroSlide } from '@/components/ApplianceHero'
import { EarliestSlot, useEarliestSlot } from '@/components/EarliestSlot'
import { fetchCatalogPlans } from '@/lib/plans'
import { formatPaise } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

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
  config: BusinessConfig | null
  services: CatalogService[]
  issues: CatalogIssue[]
  brands: CatalogBrand[]
  reviews: ServiceReview[]
  plans: CatalogPlan[]
}

/**
 * How far down a jump from the service row has to stop.
 *
 * The mobile header is stuck to the top, so a browser left to itself parks the
 * heading underneath it. This is its height and a little air.
 */
const JUMP_OFFSET = 'scroll-mt-[calc(4.5rem+var(--safe-top))] lg:scroll-mt-20'

/**
 * The heading over each group in the service list, pinned under the header
 * while the group's rows scroll past it.
 */
const GROUP_HEADING =
  'sticky top-[calc(3.5rem+var(--safe-top))] z-20 -mx-4 bg-bg px-4 py-4 text-2xl font-bold text-ink lg:top-16 lg:mx-0 lg:px-0'

/** Where a jump to a row stops: under the header and the pinned heading. */
const ROW_OFFSET =
  'scroll-mt-[calc(8rem+var(--safe-top))] lg:scroll-mt-36'

/**
 * The service list's groups, in the order their first service comes in the
 * catalog. A group a given appliance has nothing in is left out, and its name
 * says only what it holds — "Repair" for a repair alone, "Repair & gas
 * refill" once there is a refill to go with it.
 */
const GROUPS: ReadonlyArray<{
  key: string
  keys: readonly ServiceKey[]
  title: (present: ReadonlySet<ServiceKey>) => string
}> = [
  {
    key: 'service',
    keys: ['service', 'deep-clean', 'maintenance'],
    title: () => 'Service',
  },
  {
    key: 'repair',
    keys: ['repair', 'gas-refill'],
    title: (present) =>
      present.has('gas-refill')
        ? present.has('repair')
          ? 'Repair & gas refill'
          : 'Gas refill'
        : 'Repair',
  },
  {
    key: 'fitting',
    keys: ['installation', 'uninstallation'],
    title: (present) =>
      present.has('installation') && present.has('uninstallation')
        ? 'Installation & uninstallation'
        : present.has('installation')
          ? 'Installation'
          : 'Uninstallation',
  },
]

function groupServices(services: readonly CatalogService[]) {
  return GROUPS.map((group) => {
    const members = services.filter((service) =>
      group.keys.includes(service.serviceKey)
    )
    const present = new Set(members.map((service) => service.serviceKey))
    return { key: group.key, title: group.title(present), services: members }
  })
    .filter((group) => group.services.length > 0)
    .sort(
      (a, b) =>
        Math.min(...a.services.map((s) => s.order)) -
        Math.min(...b.services.map((s) => s.order))
    )
}

/** How much the plan saves on the same visits booked one at a time, in %. */
function planSaving(plan: CatalogPlan): number | null {
  if (!plan.compareAt || plan.compareAt <= plan.price) return null
  return Math.round((1 - plan.price / plan.compareAt) * 100)
}

/**
 * What each picture in the service row is called: the service's name without
 * the words every service here starts with.
 *
 * Under an 88px picture "Washing Machine Installation" is three lines of which
 * the first two say what the page's own heading already says. The shared words
 * are found rather than listed, because the catalog calls the appliance "Air
 * Conditioner" and its services "AC …" — no appliance name would strip them.
 */
function shortLabels(services: readonly CatalogService[]): Map<string, string> {
  const words = services.map((service) => service.name.split(' '))
  let shared = 0
  while (
    words.length > 1 &&
    words.every(
      (w) => w.length > shared + 1 && w[shared] === words[0]?.[shared]
    )
  ) {
    shared += 1
  }
  return new Map(
    services.map((service, index) => [
      service.id,
      (words[index] ?? []).slice(shared).join(' ') || service.name,
    ])
  )
}

export function ApplianceScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const parsed = applianceIdSchema.safeParse(params.get('a'))
  const openAt = params.get('s')
  const applianceId: ApplianceId | null = parsed.success ? parsed.data : null

  const load = useCallback(async (): Promise<ApplianceData> => {
    if (!applianceId) {
      return {
        appliance: null,
        config: null,
        services: [],
        issues: [],
        brands: [],
        reviews: [],
        plans: [],
      }
    }
    const [appliance, config, services, issues, brands, plans] = await Promise.all([
      fetchAppliance(applianceId),
      // Only for the warranty line. A failed read leaves the strip out rather
      // than the page, which is the right trade for one sentence.
      fetchBusinessConfig(),
      fetchServicesFor(applianceId),
      fetchIssuesFor(applianceId),
      fetchBrands(),
      // Only for the plan tile in the service row, which is left out when
      // this fails rather than taking the page with it.
      fetchCatalogPlans().catch(() => [] as CatalogPlan[]),
    ])
    // Every service's reviews, pooled and newest first. A failed read leaves
    // the section empty rather than taking the price list down with it.
    const reviews = (
      await Promise.all(
        services.map((service) =>
          fetchServiceReviews(applianceId, service.serviceKey).catch(
            () => [] as ServiceReview[]
          )
        )
      )
    )
      .flat()
      .sort((a, b) => b.createdAt - a.createdAt)
    return { appliance, config, services, issues, brands, reviews, plans }
  }, [applianceId])

  const data = useAsync(load)
  const appliance = data.data?.appliance ?? null
  const services = data.data?.services ?? []
  const issues = data.data?.issues ?? []
  const serviceNames = new Map(
    services.map((service) => [service.serviceKey, service.name])
  )
  const tileLabels = shortLabels(services)
  const score = applianceId
    ? summaryByAppliance(services).get(applianceId)
    : undefined

  // The year's plan for this appliance, for the first tile in the service row:
  // one made for it alone before one that covers the whole house.
  const plans = (data.data?.plans ?? []).filter(
    (plan) => applianceId !== null && plan.applianceIds.includes(applianceId)
  )
  const plan =
    plans.find((each) => each.applianceIds.length === 1) ?? plans[0] ?? null

  const earliest = useEarliestSlot()
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const reviewNames = new Map(
    services.map((service) => [
      service.serviceKey,
      tileLabels.get(service.id) ?? service.name,
    ])
  )
  const warrantyFor = (service: CatalogService): number =>
    service.warrantyDays ?? data.data?.config?.defaultWarrantyDays ?? 0
  const cart = useCart()

  // The service whose options sheet is open — a repair, where "Add" means
  // picking the problem first.
  const [sheetId, setSheetId] = useState<string | null>(null)

  // Which kind of machine is the customer's — front-load, split — once they
  // have said, from the Menu or the chips over the list. Every Add on the page
  // and the service sheet carry it, and the booking opens with it chosen.
  const [kind, setKind] = useState<string | null>(null)
  const kindField = appliance?.detailFields.find(
    (field) => field.kind === 'select' && field.key === 'type'
  )
  const kinds = kindField?.options ?? []
  const sheetService =
    services.find((service) => service.id === sheetId) ?? null

  // The service a symptom implies. Tapping "Not draining water" should start a
  // repair, not make the customer choose between repair and installation first.
  const repairService =
    services.find((service) => service.serviceKey === 'repair') ?? null

  // The service the customer arrived on, when they arrived on one: the page
  // opens scrolled to it.
  const requested =
    services.find((service) => service.serviceKey === openAt) ?? null
  const cheapestFee = services.length
    ? Math.min(...services.map((service) => service.visitFee))
    : null

  // The longest cover on offer here, service overrides included. "Up to",
  // because it is the best of them and not what every service carries.
  const warrantyDays = services.length
    ? Math.max(
        ...services.map(
          (service) =>
            service.warrantyDays ?? data.data?.config?.defaultWarrantyDays ?? 0
        )
      )
    : 0

  // The banner's slides: the appliance, then the repair and the next service
  // on the list, each on its own photograph of a technician at that job.
  const heroSlides: HeroSlide[] = []
  if (appliance?.heroImage) {
    heroSlides.push({
      key: 'appliance',
      photo: appliance.heroImage,
      title: `${appliance.name} service & repair`,
      note:
        cheapestFee === null ? undefined : `Starts at ${formatPaise(cheapestFee)}`,
    })
    const featured = [
      ...services.filter((service) => service.serviceKey === 'repair'),
      ...services.filter((service) => service.serviceKey !== 'repair'),
    ]
    for (const service of featured) {
      if (heroSlides.length >= 3) break
      if (!service.technicianPhoto) continue
      heroSlides.push({
        key: service.id,
        photo: service.technicianPhoto,
        title: service.name,
        note: `Starts at ${formatPaise(service.visitFee)}`,
      })
    }
  }

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
          subtitle={earliest ? `Earliest slot: ${earliest}` : undefined}
          showBack
          backFallback="/services"
          right={<CartButton className="mr-2 size-11" />}
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
          {/* The top of the page is the appliance's name and the two facts
              worth knowing before reading a price list: what the cheapest
              visit costs, and how long the work is covered for. It used to be
              a tinted card with the drawing in it and the promises stacked
              underneath, which spent the first screen on reassurance nobody
              had asked for yet — the promises are still here, further down,
              where a customer is actually weighing one service against
              another. */}
          {/* The banner, the way the marketplaces open an appliance: a few
              slides of technicians at work, each with what it is and what it
              starts at. Absent for an appliance nobody has photographed, and
              the screen opens on the name the way it always did. */}
          {heroSlides.length > 0 ? (
            <ApplianceHero slides={heroSlides} className="mt-4 lg:mt-6" />
          ) : null}

          <section className="mt-6">
            {/* The name and its score on the left, and on the right how soon
                somebody can come — the question before any price. */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold leading-tight text-ink">
                  {appliance.name}
                </h1>

                {/* The score of every service here, weighted by how many people
                    gave one, as on the All services tile. It opens the reviews
                    it summarises in a panel, the way a dotted underline
                    promises. */}
                {score?.rating !== undefined && score.reviewCount !== undefined ? (
                  <button
                    type="button"
                    onClick={() => setReviewsOpen(true)}
                    aria-haspopup="dialog"
                    className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-ink underline decoration-muted decoration-dotted underline-offset-4"
                  >
                    <Star
                      className="size-3.5 fill-ink text-ink"
                      aria-hidden="true"
                    />
                    <span className="font-semibold">{score.rating.toFixed(2)}</span>
                    <span>({countNote(score.reviewCount)} reviews)</span>
                  </button>
                ) : null}
              </div>
              <EarliestSlot label={earliest} className="mt-1" />
            </div>

            {appliance.heroImage ? null : cheapestFee !== null ? (
              <p className="mt-3 text-sm text-muted">
                Visit from{' '}
                <span className="text-base font-bold text-ink">
                  {formatPaise(cheapestFee)}
                </span>
                {services.length > 1 ? (
                  <>
                    {' · '}
                    {services.length} services
                  </>
                ) : null}
              </p>
            ) : null}

            {/* A row rather than a badge: it is a claim about money, and the
                condition on it is at the foot of the page, so it has to be
                something you can follow rather than something you can only
                read. */}
            {warrantyDays > 0 ? (
              <a
                href="#warranty"
                className="mt-4 flex items-center gap-3 rounded-card bg-surface px-4 py-3 text-sm text-ink hover:bg-border"
              >
                <ShieldCheck
                  className="size-5 shrink-0 text-brand"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  Up to {warrantyDays} days service warranty
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted"
                  aria-hidden="true"
                />
              </a>
            ) : null}
          </section>

          {/* The jump row, as pictures: each service's photograph with what
              it is under it, the way the big marketplaces open an appliance.
              A row of names in pills said the same thing, but a customer
              scanning for "the one where they clean it" finds a picture of
              somebody cleaning it faster than the word. Worth its space from
              two services up; one is already the list. */}
          {services.length >= 2 || plan ? (
            <nav
              aria-label="Services on this appliance"
              className="-mx-4 mt-6 border-y border-border px-4 py-5 lg:mx-0 lg:rounded-card lg:border-x"
            >
              <ul className="no-scrollbar -my-1 grid auto-cols-[5.5rem] grid-flow-col gap-3 overflow-x-auto py-1 sm:auto-cols-[6.5rem]">
                {/* The year's plan first, as the marketplaces put their
                    packages first: the one tile here that is not a single
                    visit. Its price is the plan's own, per year. */}
                {plan ? (
                  <li>
                    <Link
                      href={'/care' as Route}
                      className="group block touch-manipulation"
                    >
                      <span className="flex aspect-square flex-col items-center justify-center rounded-card bg-success/10 text-center text-success transition-transform duration-[var(--duration-fast)] group-active:scale-[0.97]">
                        <span className="text-[11px] font-semibold">From</span>
                        <span className="text-base font-bold leading-tight">
                          {formatPaise(plan.price)}
                        </span>
                        <span className="text-[11px] font-semibold">a year</span>
                      </span>
                      <span className="mt-2 line-clamp-2 block text-center text-xs leading-snug text-ink group-hover:text-brand">
                        Annual plan
                      </span>
                    </Link>
                  </li>
                ) : null}
                {services.map((service) => {
                  const picture =
                    service.technicianPhoto ??
                    service.photo ??
                    service.poster ??
                    appliance.image
                  return (
                    <li key={service.id}>
                      <a
                        href={`#service-${service.id}`}
                        className="group block touch-manipulation"
                      >
                        <span className="relative block aspect-square overflow-hidden rounded-card bg-plate transition-transform duration-[var(--duration-fast)] group-active:scale-[0.97]">
                          {picture ? (
                            <Image
                              src={picture}
                              alt=""
                              fill
                              sizes="(min-width: 640px) 104px, 88px"
                              className="object-cover"
                            />
                          ) : null}
                        </span>
                        <span className="mt-2 line-clamp-2 block text-center text-xs leading-snug text-ink group-hover:text-brand">
                          {tileLabels.get(service.id) ?? service.name}
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </nav>
          ) : null}

          {/* The list, in groups, the way the marketplaces lay an appliance
              out: the year's plan first, then servicing, repairs, and fitting
              or removing. Each group's name stays pinned under the header
              while its rows scroll past, so a customer halfway down still
              knows which kind of visit they are reading about. A group of two
              or more opens on a card for its first service. */}
          {kindField && kinds.length > 1 ? (
            <div className="mt-6" role="group" aria-label={kindField.label}>
              <p className="text-sm font-semibold text-ink">
                Your {kindField.label.toLowerCase()}
              </p>
              <div className="no-scrollbar -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pt-1 pb-1">
                {kinds.map((each) => {
                  const on = kind === each
                  const photo = typePhoto(appliance.id, each) ?? appliance.image
                  return (
                    <button
                      key={each}
                      type="button"
                      onClick={() => setKind(on ? null : each)}
                      aria-pressed={on}
                      className="group flex w-22 shrink-0 flex-col items-center text-center sm:w-26"
                    >
                      <span
                        className={cn(
                          'relative block aspect-square w-full overflow-hidden rounded-card bg-plate transition-transform duration-[var(--duration-fast)] group-active:scale-95',
                          on && 'ring-2 ring-brand ring-offset-2 ring-offset-bg'
                        )}
                      >
                        {photo ? (
                          // Product shots on white: contained and multiplied
                          // onto the tile, not cropped through the machine.
                          <Image
                            src={photo}
                            alt=""
                            fill
                            sizes="(min-width: 640px) 104px, 88px"
                            className="object-contain p-2 mix-blend-multiply"
                          />
                        ) : null}
                        {on ? (
                          <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-brand text-white">
                            <Check className="size-3.5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          'mt-2 line-clamp-2 text-xs leading-snug',
                          on ? 'font-semibold text-brand' : 'text-ink'
                        )}
                      >
                        {typeLabel(each)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {plan ? (
            <section
              id="annual-plan"
              className={cn(
                '-mx-4 mt-8 border-t-8 border-surface px-4 lg:mx-0 lg:px-0',
                JUMP_OFFSET
              )}
            >
              <h2 className={GROUP_HEADING}>Annual plan</h2>
              <OfferBanner
                badge={planSaving(plan) ? `${planSaving(plan)}% OFF` : undefined}
                title={plan.name}
                photo={appliance.heroImage ?? appliance.image}
                body={
                  <>
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      {plan.compareAt ? (
                        <span className="text-base line-through">
                          {formatPaise(plan.compareAt)}
                        </span>
                      ) : null}
                      <span className="text-xl font-bold text-success">
                        {formatPaise(plan.price)}/year
                      </span>
                    </p>
                    <p className="mt-1">
                      {plan.visitsIncluded}{' '}
                      {plan.visitsIncluded === 1 ? 'visit' : 'visits'} over the
                      year
                    </p>
                  </>
                }
                className="mt-2"
              />
              <ServiceRow
                title={plan.name}
                price={
                  <>
                    {formatPaise(plan.price)} a year
                    {plan.compareAt ? (
                      <span className="ml-2 font-normal text-muted line-through">
                        {formatPaise(plan.compareAt)}
                      </span>
                    ) : null}
                  </>
                }
                offer={
                  planSaving(plan)
                    ? `Save ${planSaving(plan)}% on separate visits`
                    : undefined
                }
                points={plan.benefits.slice(0, 2)}
                photo={
                  services.find((s) => s.serviceKey === 'service')
                    ?.technicianPhoto ?? appliance.heroImage
                }
                action={
                  <Link
                    href={'/care' as Route}
                    className="inline-flex h-11 w-[5.5rem] items-center justify-center rounded-card border border-border bg-bg text-sm font-semibold text-brand hover:border-brand"
                  >
                    View
                  </Link>
                }
                onOpen={() => router.push('/care' as Route)}
                openLabel={`${plan.name}, ${formatPaise(plan.price)} a year. See the plan.`}
              />
            </section>
          ) : null}

          {groupServices(services).map((group) => (
            <section
              key={group.key}
              id={`group-${group.key}`}
              className={cn(
                '-mx-4 mt-8 border-t-8 border-surface px-4 lg:mx-0 lg:px-0',
                JUMP_OFFSET
              )}
            >
              <h2 className={GROUP_HEADING}>{group.title}</h2>
              {group.services.length > 1 && group.services[0]?.technicianPhoto ? (
                <OfferBanner
                  badge={
                    warrantyFor(group.services[0])
                      ? `${warrantyFor(group.services[0])}-day warranty`
                      : undefined
                  }
                  title={group.services[0].name}
                  body={
                    <p className="line-clamp-3">{group.services[0].description}</p>
                  }
                  photo={group.services[0].technicianPhoto}
                  className="mt-2"
                />
              ) : null}
              <div className="divide-y divide-border">
                {group.services.map((service) => {
                  const duration = durationNote(service.durationMinutes)
                  const warranty = warrantyFor(service)
                  return (
                    <ServiceRow
                      key={service.id}
                      id={`service-${service.id}`}
                      className={ROW_OFFSET}
                      title={service.name}
                      rating={service.rating}
                      reviewCount={service.reviewCount}
                      price={
                        <>
                          Starts at {formatPaise(service.visitFee)}
                          {duration ? (
                            <span className="font-normal text-muted">
                              {' · '}
                              {duration.replace(/^About /, '')}
                            </span>
                          ) : null}
                        </>
                      }
                      offer={warranty ? `${warranty}-day service warranty` : undefined}
                      points={[
                        service.description,
                        service.startingPrice > service.visitFee
                          ? `Repairs usually start at ${formatPaise(service.startingPrice)}, quoted on site and begun only after you approve.`
                          : 'Anything beyond this is quoted on site and starts only after you approve it.',
                      ]}
                      photo={
                        service.technicianPhoto ??
                        service.photo ??
                        service.poster ??
                        appliance.image
                      }
                      action={
                        <AddButton
                          item={{
                            name: service.name,
                            applianceId: service.applianceId,
                            serviceKey: service.serviceKey,
                            options: serviceOptions(service, issues).length,
                            onOptions: () => setSheetId(service.id),
                            ...(kind ? { applianceType: kind } : {}),
                          }}
                        />
                      }
                      onOpen={() => setSheetId(service.id)}
                      openLabel={`${service.name}, visit fee ${formatPaise(service.visitFee)}. See what it covers.`}
                    />
                  )
                })}
              </div>
            </section>
          ))}

          {/* The rating under the name points here. */}
          <div id="reviews" className={JUMP_OFFSET}>
            <ServiceReviews
              reviews={data.data?.reviews ?? []}
              serviceNames={serviceNames}
              action={<WriteReviewButton applianceId={appliance.id} />}
            />
          </div>

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

          <Section title="Why book with us">
            <Card className="p-4">
              <TrustPoints />
            </Card>
          </Section>

          <Section title="How it works" subtitle={HOW_IT_WORKS_SUBTITLE}>
            <HowItWorks />
          </Section>

          {data.data && data.data.brands.length > 0 ? (
            <Section title="Brands we take">
              <BrandLogoRow brands={data.data.brands} />
              <BrandDisclaimer className="mt-3" />
            </Section>
          ) : null}

          <Section className={cn('mt-8', JUMP_OFFSET)}>
            {/* Said here, before a slot is chosen, rather than after the job.
                The warranty row at the top of the page points at this. */}
            <div id="warranty">
              <Card className="p-4 text-sm leading-relaxed text-muted">
                {MANUFACTURER_WARRANTY_NOTICE}
              </Card>
            </div>
          </Section>

          {/* Room at the foot for the floating Menu, which sits where a
              pinned bar would otherwise be when the cart is empty. */}
          {cart.length === 0 ? <div aria-hidden="true" className="h-24" /> : null}
        </>
      )}
      <ServiceSheet
        service={sheetService}
        appliance={appliance ?? undefined}
        services={services}
        issues={issues}
        initialKind={kind}
        onClose={() => setSheetId(null)}
      />
      <CartBar services={services} />
      {appliance && data.status === 'ready' ? (
        <SectionMenu
          aboveBar={cart.length > 0}
          types={kinds.map((each) => ({
            key: each,
            label: typeLabel(each),
            photo: typePhoto(appliance.id, each) ?? appliance.image,
          }))}
          typeTitle={kindField?.label}
          chosenType={kind}
          onType={setKind}
          items={[
            ...(plan
              ? [
                  {
                    id: 'annual-plan',
                    label: 'Annual plan',
                    ...(planSaving(plan)
                      ? {
                          offer: [
                            'Save',
                            `${planSaving(plan)}%`,
                            'OFF',
                          ] as const,
                        }
                      : { photo: appliance.heroImage }),
                  },
                ]
              : []),
            ...groupServices(services).map((group) => ({
              id: `group-${group.key}`,
              label: group.title,
              photo:
                group.services.find((s) => s.technicianPhoto)
                  ?.technicianPhoto ?? appliance.image,
            })),
          ]}
        />
      ) : null}
      <ReviewsSheet
        open={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        title={`${appliance?.name ?? 'Service'} reviews`}
        rating={score?.rating}
        ratingCount={score?.reviewCount}
        reviews={data.data?.reviews ?? []}
        serviceNames={reviewNames}
      />
    </AppShell>
  )
}
