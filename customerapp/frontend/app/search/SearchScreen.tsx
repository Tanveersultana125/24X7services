'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { ArrowLeft, ChevronRight, History, SearchX, X } from 'lucide-react'
import type {
  CatalogAppliance,
  CatalogService,
  SearchHit,
} from '@app/shared'

import { AppShell } from '@/components/AppShell'
import { SearchBar } from '@/components/SearchBar'
import { ServiceCard } from '@/components/ServiceCard'
import { ServiceClip } from '@/components/ServiceClip'
import { ServiceScore } from '@/components/ServiceScore'
import { Chip } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import {
  fetchAllServices,
  fetchAppliances,
  summaryByAppliance,
} from '@/lib/catalog'
import { callFn, friendlyError } from '@/lib/callables'
import {
  forgetSearches,
  rememberSearch,
  useRecentSearches,
} from '@/lib/recentSearches'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * Search across appliances, services and the problems people describe.
 *
 * The query goes to `searchCatalog` rather than being matched here, so the app
 * never holds a copy of the catalog to search against and a reseed changes the
 * results without a release. Every keystroke does not go to the server: typing
 * settles for a moment first, and a reply that arrives after a newer one is
 * dropped rather than allowed to overwrite it.
 *
 * Both the results and the failure are stamped with the query they belong to.
 * That is what lets the screen work out what it is doing — a result for an
 * older query means this one is still in flight — without a status flag that
 * has to be set from inside an effect and kept in step by hand.
 *
 * A hit is a label and a route; the picture, the score and the price are not
 * in the index and are not going into it — an index that carried them would
 * be a second copy of the catalog going stale on its own schedule. They are
 * joined here instead, against the catalog this screen already loads for its
 * suggestions. A hit whose service has since been withdrawn simply joins to
 * nothing and stays the row it always was.
 *
 * A service hit gets the whole card, the one the appliance page uses: a
 * customer who searched "drum not spinning" has already described the job, so
 * the answer should be the thing itself rather than a line of text about it.
 * Appliances keep the compact row — "Washing Machine" is an answer you scan
 * past on the way to a service — with the score added. A problem has no
 * picture and no price, and gets neither.
 */

/** Long enough for a prefix to mean something, short enough to feel instant. */
const MIN_QUERY = 2
const DEBOUNCE_MS = 250

const GROUPS = [
  { kind: 'appliance', title: 'Appliances' },
  { kind: 'service', title: 'Services' },
  { kind: 'issue', title: 'Problems' },
] as const satisfies ReadonlyArray<{ kind: SearchHit['kind']; title: string }>

export function SearchScreen() {
  const router = useRouter()

  const [term, setTerm] = useState('')
  const [result, setResult] = useState<{
    query: string
    hits: SearchHit[]
  } | null>(null)
  const [failure, setFailure] = useState<{
    query: string
    message: string
  } | null>(null)
  // Bumped by "Try again", which has to re-run a search for a term that has not
  // changed — without it the effect below would have nothing to react to.
  const [retry, setRetry] = useState(0)

  const recent = useRecentSearches()

  const loadCatalog = useCallback(
    async (): Promise<{
      appliances: CatalogAppliance[]
      services: CatalogService[]
    }> => {
      const [appliances, services] = await Promise.all([
        fetchAppliances(),
        fetchAllServices(),
      ])
      return { appliances, services }
    },
    []
  )
  const catalog = useAsync(loadCatalog)

  // Every request gets a number, and only the newest one is allowed to write.
  const requestId = useRef(0)

  const query = term.trim()
  const searching = query.length >= MIN_QUERY

  useEffect(() => {
    if (!searching) return

    const id = (requestId.current += 1)
    const timer = setTimeout(() => {
      callFn('searchCatalog', { q: query })
        .then((response) => {
          if (id !== requestId.current) return
          setResult({ query, hits: response.hits })
          setFailure(null)
        })
        .catch((caught: unknown) => {
          if (id !== requestId.current) return
          setFailure({ query, message: friendlyError(caught) })
        })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query, searching, retry])

  const hits = result?.query === query ? result.hits : null
  const error = failure?.query === query ? failure.message : null

  // What a hit joins to. Keyed the way a hit names itself, so the lookup is
  // the hit's own fields rather than a string the two sides have to agree on.
  const services = catalog.data?.services ?? []
  const serviceFor = new Map(
    services.map((service) => [
      `${service.applianceId}/${service.serviceKey}`,
      service,
    ])
  )
  const applianceFor = new Map(
    catalog.data?.appliances.map((appliance) => [appliance.id, appliance]) ?? []
  )
  const applianceSummaries = summaryByAppliance(services)

  /** A result the customer actually opened is worth remembering. */
  function open(href: string): void {
    rememberSearch(query)
    router.push(href as Route)
  }

  return (
    <AppShell>
      <div className="sticky top-0 z-20 -mx-4 flex items-center gap-1 bg-bg px-2 pb-3 pt-[calc(var(--safe-top)+0.5rem)] lg:top-16 lg:mx-0 lg:px-0 lg:pt-5">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-surface lg:hidden"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <SearchBar
          className="min-w-0 flex-1 lg:max-w-xl"
          value={term}
          onChange={setTerm}
          autoFocus
        />
      </div>

      {!searching ? (
        <Suggestions
          recent={recent}
          onPick={setTerm}
          onClearRecent={forgetSearches}
          appliances={
            catalog.data?.appliances.map((a) => ({ id: a.id, name: a.name })) ??
            []
          }
        />
      ) : error !== null ? (
        <ErrorState
          className="py-16"
          description={error}
          onRetry={() => setRetry((n) => n + 1)}
        />
      ) : hits === null ? (
        <SkeletonGroup label="Searching" className="mt-4 flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </SkeletonGroup>
      ) : hits.length === 0 ? (
        <EmptyState
          className="py-16"
          icon={SearchX}
          title={`Nothing matched “${query}”`}
          description="Try the appliance name, or say what is wrong — “fridge not cooling” finds the same thing."
          action={{ label: 'See all services', href: '/services' }}
        />
      ) : (
        <div className="mt-4">
          {GROUPS.map((group) => {
            const groupHits = hits.filter((hit) => hit.kind === group.kind)
            if (groupHits.length === 0) return null

            // Services answer the search outright, so they are shown the way
            // the appliance page shows them — a rule between them rather than
            // a box around each, which at this height would be two lines
            // doing one job.
            if (group.kind === 'service') {
              const cards = groupHits
                .map((hit) => ({
                  hit,
                  service:
                    hit.serviceKey === undefined
                      ? undefined
                      : serviceFor.get(`${hit.applianceId}/${hit.serviceKey}`),
                }))
                .filter(
                  (row): row is { hit: SearchHit; service: CatalogService } =>
                    row.service !== undefined
                )

              // Everything that joined to nothing — a withdrawn service still
              // in the index — falls back to the row it has always been.
              const rows = groupHits.filter(
                (hit) => !cards.some((card) => card.hit === hit)
              )

              return (
                <section key={group.kind} className="mb-6 last:mb-0">
                  <h2 className="mb-2 text-sm font-semibold text-muted">
                    {group.title}
                  </h2>
                  {cards.length > 0 ? (
                    <div className="flex flex-col divide-y divide-border">
                      {cards.map(({ hit, service }, index) => (
                        <div
                          key={`${hit.applianceId}-${service.serviceKey}`}
                          className="py-5 first:pt-0 last:pb-0"
                        >
                          {/* The top result moves and the rest are stills,
                              the same rule the appliance page follows. */}
                          <ServiceCard
                            service={service}
                            image={applianceFor.get(hit.applianceId)?.image}
                            motion={index === 0}
                            onSelect={() =>
                              open(
                                `/services/detail/?a=${service.applianceId}&s=${service.serviceKey}`
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {rows.length > 0 ? (
                    <HitRows
                      hits={rows}
                      className={cards.length > 0 ? 'mt-4' : undefined}
                      onOpen={open}
                    />
                  ) : null}
                </section>
              )
            }

            return (
              <section key={group.kind} className="mb-6 last:mb-0">
                <h2 className="mb-2 text-sm font-semibold text-muted">
                  {group.title}
                </h2>
                <HitRows
                  hits={groupHits}
                  onOpen={open}
                  thumbFor={
                    group.kind === 'appliance'
                      ? (hit) => {
                          const summary = applianceSummaries.get(
                            hit.applianceId
                          )
                          return {
                            // The drawing, not a frame of the clip: at 48px a
                            // crop of a captioned clip is a blue smudge, and
                            // the drawing is the one picture that still reads
                            // at that size.
                            still: applianceFor.get(hit.applianceId)?.image,
                            cover: false,
                            rating: summary?.rating,
                            reviewCount: summary?.reviewCount,
                          }
                        }
                      : undefined
                  }
                />
              </section>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}

// ---------------------------------------------------------------------------

/**
 * Hits as a list of rows: a label, what it belongs to, and a chevron.
 *
 * The shape for a hit that is not a thing you buy — an appliance, a symptom —
 * and the fallback for a service the catalog no longer has. The picture, where
 * there is one, is a still rather than a clip: a screen of moving thumbnails
 * is a list nobody can read, and these rows exist to be scanned past.
 */
function HitRows({
  hits,
  onOpen,
  thumbFor,
  className,
}: {
  hits: readonly SearchHit[]
  onOpen: (href: string) => void
  thumbFor?: (hit: SearchHit) => {
    still?: string
    cover: boolean
    rating?: number
    reviewCount?: number
  }
  className?: string
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <ul>
        {hits.map((hit) => {
          const thumb = thumbFor?.(hit)
          return (
            <li
              key={`${hit.kind}-${hit.label}-${hit.href}`}
              className="border-b border-border last:border-b-0"
            >
              <button
                type="button"
                onClick={() => onOpen(hit.href)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface"
              >
                {thumb?.still ? (
                  <ServiceClip
                    still={thumb.still}
                    cover={thumb.cover}
                    motion={false}
                    sizes="48px"
                    containClassName="p-1.5"
                    className="size-12 shrink-0 rounded-card"
                  />
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium text-ink">
                    {hit.label}
                  </span>
                  {hit.sublabel ? (
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {hit.sublabel}
                    </span>
                  ) : null}
                  <ServiceScore
                    rating={thumb?.rating}
                    reviewCount={thumb?.reviewCount}
                    variant="compact"
                    className="mt-0.5"
                  />
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted"
                  aria-hidden="true"
                />
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

/**
 * What an empty search box offers: what this person looked for before, and the
 * list of appliances, which is the shortest route to everything else.
 */
function Suggestions({
  recent,
  appliances,
  onPick,
  onClearRecent,
}: {
  recent: readonly string[]
  appliances: ReadonlyArray<{ id: string; name: string }>
  onPick: (term: string) => void
  onClearRecent: () => void
}) {
  return (
    <div className="mt-5">
      {recent.length > 0 ? (
        <section className="mb-7">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-muted">Recent</h2>
            <button
              type="button"
              onClick={onClearRecent}
              className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
            >
              <X className="size-3.5" aria-hidden="true" />
              Clear
            </button>
          </div>
          <ul className="flex flex-wrap gap-2">
            {recent.map((item) => (
              <li key={item}>
                <Chip onClick={() => onPick(item)}>
                  <History className="size-3.5 text-muted" aria-hidden="true" />
                  {item}
                </Chip>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {appliances.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">
            Browse by appliance
          </h2>
          <ul className="flex flex-wrap gap-2">
            {appliances.map((appliance) => (
              <li key={appliance.id}>
                <Link
                  href={`/services/appliance/?a=${appliance.id}` as Route}
                  className="inline-flex min-h-11 items-center rounded-pill border border-border px-4 text-sm font-medium text-ink hover:border-brand"
                >
                  {appliance.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
