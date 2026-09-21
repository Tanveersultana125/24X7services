'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { ArrowLeft, ChevronRight, History, SearchX, X } from 'lucide-react'
import type { SearchHit } from '@app/shared'

import { AppShell } from '@/components/AppShell'
import { SearchBar } from '@/components/SearchBar'
import { Chip } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { fetchAppliances } from '@/lib/catalog'
import { callFn, friendlyError } from '@/lib/callables'
import {
  forgetSearches,
  rememberSearch,
  useRecentSearches,
} from '@/lib/recentSearches'
import { useAsync } from '@/lib/useAsync'

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

  const loadAppliances = useCallback(() => fetchAppliances(), [])
  const appliances = useAsync(loadAppliances)

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
            appliances.data?.map((a) => ({ id: a.id, name: a.name })) ?? []
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
            return (
              <section key={group.kind} className="mb-6 last:mb-0">
                <h2 className="mb-2 text-sm font-semibold text-muted">
                  {group.title}
                </h2>
                <Card className="overflow-hidden">
                  <ul>
                    {groupHits.map((hit) => (
                      <li
                        key={`${hit.kind}-${hit.label}-${hit.href}`}
                        className="border-b border-border last:border-b-0"
                      >
                        <button
                          type="button"
                          onClick={() => open(hit.href)}
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
                    ))}
                  </ul>
                </Card>
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
