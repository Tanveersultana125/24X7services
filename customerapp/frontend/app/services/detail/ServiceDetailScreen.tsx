'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import type { Route } from 'next'
import {
  BadgeCheck,
  ChevronDown,
  Clock3,
  ReceiptIndianRupee,
  Share2,
  ShieldCheck,
  Star,
  Wrench,
  X,
} from 'lucide-react'
import {
  applianceIdSchema,
  formatPaise,
  serviceKeySchema,
  type CatalogAppliance,
  type CatalogBrand,
  type CatalogIssue,
  type CatalogService,
  type ServiceKey,
} from '@app/shared'

import { Header } from '@/components/Header'
import {
  BottomNavigation,
  BOTTOM_NAV_CLEARANCE,
} from '@/components/BottomNavigation'
import { Section } from '@/components/AppShell'
import { HowItWorks, HOW_IT_WORKS_SUBTITLE } from '@/components/HowItWorks'
import { TrustPoints } from '@/components/TrustPoints'
import { BrandDisclaimer } from '@/components/BrandCard'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { StickyCTA, StickySpacer } from '@/components/StickyCTA'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { durationNote } from '@/components/ServiceRail'
import {
  fetchAppliance,
  fetchBrands,
  fetchBusinessConfig,
  fetchIssuesFor,
  fetchServicesFor,
} from '@/lib/catalog'
import { startDraft } from '@/lib/bookingDraft'
import { shareText } from '@/lib/share'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * One service, in full, before anybody commits to it.
 *
 * The appliance page used to be the end of the road: its cards said "Book" and
 * a tap started the nine-step flow. That is a lot to ask of somebody still
 * working out whether a ₹299 visit fee is a good idea — the card had the
 * price and two lines, and the next screen after it wanted their address.
 *
 * So the card says "View details" and lands here, where the questions people
 * actually have get answered before the flow starts: what the fee covers and
 * what it does not, how long it takes, what is still covered afterwards, and
 * the symptoms this service is the answer to. Booking is one button at the
 * bottom, pinned, so the decision is available from anywhere on the page.
 *
 * Everything on it is read from the catalog. There is no per-service prose
 * here beyond what the catalog carries, because a page of marketing copy that
 * nobody updates alongside the price is how a service page starts lying.
 */

interface DetailData {
  appliance: CatalogAppliance | null
  service: CatalogService | null
  issues: CatalogIssue[]
  brands: CatalogBrand[]
  warrantyDays: number | null
}

/**
 * What is true of the person who turns up, on every one of these.
 *
 * Three lines, and each is something the business does rather than something
 * it would like to be believed. A fourth that nobody checks would cost the
 * other three their credibility.
 */
const TECHNICIAN_POINTS = [
  {
    icon: ShieldCheck,
    label: 'On our own roster',
    body: 'Not a marketplace of strangers. We know who we sent, and so do you — their name and photo are on the booking before they arrive.',
  },
  {
    icon: BadgeCheck,
    label: 'Verified before their first job',
    body: 'Identity and address checked, and the appliances they are trained on recorded against them.',
  },
  {
    icon: Star,
    label: 'Rated by the people they visited',
    body: 'Every finished job can be reviewed, and the rating on a technician is the average of those — not a badge we hand out.',
  },
] as const

/**
 * The middle line of "what the visit fee covers", per service.
 *
 * "The fault named rather than guessed at" is the right sentence on a repair
 * and the wrong one in front of somebody installing a new machine who has not
 * broken anything. One map rather than one sentence stretched over seven jobs.
 */
const COVERS: Record<ServiceKey, string> = {
  repair: 'A full inspection, and the fault named rather than guessed at.',
  service:
    'A full working check before anything is opened, and the service itself.',
  installation:
    'The site checked before anything is fitted — power, water and clearance.',
  uninstallation:
    'The appliance disconnected and taken down safely, and the connections left safe.',
  'gas-refill':
    'A pressure and leak check first, because a refill into a leak is money poured away.',
  'deep-clean': 'The clean itself, sheeting and drainage included.',
  maintenance:
    'A full working check, with anything wearing out named before it fails.',
}

export function ServiceDetailScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const appliance = applianceIdSchema.safeParse(params.get('a'))
  const key = serviceKeySchema.safeParse(params.get('s'))

  const applianceId = appliance.success ? appliance.data : null
  const serviceKey = key.success ? key.data : null

  const load = useCallback(async (): Promise<DetailData> => {
    if (!applianceId || !serviceKey) {
      return {
        appliance: null,
        service: null,
        issues: [],
        brands: [],
        warrantyDays: null,
      }
    }

    const [found, services, issues, brands, config] = await Promise.all([
      fetchAppliance(applianceId),
      fetchServicesFor(applianceId),
      fetchIssuesFor(applianceId),
      fetchBrands(),
      // Only for the warranty line. A failed read leaves that line out rather
      // than the page, which is the right trade for one sentence.
      fetchBusinessConfig(),
    ])

    const service = services.find((each) => each.serviceKey === serviceKey) ?? null

    return {
      appliance: found,
      service,
      issues,
      brands,
      warrantyDays:
        service?.warrantyDays ?? config?.defaultWarrantyDays ?? null,
    }
  }, [applianceId, serviceKey])

  const data = useAsync(load)
  const service = data.data?.service ?? null

  function book(): void {
    if (!applianceId || !serviceKey) return
    startDraft({
      applianceId,
      serviceKey,
      issueIds: [],
      techPreference: 'any',
    })
    router.push('/book/brand')
  }

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
        ) : data.status === 'loading' || !service ? (
          <SkeletonGroup label="Loading" className="mt-5 flex flex-col gap-4">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </SkeletonGroup>
        ) : (
          <>
            <Media service={service} fallback={data.data?.appliance?.image} />

            <h1 className="mt-5 text-2xl font-bold leading-tight text-ink">
              {service.name}
            </h1>
            {/* The same score the card carried, so the page it opens does not
                quietly drop the one number that got somebody here. Both or
                neither: a score with no count behind it cannot be weighed. */}
            {service.rating !== undefined &&
            service.reviewCount !== undefined ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <Star className="size-3.5 fill-ink text-ink" aria-hidden="true" />
                <span className="font-bold text-ink">
                  {service.rating.toFixed(1)}
                </span>
                <span>
                  from {service.reviewCount.toLocaleString('en-IN')} reviews
                </span>
              </p>
            ) : null}
            <p className="mt-2 text-base leading-relaxed text-muted">
              {service.description}
            </p>

            {/* The three numbers somebody weighs before booking anything, as
                figures rather than as a sentence they have to read twice. */}
            <dl className="mt-5 grid grid-cols-3 gap-2">
              <Figure
                icon={ReceiptIndianRupee}
                term="Visit fee"
                value={formatPaise(service.visitFee)}
              />
              <Figure
                icon={Clock3}
                term="Usually takes"
                value={durationNote(service.durationMinutes) ?? '—'}
              />
              <Figure
                icon={ShieldCheck}
                term="Warranty"
                value={
                  data.data?.warrantyDays
                    ? `${data.data.warrantyDays} days`
                    : '—'
                }
              />
            </dl>

            <Section title="What the visit fee covers">
              <ul className="flex flex-col gap-2.5">
                <Point>
                  A technician at your door inside the two-hour window you pick.
                </Point>
                <Point>{COVERS[service.serviceKey]}</Point>
                <Point>
                  A written quote for anything beyond the inspection — part and
                  labour listed separately.
                </Point>
                <Point>
                  {service.startingPrice > service.visitFee
                    ? `Repairs usually start at ${formatPaise(service.startingPrice)} on top of this, and nothing begins until you approve it.`
                    : 'Nothing beyond this starts until you approve what it costs.'}
                </Point>
              </ul>
            </Section>

            {data.data && data.data.issues.length > 0 ? (
              <Section
                title="What we fix on this"
                subtitle="The symptoms this service is the answer to"
              >
                <ul className="flex flex-wrap gap-2">
                  {data.data.issues.map((issue) => (
                    <li
                      key={issue.id}
                      className="rounded-pill border border-border px-3 py-1.5 text-sm text-ink"
                    >
                      {issue.label}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {service.process && service.process.length > 0 ? (
              <Section
                title="Our process"
                subtitle="What the visit actually consists of"
              >
                <ol className="flex flex-col">
                  {service.process.map((step, index) => (
                    <ProcessStep
                      key={step.title}
                      n={index + 1}
                      title={step.title}
                      body={step.body}
                      last={index === (service.process?.length ?? 0) - 1}
                    />
                  ))}
                </ol>
              </Section>
            ) : (
              <Section title="How it works" subtitle={HOW_IT_WORKS_SUBTITLE}>
                <HowItWorks />
              </Section>
            )}

            <Section title="Who turns up">
              <ul className="flex flex-col gap-4">
                {TECHNICIAN_POINTS.map((point) => (
                  <li key={point.label} className="flex items-start gap-3">
                    <point.icon
                      className="mt-0.5 size-5 shrink-0 text-brand"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-base font-semibold text-ink">
                        {point.label}
                      </span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                        {point.body}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Section>

            {data.data && data.data.brands.length > 0 ? (
              <Section title="Brands we service">
                <ul className="grid grid-cols-3 gap-2">
                  {data.data.brands.map((brand) => (
                    <li
                      key={brand.id}
                      className="flex min-h-16 items-center justify-center rounded-card bg-surface px-2 text-center text-sm font-bold text-ink"
                    >
                      {brand.wordmark}
                    </li>
                  ))}
                  <li className="flex min-h-16 items-center justify-center rounded-card bg-surface px-2 text-center text-sm text-muted">
                    &amp; more
                  </li>
                </ul>
                <BrandDisclaimer className="mt-3" />
              </Section>
            ) : null}

            {service.excludes && service.excludes.length > 0 ? (
              <Section
                title="What is not included"
                subtitle="Cheaper to read now than to argue about on the day"
              >
                <ul className="flex flex-col gap-2.5">
                  {service.excludes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <X
                        className="mt-0.5 size-4 shrink-0 text-error"
                        aria-hidden="true"
                      />
                      <span className="text-sm leading-relaxed text-muted">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {service.faqs && service.faqs.length > 0 ? (
              <Section title="Frequently asked questions">
                <ul className="divide-y divide-border border-y border-border">
                  {service.faqs.map((item) => (
                    <li key={item.q}>
                      {/* Native details: it opens before hydration, the
                          browser's own find searches inside it, and a screen
                          reader announces its state without being told how. */}
                      <details className="group">
                        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
                          {item.q}
                          <ChevronDown
                            className="size-4 shrink-0 text-muted transition-transform duration-[var(--duration-fast)] group-open:rotate-180"
                            aria-hidden="true"
                          />
                        </summary>
                        <p className="pb-4 text-sm leading-relaxed text-muted">
                          {item.a}
                        </p>
                      </details>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            <Section title="Every booking, whatever we are fixing">
              <TrustPoints />
            </Section>

            <ShareService service={service} />

            <StickySpacer aboveBottomNav />
          </>
        )}
      </main>

      {!missing && service ? (
        <StickyCTA
          aboveBottomNav
          detail={
            <p className="text-sm text-ink">
              <span className="font-bold">{formatPaise(service.visitFee)}</span>{' '}
              <span className="text-muted">visit fee</span>
            </p>
          }
        >
          <Button onClick={book} iconLeft={<Wrench className="size-4" aria-hidden="true" />}>
            Book a visit
          </Button>
        </StickyCTA>
      ) : null}

      <BottomNavigation />
    </div>
  )
}

/**
 * The clip, playing.
 *
 * This is the one screen where a clip is unambiguously the right thing: there
 * is exactly one service on it, so there is nothing for it to compete with —
 * which is the whole reason the appliance page lets only its first card move.
 */
function Media({
  service,
  fallback,
}: {
  service: CatalogService
  fallback?: string
}) {
  const still = service.poster ?? fallback

  if (service.video) {
    return (
      <video
        poster={still}
        src={service.video}
        muted
        loop
        autoPlay
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="mt-5 aspect-video w-full rounded-card bg-surface object-cover"
      />
    )
  }

  if (!still) return null

  return (
    <span className="relative mt-5 block aspect-video w-full overflow-hidden rounded-card bg-surface">
      <Image
        src={still}
        alt=""
        fill
        sizes="(min-width: 640px) 512px, 100vw"
        className={service.poster ? 'object-cover' : 'object-contain p-6'}
      />
    </span>
  )
}

/** One numbered step, with the rule that joins it to the next. */
function ProcessStep({
  n,
  title,
  body,
  last,
}: {
  n: number
  title: string
  body: string
  last: boolean
}) {
  return (
    <li className="flex gap-3">
      <span className="flex flex-col items-center" aria-hidden="true">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-bold text-ink">
          {n}
        </span>
        {/* The line between the steps, which is what makes them a sequence
            rather than a list that happens to be numbered. */}
        {!last ? <span className="w-px flex-1 bg-border" /> : null}
      </span>
      <span className={cn('min-w-0', last ? 'pb-0' : 'pb-5')}>
        <span className="block text-base font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-muted">
          {body}
        </span>
      </span>
    </li>
  )
}

/**
 * Passing the service on.
 *
 * The share sheet where the browser has one, the clipboard where it does not.
 * Closing the sheet is a decision rather than a failure, so nothing is said
 * about it — see `lib/share`.
 */
function ShareService({ service }: { service: CatalogService }) {
  const toast = useToast()

  async function send(): Promise<void> {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const outcome = await shareText(
      `${service.name} on 24X7 — ${formatPaise(service.visitFee)} visit fee, quoted before any work starts. ${url}`,
      service.name
    )
    if (outcome === 'copied') {
      toast.show('Link copied.', { tone: 'success' })
    } else if (outcome === 'failed') {
      toast.show('We could not share that.', { tone: 'error' })
    }
  }

  return (
    <section className="mt-8 text-center">
      <p className="text-sm text-muted">Know someone who needs this?</p>
      <button
        type="button"
        onClick={() => void send()}
        className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-pill border border-border px-5 text-sm font-semibold text-brand hover:border-brand"
      >
        <Share2 className="size-4" aria-hidden="true" />
        Share this service
      </button>
    </section>
  )
}

function Figure({
  icon: Icon,
  term,
  value,
}: {
  icon: typeof Clock3
  term: string
  value: string
}) {
  return (
    <div className="min-w-0 rounded-card bg-surface p-3">
      <Icon className="size-4 text-muted" aria-hidden="true" />
      <dt className="mt-2 text-xs text-muted">{term}</dt>
      <dd className="mt-0.5 text-sm font-bold text-ink">{value}</dd>
    </div>
  )
}

function Point({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className="mt-[0.5rem] size-1.5 shrink-0 rounded-full bg-brand"
      />
      <span className="text-sm leading-relaxed text-ink">{children}</span>
    </li>
  )
}
