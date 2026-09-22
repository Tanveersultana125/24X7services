'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import type { Route } from 'next'
import { Clock3, ReceiptIndianRupee, ShieldCheck, Wrench } from 'lucide-react'
import {
  applianceIdSchema,
  formatPaise,
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
import { Section } from '@/components/AppShell'
import { HowItWorks, HOW_IT_WORKS_SUBTITLE } from '@/components/HowItWorks'
import { TrustPoints } from '@/components/TrustPoints'
import { Button } from '@/components/ui/Button'
import { StickyCTA, StickySpacer } from '@/components/StickyCTA'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { durationNote } from '@/components/ServiceRail'
import {
  fetchAppliance,
  fetchBusinessConfig,
  fetchIssuesFor,
  fetchServicesFor,
} from '@/lib/catalog'
import { startDraft } from '@/lib/bookingDraft'
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
 * So the card says "View" and lands here, where the questions people actually
 * have get answered before the flow starts: what the fee covers and what it
 * does not, how long it takes, what is still covered afterwards, and the
 * symptoms this service is the answer to. Booking is one button at the bottom,
 * pinned, so the decision is available from anywhere on the page.
 *
 * Everything on it is read from the catalog. There is no per-service prose
 * here beyond what the catalog carries, because a page of marketing copy that
 * nobody updates alongside the price is how a service page starts lying.
 */

interface DetailData {
  appliance: CatalogAppliance | null
  service: CatalogService | null
  issues: CatalogIssue[]
  warrantyDays: number | null
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
      return { appliance: null, service: null, issues: [], warrantyDays: null }
    }

    const [found, services, issues, config] = await Promise.all([
      fetchAppliance(applianceId),
      fetchServicesFor(applianceId),
      fetchIssuesFor(applianceId),
      // Only for the warranty line. A failed read leaves that line out rather
      // than the page, which is the right trade for one sentence.
      fetchBusinessConfig(),
    ])

    const service = services.find((each) => each.serviceKey === serviceKey) ?? null

    return {
      appliance: found,
      service,
      issues,
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
                <Point>
                  A full inspection, and the fault named rather than guessed at.
                </Point>
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

            <Section title="How it works" subtitle={HOW_IT_WORKS_SUBTITLE}>
              <HowItWorks />
            </Section>

            <Section title="Every booking, whatever we are fixing">
              <TrustPoints />
            </Section>

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
