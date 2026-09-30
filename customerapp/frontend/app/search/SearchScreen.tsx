'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  History,
  SearchX,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react'
import type {
  CatalogAppliance,
  CatalogIssue,
  CatalogService,
  SearchHit,
} from '@app/shared'

import { AppShell } from '@/components/AppShell'
import { SearchBar } from '@/components/SearchBar'
import { ServiceClip } from '@/components/ServiceClip'
import { ServiceScore, scoreLabel } from '@/components/ServiceScore'
import { formatPaise } from '@/lib/format'
import { Chip } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import {
  fetchAllIssues,
  fetchAllServices,
  fetchAppliances,
} from '@/lib/catalog'
import { ServiceSheet, serviceOptions } from '@/components/ServiceSheet'
import { callFn, friendlyError } from '@/lib/callables'
import {
  forgetSearches,
  rememberSearch,
  useRecentSearches,
} from '@/lib/recentSearches'
import {
  addToCart,
  countForService,
  inCart,
  removeFromCart,
  useCart,
} from '@/lib/cart'
import { CartBar } from '@/components/CartBar'
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
      issues: CatalogIssue[]
    }> => {
      const [appliances, services, issues] = await Promise.all([
        fetchAppliances(),
        fetchAllServices(),
        fetchAllIssues(),
      ])
      return { appliances, services, issues }
    },
    []
  )
  const catalog = useAsync(loadCatalog)

  // The repair whose options sheet is open.
  const [sheetId, setSheetId] = useState<string | null>(null)

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
  const issues = catalog.data?.issues ?? []
  const sheetService =
    services.find((service) => service.id === sheetId) ?? null
  const serviceFor = new Map(
    services.map((service) => [
      `${service.applianceId}/${service.serviceKey}`,
      service,
    ])
  )
  const applianceFor = new Map(
    catalog.data?.appliances.map((appliance) => [appliance.id, appliance]) ?? []
  )

  /** A result the customer actually opened is worth remembering. */
  function open(href: string): void {
    rememberSearch(query)
    router.push(href as Route)
  }

  return (
    <AppShell>
      <div className="sticky top-0 z-20 -mx-4 flex items-center gap-1 border-b border-border bg-bg px-2 pb-3 pt-[calc(var(--safe-top)+0.5rem)] lg:top-16 lg:mx-0 lg:px-0 lg:pt-5">
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
        <Results
          hits={hits}
          applianceFor={applianceFor}
          serviceFor={serviceFor}
          issues={issues}
          onOpen={open}
          onOptions={setSheetId}
        />
      )}

      <ServiceSheet
        service={sheetService}
        appliance={
          sheetService ? applianceFor.get(sheetService.applianceId) : undefined
        }
        services={services}
        issues={issues}
        onClose={() => setSheetId(null)}
      />
      <CartBar services={services} />
    </AppShell>
  )
}

// ---------------------------------------------------------------------------

/** The grey band the rest of the app uses between unrelated blocks. */
function Band() {
  return <div aria-hidden="true" className="-mx-4 my-8 h-2 bg-surface lg:mx-0" />
}

/**
 * What a search found, in the order a customer reads it: the appliances it
 * touches as a row of tiles, then the services themselves as rows they can
 * compare, then any problem that matched in their own words.
 *
 * The tiles are every appliance the hits belong to, not only the appliance
 * hits. "AC service" matches no appliance by name, but it is plainly about
 * the air conditioner, and a tile for it is the quickest way to everything
 * else we do for one.
 */
function Results({
  hits,
  applianceFor,
  serviceFor,
  issues,
  onOpen,
  onOptions,
}: {
  hits: readonly SearchHit[]
  applianceFor: ReadonlyMap<string, CatalogAppliance>
  serviceFor: ReadonlyMap<string, CatalogService>
  issues: readonly CatalogIssue[]
  onOpen: (href: string) => void
  onOptions: (serviceId: string) => void
}) {
  const appliances = [...new Set(hits.map((hit) => hit.applianceId))]
    .map((id) => applianceFor.get(id))
    .filter((appliance) => appliance !== undefined)

  const serviceHits = hits.filter((hit) => hit.kind === 'service')
  const services = serviceHits
    .map((hit) =>
      hit.serviceKey === undefined
        ? undefined
        : serviceFor.get(`${hit.applianceId}/${hit.serviceKey}`)
    )
    .filter((service) => service !== undefined)

  // A withdrawn service still in the index joins to nothing, and a problem
  // has no picture or price: both stay plain rows.
  const rows = [
    ...serviceHits.filter(
      (hit) =>
        hit.serviceKey === undefined ||
        !serviceFor.has(`${hit.applianceId}/${hit.serviceKey}`)
    ),
    ...hits.filter((hit) => hit.kind === 'issue'),
  ]

  const blocks = [
    appliances.length > 0 ? (
      <section key="categories">
        <h2 className="mb-4 text-lg font-semibold text-ink">Categories</h2>
        <ul className="grid grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-5 lg:grid-cols-6">
          {appliances.map((appliance) => (
            <li key={appliance.id}>
              <button
                type="button"
                onClick={() => onOpen(`/services/appliance/?a=${appliance.id}`)}
                className="group flex w-full min-w-0 flex-col items-center gap-2"
              >
                <span className="relative block aspect-square w-full overflow-hidden rounded-card bg-plate transition-colors duration-[var(--duration-fast)] group-hover:bg-plate-deep">
                  <Image
                    src={appliance.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 120px, 22vw"
                    className="object-contain p-3"
                  />
                </span>
                <span className="text-center text-sm leading-tight text-ink">
                  {appliance.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    ) : null,
    services.length > 0 ? (
      <section key="services">
        <h2 className="mb-2 text-lg font-semibold text-ink">Services</h2>
        <ul>
          {services.map((service) => (
            <li key={service.id}>
              <ServiceRow
                service={service}
                image={applianceFor.get(service.applianceId)?.image}
                options={serviceOptions(service, issues).length}
                onOpen={onOpen}
                onOptions={() => onOptions(service.id)}
              />
            </li>
          ))}
        </ul>
      </section>
    ) : null,
    rows.length > 0 ? (
      <section key="problems">
        <h2 className="mb-3 text-lg font-semibold text-ink">
          {rows.some((hit) => hit.kind === 'issue') ? 'Problems' : 'More'}
        </h2>
        <HitRows hits={rows} onOpen={onOpen} />
      </section>
    ) : null,
  ].filter((block) => block !== null)

  return (
    <div className="mt-6">
      {blocks.map((block, index) => (
        <Fragment key={block.key}>
          {index > 0 ? <Band /> : null}
          {block}
        </Fragment>
      ))}
    </div>
  )
}

/**
 * A service as one row: the picture on the left, the name, score and fee in
 * the middle, and "Add" on the right — the shape the marketplaces give a
 * search result, because it is a list somebody compares down.
 *
 * Two controls, side by side rather than one inside the other: the row opens
 * the service, and "Add" puts it in the cart without leaving the list. Tapped
 * again, it takes it back out. A repair has options — the problem it is for —
 * so its "Add" says how many and opens them instead (ServiceSheet).
 */
function ServiceRow({
  service,
  image,
  options,
  onOpen,
  onOptions,
}: {
  service: CatalogService
  image?: string
  options: number
  onOpen: (href: string) => void
  onOptions: () => void
}) {
  const cart = useCart()
  const item = {
    applianceId: service.applianceId,
    serviceKey: service.serviceKey,
  }
  const added =
    options > 0 ? countForService(cart, item) > 0 : inCart(cart, item)

  function press(): void {
    if (options > 0) onOptions()
    else if (added) removeFromCart(item)
    else addToCart(item)
  }
  const still = service.photo ?? service.poster ?? image

  return (
    <div className="flex items-start gap-3 py-4">
      <button
        type="button"
        onClick={() =>
          onOpen(
            `/services/detail/?a=${service.applianceId}&s=${service.serviceKey}`
          )
        }
        aria-label={[
          service.name,
          scoreLabel(service.rating, service.reviewCount),
          `visit fee ${formatPaise(service.visitFee)}`,
        ]
          .filter(Boolean)
          .join(', ')}
        className="flex min-w-0 flex-1 items-start gap-4 text-left"
      >
        {still ? (
        <ServiceClip
          still={still}
          cover={Boolean(service.photo ?? service.poster)}
          motion={false}
          sizes="80px"
          containClassName="p-2"
          className="size-20 shrink-0 rounded-card"
        />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium leading-snug text-ink">
          {service.name}
        </span>
        <ServiceScore
          rating={service.rating}
          reviewCount={service.reviewCount}
          variant="compact"
          className="mt-1"
        />
        <span className="mt-1 block text-sm text-ink">
          {formatPaise(service.visitFee)}{' '}
          <span className="text-muted">visit fee</span>
        </span>
      </span>
      </button>
      <button
        type="button"
        onClick={press}
        aria-pressed={options > 0 ? undefined : added}
        aria-haspopup={options > 0 ? 'dialog' : undefined}
        aria-label={
          options > 0
            ? `Add ${service.name}, ${options} options`
            : added
              ? `Remove ${service.name} from cart`
              : `Add ${service.name} to cart`
        }
        className={cn(
          'relative inline-flex min-h-11 w-24 shrink-0 items-center justify-center gap-1 rounded-card border text-sm font-semibold transition-colors duration-[var(--duration-fast)]',
          added
            ? 'border-brand bg-brand-soft text-brand'
            : 'border-border bg-bg text-brand hover:border-brand'
        )}
      >
        {added ? (
          <>
            <Check className="size-4" aria-hidden="true" />
            Added
          </>
        ) : (
          'Add'
        )}
        {options > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-bg px-1 text-[11px] font-normal leading-none text-muted"
          >
            {options} options
          </span>
        ) : null}
      </button>
    </div>
  )
}

/**
 * Hits as a list of rows: a label, what it belongs to, and a chevron.
 *
 * The shape for a hit that is not a thing you buy — a symptom — and the
 * fallback for a service the catalog no longer has.
 */
function HitRows({
  hits,
  onOpen,
  className,
}: {
  hits: readonly SearchHit[]
  onOpen: (href: string) => void
  className?: string
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <ul>
        {hits.map((hit) => {
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
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium text-ink">
                    {hit.label}
                  </span>
                  {hit.sublabel ? (
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {hit.sublabel}
                    </span>
                  ) : null}
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
 * Searches that land on something every time: each one is a word the index
 * holds, so a tap never ends on "nothing matched".
 */
const TRENDING = [
  'AC service',
  'Washing machine repair',
  'Refrigerator repair',
  'AC deep clean',
  'Geyser installation',
  'Microwave repair',
] as const

/**
 * Problems in the words a customer would use, each one a question the
 * assistant has a full answer for. Tapping opens the chat with it already sent.
 */
const ASK_PROMPTS = [
  { emoji: '🧊', text: 'My fridge is not cooling and the food is getting warm.' },
  { emoji: '🔊', text: 'My washing machine makes a loud noise while spinning.' },
  { emoji: '💧', text: 'Water is dripping from my AC indoors.' },
  { emoji: '🚿', text: 'My geyser is not heating the water.' },
  { emoji: '⚡', text: 'My microwave runs but the food stays cold.' },
] as const

/**
 * What an empty search box offers: what this person looked for before, what
 * most people look for, and a way to just describe the problem instead.
 */
function Suggestions({
  recent,
  onPick,
  onClearRecent,
}: {
  recent: readonly string[]
  onPick: (term: string) => void
  onClearRecent: () => void
}) {
  return (
    <div className="mt-4">
      {recent.length > 0 ? (
        <section className="mb-8">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">Recent</h2>
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

      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">
          Trending searches
        </h2>
        <ul className="flex flex-wrap gap-2.5">
          {TRENDING.map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPick(item)}
                className="inline-flex min-h-11 items-center gap-2 rounded-card border border-border px-3.5 text-sm text-ink hover:border-brand"
              >
                <TrendingUp
                  className="size-4 text-muted"
                  aria-hidden="true"
                />
                {item}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* The grey rule the rest of the app uses between unrelated blocks. */}
      <div aria-hidden="true" className="-mx-4 my-8 h-2 bg-surface lg:mx-0" />

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
          Just tell us what is wrong
          <Sparkles className="size-5 text-[#C45CE8]" aria-hidden="true" />
        </h2>
        <ul className="flex flex-col items-start gap-2.5">
          {ASK_PROMPTS.map((prompt) => (
            <li key={prompt.text} className="max-w-full">
              <Link
                href={
                  `/assistant/?q=${encodeURIComponent(prompt.text)}` as Route
                }
                className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-card border border-border px-3.5 py-2 text-left text-sm text-ink hover:border-brand"
              >
                <span aria-hidden="true">{prompt.emoji}</span>
                {prompt.text}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href={'/assistant/' as Route}
          className="mt-7 flex min-h-14 items-center justify-center gap-2 rounded-card border border-border px-4 text-center text-base font-semibold text-ink hover:border-brand"
        >
          Something else? Ask our assistant
          <Sparkles className="size-5 text-[#C45CE8]" aria-hidden="true" />
        </Link>
      </section>
    </div>
  )
}
