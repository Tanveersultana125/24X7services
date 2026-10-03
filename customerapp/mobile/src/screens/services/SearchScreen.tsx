import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams, type Href } from 'expo-router'
import { ArrowLeft, Check, ChevronRight, History, SearchX, Sparkles, TrendingUp, X } from 'lucide-react-native'
import type { CatalogAppliance, CatalogIssue, CatalogService, SearchHit } from '@app/shared'

import { AppShell } from '@/components/AppShell'
import { SearchBar } from '@/components/SearchBar'
import { ServiceClip } from '@/components/ServiceClip'
import { ServiceScore, scoreLabel } from '@/components/ServiceScore'
import { formatPaise } from '@/lib/format'
import { Chip } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { fetchAllIssues, fetchAllServices, fetchAppliances } from '@/lib/catalog'
import { ServiceSheet, serviceOptions } from '@/components/ServiceSheet'
import { callFn, friendlyError } from '@/lib/callables'
import { forgetSearches, rememberSearch, useRecentSearches } from '@/lib/recentSearches'
import { addToCart, countForService, inCart, removeFromCart, useCart } from '@/lib/cart'
import { CartBar } from '@/components/CartBar'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'
import { TRENDING_SEARCHES } from '@/lib/trending'

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
 * A service hit gets the whole row, picture, score and Add: a customer who
 * searched "drum not spinning" has already described the job, so the answer
 * should be the thing itself rather than a line of text about it. Appliances
 * are tiles; a problem has no picture and no price, and gets neither.
 */

/** Long enough for a prefix to mean something, short enough to feel instant. */
const MIN_QUERY = 2
const DEBOUNCE_MS = 250

export function SearchScreen() {
  const insets = useSafeAreaInsets()

  // `?q=` arrives from a suggestion tapped elsewhere (the chips on Services),
  // and starts the search as if it had been typed.
  const { q } = useLocalSearchParams<{ q?: string }>()
  const [term, setTerm] = useState(() => (typeof q === 'string' ? q : ''))
  const [result, setResult] = useState<{ query: string; hits: SearchHit[] } | null>(null)
  const [failure, setFailure] = useState<{ query: string; message: string } | null>(null)
  // Bumped by "Try again", which has to re-run a search for a term that has not
  // changed — without it the effect below would have nothing to react to.
  const [retry, setRetry] = useState(0)

  const recent = useRecentSearches()

  const loadCatalog = useCallback(async (): Promise<{
    appliances: CatalogAppliance[]
    services: CatalogService[]
    issues: CatalogIssue[]
  }> => {
    const [appliances, services, issues] = await Promise.all([fetchAppliances(), fetchAllServices(), fetchAllIssues()])
    return { appliances, services, issues }
  }, [])
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
  const sheetService = services.find((service) => service.id === sheetId) ?? null
  const serviceFor = new Map(services.map((service) => [`${service.applianceId}/${service.serviceKey}`, service]))
  const applianceFor = new Map(catalog.data?.appliances.map((appliance) => [appliance.id, appliance]) ?? [])

  /** A result the customer actually opened is worth remembering. */
  function open(href: string): void {
    rememberSearch(query)
    // The index carries the web's routes, trailing slash included
    // (`/services/appliance/?a=ac`); the app's routes have none.
    router.push(href.replace(/(.)\/(?=\?|$)/, '$1') as Href)
  }

  function goBack(): void {
    if (router.canGoBack()) router.back()
    else router.replace('/home')
  }

  return (
    <AppShell
      mobileHeader={
        <View className="flex-row items-center gap-1 border-b border-border bg-bg px-2 pb-3" style={{ paddingTop: insets.top + 8 }}>
          <Tappable
            onPress={goBack}
            accessibilityLabel="Go back"
            className="size-11 shrink-0 items-center justify-center rounded-full active:bg-surface active:opacity-100"
          >
            <Icon as={ArrowLeft} className="size-5 text-ink" />
          </Tappable>
          <SearchBar className="w-auto min-w-0 flex-1" value={term} onChange={setTerm} autoFocus />
        </View>
      }
      footer={<CartBar services={services} />}
    >
      {!searching ? (
        <Suggestions recent={recent} onPick={setTerm} onClearRecent={forgetSearches} />
      ) : error !== null ? (
        <ErrorState className="py-16" description={error} onRetry={() => setRetry((n) => n + 1)} />
      ) : hits === null ? (
        <SkeletonGroup label="Searching" className="mt-4 gap-2">
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
        appliance={sheetService ? applianceFor.get(sheetService.applianceId) : undefined}
        services={services}
        issues={issues}
        onClose={() => setSheetId(null)}
      />
    </AppShell>
  )
}

// ---------------------------------------------------------------------------

/** The grey band the rest of the app uses between unrelated blocks. */
function Band() {
  return <View aria-hidden className="-mx-4 my-8 h-2 bg-surface" />
}

function Heading({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" className={cn('text-lg font-semibold text-ink', className)}>
      {children}
    </Text>
  )
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
    .map((hit) => (hit.serviceKey === undefined ? undefined : serviceFor.get(`${hit.applianceId}/${hit.serviceKey}`)))
    .filter((service) => service !== undefined)

  // A withdrawn service still in the index joins to nothing, and a problem
  // has no picture or price: both stay plain rows.
  const rows = [
    ...serviceHits.filter(
      (hit) => hit.serviceKey === undefined || !serviceFor.has(`${hit.applianceId}/${hit.serviceKey}`)
    ),
    ...hits.filter((hit) => hit.kind === 'issue'),
  ]

  const blocks = [
    appliances.length > 0 ? (
      <View key="categories">
        <Heading className="mb-4">Categories</Heading>
        <View className="-mx-1.5 flex-row flex-wrap gap-y-5">
          {appliances.map((appliance) => (
            <View key={appliance.id} className="w-1/4 px-1.5">
              <Tappable
                onPress={() => onOpen(`/services/appliance?a=${appliance.id}`)}
                accessibilityLabel={appliance.name}
                className="w-full min-w-0 items-center gap-2 active:opacity-100"
              >
                {({ pressed }) => (
                  <>
                    <View className={cn('aspect-square w-full overflow-hidden rounded-card p-3', pressed ? 'bg-plate-deep' : 'bg-plate')}>
                      <Img src={appliance.image} alt="" contentFit="contain" className="size-full" />
                    </View>
                    <Text className="text-center text-sm leading-tight text-ink">{appliance.name}</Text>
                  </>
                )}
              </Tappable>
            </View>
          ))}
        </View>
      </View>
    ) : null,
    services.length > 0 ? (
      <View key="services">
        <Heading className="mb-2">Services</Heading>
        <View>
          {services.map((service) => (
            <ServiceRow
              key={service.id}
              service={service}
              image={applianceFor.get(service.applianceId)?.image}
              options={serviceOptions(service, issues).length}
              onOpen={onOpen}
              onOptions={() => onOptions(service.id)}
            />
          ))}
        </View>
      </View>
    ) : null,
    rows.length > 0 ? (
      <View key="problems">
        <Heading className="mb-3">{rows.some((hit) => hit.kind === 'issue') ? 'Problems' : 'More'}</Heading>
        <HitRows hits={rows} onOpen={onOpen} />
      </View>
    ) : null,
  ].filter((block) => block !== null)

  return (
    <View className="mt-6">
      {blocks.map((block, index) => (
        <Fragment key={block.key}>
          {index > 0 ? <Band /> : null}
          {block}
        </Fragment>
      ))}
    </View>
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
  const item = { applianceId: service.applianceId, serviceKey: service.serviceKey }
  const added = options > 0 ? countForService(cart, item) > 0 : inCart(cart, item)

  function press(): void {
    if (options > 0) onOptions()
    else if (added) removeFromCart(item)
    else addToCart(item)
  }
  const still = service.photo ?? service.poster ?? image

  return (
    <View className="flex-row items-start gap-3 py-4">
      <Tappable
        onPress={() => onOpen(`/services/detail?a=${service.applianceId}&s=${service.serviceKey}`)}
        accessibilityLabel={[
          service.name,
          scoreLabel(service.rating, service.reviewCount),
          `visit fee ${formatPaise(service.visitFee)}`,
        ]
          .filter(Boolean)
          .join(', ')}
        className="min-w-0 flex-1 flex-row items-start gap-4"
      >
        {still ? (
          <ServiceClip
            still={still}
            cover={Boolean(service.photo ?? service.poster)}
            motion={false}
            containClassName="p-2"
            className="size-20 shrink-0 rounded-card"
          />
        ) : null}
        <View className="min-w-0 flex-1">
          <Text className="text-base font-medium leading-snug text-ink">{service.name}</Text>
          <ServiceScore rating={service.rating} reviewCount={service.reviewCount} variant="compact" className="mt-1" />
          <Text className="mt-1 text-sm text-ink">
            {formatPaise(service.visitFee)} <Text className="text-sm text-muted">visit fee</Text>
          </Text>
        </View>
      </Tappable>
      <Tappable
        onPress={press}
        accessibilityState={options > 0 ? undefined : { selected: added }}
        accessibilityLabel={
          options > 0
            ? `Add ${service.name}, ${options} options`
            : added
              ? `Remove ${service.name} from cart`
              : `Add ${service.name} to cart`
        }
        className={cn(
          'relative min-h-11 w-24 shrink-0 flex-row items-center justify-center gap-1 rounded-card border',
          added ? 'border-brand bg-brand-soft' : 'border-border bg-bg active:border-brand active:opacity-100'
        )}
      >
        {added ? <Icon as={Check} className="size-4 text-brand" /> : null}
        <Text className="text-sm font-semibold text-brand">{added ? 'Added' : 'Add'}</Text>
        {options > 0 ? (
          <View pointerEvents="none" importantForAccessibility="no-hide-descendants" className="absolute inset-x-0 -bottom-2 items-center">
            <Text numberOfLines={1} className="bg-bg px-1 text-[11px] leading-[11px] text-muted">
              {options} options
            </Text>
          </View>
        ) : null}
      </Tappable>
    </View>
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
      {hits.map((hit, index) => (
        <Tappable
          key={`${hit.kind}-${hit.label}-${hit.href}`}
          onPress={() => onOpen(hit.href)}
          className={cn(
            'w-full flex-row items-center gap-3 px-4 py-3 active:bg-surface active:opacity-100',
            index > 0 && 'border-t border-border'
          )}
        >
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="text-base font-medium text-ink">
              {hit.label}
            </Text>
            {hit.sublabel ? (
              <Text numberOfLines={1} className="mt-0.5 text-xs text-muted">
                {hit.sublabel}
              </Text>
            ) : null}
          </View>
          <Icon as={ChevronRight} className="size-4 text-muted" />
        </Tappable>
      ))}
    </Card>
  )
}

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
    <View className="mt-4">
      {recent.length > 0 ? (
        <View className="mb-8">
          <View className="mb-3 flex-row items-baseline justify-between gap-3">
            <Heading>Recent</Heading>
            <Tappable onPress={onClearRecent} className="flex-row items-center gap-1">
              <Icon as={X} className="size-3.5 text-muted" />
              <Text className="text-sm text-muted">Clear</Text>
            </Tappable>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {recent.map((item) => (
              <Chip key={item} onPress={() => onPick(item)} accessibilityLabel={item}>
                <Icon as={History} className="size-3.5 text-muted" />
                <Text numberOfLines={1} className="text-sm font-medium text-ink">
                  {item}
                </Text>
              </Chip>
            ))}
          </View>
        </View>
      ) : null}

      <View>
        <Heading className="mb-4">Trending searches</Heading>
        <View className="flex-row flex-wrap gap-2.5">
          {TRENDING_SEARCHES.map((item) => (
            <Tappable
              key={item}
              onPress={() => onPick(item)}
              className="min-h-11 flex-row items-center gap-2 rounded-card border border-border px-3.5 active:border-brand active:opacity-100"
            >
              <Icon as={TrendingUp} className="size-4 text-muted" />
              <Text className="text-sm text-ink">{item}</Text>
            </Tappable>
          ))}
        </View>
      </View>

      {/* The grey rule the rest of the app uses between unrelated blocks. */}
      <Band />

      <View>
        <View className="mb-4 flex-row items-center gap-2">
          <Heading>Just tell us what is wrong</Heading>
          <Icon as={Sparkles} className="size-5 text-[#C45CE8]" />
        </View>
        <View className="items-start gap-2.5">
          {ASK_PROMPTS.map((prompt) => (
            <Tappable
              key={prompt.text}
              href={`/assistant?q=${encodeURIComponent(prompt.text)}` as Href}
              className="min-h-11 max-w-full flex-row items-center gap-2 rounded-card border border-border px-3.5 py-2 active:border-brand active:opacity-100"
            >
              <Text aria-hidden className="text-sm">
                {prompt.emoji}
              </Text>
              <Text className="shrink text-sm text-ink">{prompt.text}</Text>
            </Tappable>
          ))}
        </View>

        <Tappable
          href={'/assistant' as Href}
          className="mt-7 min-h-14 flex-row items-center justify-center gap-2 rounded-card border border-border px-4 active:border-brand active:opacity-100"
        >
          <Text className="text-center text-base font-semibold text-ink">Something else? Ask our assistant</Text>
          <Icon as={Sparkles} className="size-5 text-[#C45CE8]" />
        </Tappable>
      </View>
    </View>
  )
}
