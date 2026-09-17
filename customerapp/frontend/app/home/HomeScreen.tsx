'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { Bell, ChevronRight, MapPinOff } from 'lucide-react'
import type {
  Banner,
  CatalogAppliance,
  CatalogBrand,
  CatalogService,
  PopularService,
} from '@app/shared'

import { AppShell, Section } from '@/components/AppShell'
import { HeaderAction } from '@/components/Header'
import { LocationSelector } from '@/components/LocationSelector'
import { SearchBar } from '@/components/SearchBar'
import { PromotionalBanner } from '@/components/PromotionalBanner'
import { ApplianceCard } from '@/components/ApplianceCard'
import { BrandDisclaimer } from '@/components/BrandCard'
import { TrustPoints } from '@/components/TrustPoints'
import { useLocation } from '@/lib/useLocation'
import { Card, CardLink } from '@/components/ui/Card'
import { ErrorState } from '@/components/ErrorState'
import { HomeSkeleton } from '@/components/SkeletonLoader'
import {
  cheapestByAppliance,
  fetchAllServices,
  fetchAppliances,
  fetchBanners,
  fetchBrands,
  fetchPopularServices,
} from '@/lib/catalog'
import { callFn } from '@/lib/callables'
import { formatPaise } from '@/lib/format'
import { LOCATION_STALE_MS, locationLabel } from '@/lib/location'
import { useAsync } from '@/lib/useAsync'

/**
 * Home.
 *
 * Everything on it comes from the catalog. No appliance, service, brand or
 * price is written into this file — a new appliance is a seed entry, and it
 * appears here without anyone editing a screen.
 *
 * The one thing Home decides for itself is whether the saved location still
 * holds. Areas get switched on and off, and a customer whose pincode was
 * dropped should find that out here rather than at the end of a booking.
 */

interface HomeData {
  banners: Banner[]
  popular: PopularService[]
  appliances: CatalogAppliance[]
  services: CatalogService[]
  brands: CatalogBrand[]
}

export function HomeScreen() {
  const router = useRouter()
  const { location, setLocation, ready } = useLocation()

  const load = useCallback(async (): Promise<HomeData> => {
    // One round trip's worth of latency rather than five, and a single failure
    // takes the whole screen to the error state instead of leaving it half
    // built with no way to retry the part that failed.
    const [banners, popular, appliances, services, brands] = await Promise.all([
      fetchBanners(),
      fetchPopularServices(),
      fetchAppliances(),
      fetchAllServices(),
      fetchBrands(),
    ])
    return { banners, popular, appliances, services, brands }
  }, [])

  const home = useAsync(load)

  useStaleLocationCheck(location, setLocation)

  // Someone who cleared their storage, or arrived on this URL directly, has no
  // location and nothing on this screen applies to them yet.
  useEffect(() => {
    if (ready && !location) router.replace('/location')
  }, [ready, location, router])

  const fromPrices = home.data ? cheapestByAppliance(home.data.services) : null

  return (
    <AppShell
      mobileHeader={
        <div className="sticky top-0 z-30 border-b border-border bg-bg pt-[var(--safe-top)] lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-2 px-4 pt-1">
            {/* `label` stays empty until there is an address book to name a
                saved address from — that arrives with the profile in Phase 5. */}
            <LocationSelector
              className="min-w-0 flex-1"
              area={location ? locationLabel(location) : undefined}
              onClick={() => router.push('/location')}
            />
            <HeaderAction href="/profile/notifications" label="Notifications">
              <Bell className="size-5" aria-hidden="true" />
            </HeaderAction>
          </div>
          <div className="mx-auto max-w-lg px-4 pb-3">
            <SearchBar readOnly onOpen={() => router.push('/search')} />
          </div>
        </div>
      }
    >
      {/* The desktop bar carries the location, but not the search field. */}
      <div className="hidden pt-6 lg:block">
        <SearchBar
          readOnly
          onOpen={() => router.push('/search')}
          className="max-w-xl"
        />
      </div>

      {location && !location.serviceable ? (
        <UnserviceableNotice
          area={locationLabel(location)}
          onChange={() => router.push('/location')}
        />
      ) : null}

      {home.status === 'loading' ? (
        <HomeSkeleton />
      ) : home.status === 'error' ? (
        <ErrorState
          className="py-20"
          onRetry={home.reload}
          retrying={home.refreshing}
        />
      ) : home.data ? (
        <>
          {home.data.banners.length > 0 ? (
            <Section className="mt-5">
              <PromotionalBanner banners={home.data.banners} />
            </Section>
          ) : null}

          {home.data.popular.length > 0 ? (
            <Section title="Popular right now">
              <PopularRail services={home.data.popular} />
            </Section>
          ) : null}

          <Section
            title="What we service"
            action={
              <Link
                href="/services"
                className="inline-flex items-center gap-0.5 text-sm font-medium text-ink"
              >
                See all
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            }
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {home.data.appliances.map((appliance, index) => {
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
          </Section>

          {home.data.brands.length > 0 ? (
            <Section title="Brands we service">
              <ul className="flex flex-wrap gap-2">
                {home.data.brands.map((brand) => (
                  <li
                    key={brand.id}
                    className="rounded-card border border-border px-4 py-3 text-sm font-bold tracking-[0.08em] text-ink"
                  >
                    {brand.wordmark}
                  </li>
                ))}
              </ul>
              {/* Required wherever manufacturer names appear. */}
              <BrandDisclaimer className="mt-3" />
            </Section>
          ) : null}

          <Section title="Why book with us">
            <Card className="p-4">
              <TrustPoints />
            </Card>
          </Section>

          <HomeFooter />
        </>
      ) : null}
    </AppShell>
  )
}

// ---------------------------------------------------------------------------

/**
 * Re-ask whether we still cover the saved pincode, once a day, in the
 * background. It never blocks the screen and it never sends anyone anywhere —
 * the answer only changes what Home says at the top.
 */
function useStaleLocationCheck(
  location: ReturnType<typeof useLocation>['location'],
  setLocation: ReturnType<typeof useLocation>['setLocation']
): void {
  const checked = useRef<string | null>(null)

  useEffect(() => {
    if (!location) return
    if (Date.now() - location.checkedAt < LOCATION_STALE_MS) return
    // Once per pincode per mount, whatever the network does.
    if (checked.current === location.pincode) return
    checked.current = location.pincode

    let live = true
    callFn('checkServiceability', { pincode: location.pincode })
      .then((result) => {
        if (!live) return
        setLocation({
          pincode: location.pincode,
          city: result.city ?? location.city,
          area: result.area ?? location.area,
          serviceable: result.serviceable,
          checkedAt: Date.now(),
        })
      })
      .catch(() => {
        // Offline, or the call failed. The saved answer stands until it can be
        // asked again; telling someone their area may have changed on the
        // strength of a failed request would be worse than saying nothing.
      })

    return () => {
      live = false
    }
  }, [location, setLocation])
}

function UnserviceableNotice({
  area,
  onChange,
}: {
  area: string
  onChange: () => void
}) {
  return (
    <div
      role="status"
      className="mt-5 flex items-start gap-3 rounded-card border border-border bg-warning-soft p-4"
    >
      <MapPinOff className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">
          We do not service {area} yet
        </p>
        <p className="mt-0.5 text-sm text-muted">
          You can look around, but a booking needs an address in an area we
          cover.
        </p>
        <button
          type="button"
          onClick={onChange}
          className="mt-1 text-sm font-semibold text-ink underline"
        >
          Change location
        </button>
      </div>
    </div>
  )
}

/** The rail of the four or five things people book most. */
function PopularRail({ services }: { services: readonly PopularService[] }) {
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      {services.map((service) => (
        <li key={service.id} className="w-44 shrink-0 snap-start">
          <CardLink
            href={`/services/appliance?a=${service.applianceId}` as Route}
            className="flex h-full flex-col justify-between p-4"
            ariaLabel={`${service.name}, from ${formatPaise(service.fromPrice)}`}
          >
            <span className="text-sm font-semibold leading-snug text-ink">
              {service.name}
            </span>
            <span className="mt-3 text-xs text-muted">
              from{' '}
              <span className="text-sm font-bold text-ink">
                {formatPaise(service.fromPrice)}
              </span>
            </span>
          </CardLink>
        </li>
      ))}
    </ul>
  )
}

const FOOTER_LINKS = [
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/cancellation', label: 'Cancellation' },
  { href: '/support', label: 'Support' },
] as const satisfies ReadonlyArray<{ href: Route; label: string }>

function HomeFooter() {
  return (
    <footer className="mt-10 border-t border-border pt-5">
      <ul className="flex flex-wrap gap-x-5 gap-y-1">
        {FOOTER_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-muted hover:text-ink">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </footer>
  )
}
