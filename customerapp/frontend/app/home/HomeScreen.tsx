'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { ChevronRight, MapPinOff } from 'lucide-react'
import type {
  ApplianceId,
  Banner,
  CatalogAppliance,
  CatalogBrand,
  CatalogService,
  PopularService,
  ServiceKey,
} from '@app/shared'

import { AppShell, Section } from '@/components/AppShell'
import {
  HomeHeader,
  HOME_HEADER_CLEARANCE,
  HOME_HEADER_HEIGHT,
} from '@/components/HomeHeader'
import { SearchBar } from '@/components/SearchBar'
import { PromotionalBanner, BannerCard } from '@/components/PromotionalBanner'
import { CategoryGrid } from '@/components/CategoryGrid'
import {
  ServiceRail,
  durationNote,
  type ServiceRailItem,
} from '@/components/ServiceRail'
import { BrandDisclaimer } from '@/components/BrandCard'
import { TrustPoints } from '@/components/TrustPoints'
import { useLocation } from '@/lib/useLocation'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ErrorState'
import { CategoryGridSkeleton, HomeSkeleton } from '@/components/SkeletonLoader'
import { startDraft } from '@/lib/bookingDraft'
import {
  fetchAllServices,
  fetchAppliances,
  fetchBanners,
  fetchBrands,
  fetchPopularServices,
} from '@/lib/catalog'
import { callFn } from '@/lib/callables'
import { LOCATION_STALE_MS, locationLabel } from '@/lib/location'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * Home.
 *
 * Everything on it comes from the catalog. No appliance, service, brand or
 * price is written into this file — a new appliance is a seed entry, and it
 * appears here without anyone editing a screen.
 *
 * The top of it is one blue block: the location, the search field and the
 * offer cards all sit on the same piece of colour, and the grid of everything
 * we service is a white card that rides up over its lower edge. That shape is
 * the one every app of this kind has settled on, and it earns its keep — the
 * block says where you are and what this place sells, and a card lapping its
 * edge says the page carries on below the fold without an arrow to say so.
 *
 * Under that the page is a stack of short sideways rows rather than a few tall
 * blocks: the things people book most, and then one row per appliance. A
 * customer who already knows what is broken reaches a booking in two taps from
 * anywhere on it, and one who does not can scroll the whole range in about
 * four screens. Where the rows would otherwise
 * run together, a banner from the `inline` slot breaks them up — which banners
 * those are, and how many, is seed data, so the shape of this page changes
 * without a release.
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

/** How many appliance rows run before an inline banner is dropped between. */
const ROWS_BETWEEN_BANNERS = 2

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

  // The header paints nothing while the hero is behind it. Once the hero has
  // gone past, there is white page under it and it has to become a bar.
  const heroRef = useRef<HTMLDivElement>(null)
  const pastHero = useScrolledPast(heroRef, HOME_HEADER_HEIGHT)

  useStaleLocationCheck(location, setLocation)

  // Someone who cleared their storage, or arrived on this URL directly, has no
  // location and nothing on this screen applies to them yet.
  useEffect(() => {
    if (ready && !location) router.replace('/location')
  }, [ready, location, router])

  /**
   * Starting a booking is starting a new draft, not adding to whatever was left
   * half-filled before — a different appliance is a different job.
   *
   * Seeded here rather than passed as query parameters into the first step, so
   * that step never renders against a draft that has not been written yet.
   */
  const startBooking = useCallback(
    (applianceId: ApplianceId, serviceKey: ServiceKey) => {
      startDraft({
        applianceId,
        serviceKey,
        issueIds: [],
        techPreference: 'any',
      })
      router.push('/book/brand')
    },
    [router]
  )

  const data = home.data
  const imageFor = new Map(
    data?.appliances.map((appliance) => [appliance.id, appliance.image]) ?? []
  )

  const heroBanners = data?.banners.filter((b) => b.slot === 'hero') ?? []
  const inlineBanners = data?.banners.filter((b) => b.slot === 'inline') ?? []

  const popularItems: ServiceRailItem[] =
    data?.popular.map((popular) => {
      const listed = data.services.find(
        (service) =>
          service.applianceId === popular.applianceId &&
          service.serviceKey === popular.serviceKey
      )
      return {
        id: popular.id,
        name: popular.name,
        image: popular.image ?? imageFor.get(popular.applianceId),
        href: `/services/appliance/?a=${popular.applianceId}` as Route,
        note: durationNote(listed?.durationMinutes),
        priceLabel: 'Visit from',
        price: popular.fromPrice,
        onBook: () => startBooking(popular.applianceId, popular.serviceKey),
      }
    }) ?? []

  // One row per appliance, in catalog order, skipping any appliance whose
  // services are all inactive — a heading over an empty row reads as a page
  // that failed to load rather than a catalog with nothing to say yet.
  const rows =
    data?.appliances
      .map((appliance) => ({
        appliance,
        services: data.services
          .filter((service) => service.applianceId === appliance.id)
          .sort((a, b) => a.order - b.order),
      }))
      .filter((row) => row.services.length > 0) ?? []

  return (
    <AppShell
      mobileHeader={
        <HomeHeader
          solid={pastHero}
          area={location?.area}
          detail={
            location ? `${location.city} ${location.pincode}` : undefined
          }
          onChangeLocation={() => router.push('/location')}
          onSearch={() => router.push('/search')}
        />
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

      {/* Always painted, on every path. The header floats on this and is
          transparent until it scrolls past it, so a screen that reaches the
          error state with nothing behind the header is white on white. */}
      <div ref={heroRef}>
        <HomeHero>
          {data && heroBanners.length > 0 ? (
            <PromotionalBanner banners={heroBanners} />
          ) : (
            <HeroPlaceholder show={home.status === 'loading'} />
          )}

          {/* On the blue rather than under it. Someone whose pincode has been
              dropped should read this before they read an offer, and up here
              it is the only pale thing on a field of colour. */}
          {location && !location.serviceable ? (
            <UnserviceableNotice
              area={locationLabel(location)}
              onChange={() => router.push('/location')}
            />
          ) : null}
        </HomeHero>
      </div>

      {/* The card that laps the hero. It renders in all three states so the
          blue block always has something sitting on its edge — an overhang
          with nothing under it is not a design, it is a gap.

          The catalog is checked before the status, so a reload that fails with
          a catalog already on screen leaves the page standing rather than
          punching an error through the middle of it. */}
      <Card raised className="relative -mt-10 p-4 lg:mt-8 lg:p-5">
        {data ? (
          <>
            <h2 className="mb-3 text-xl font-bold text-ink">What we service</h2>
            <CategoryGrid appliances={data.appliances} />
          </>
        ) : home.status === 'error' ? (
          <ErrorState
            className="py-6"
            onRetry={home.reload}
            retrying={home.refreshing}
          />
        ) : (
          <CategoryGridSkeleton />
        )}
      </Card>

      {data ? (
        <>
          {popularItems.length > 0 ? (
            <Section
              title="Most booked"
              subtitle="What people call us about most"
            >
              <ServiceRail items={popularItems} />
            </Section>
          ) : null}

          {rows.map((row, index) => {
            // Dropped after every second row, and only while there are banners
            // left to drop: repeating the same card down the page would be
            // worse than the run of rows it is there to break up.
            const bannerIndex =
              index > 0 && index % ROWS_BETWEEN_BANNERS === 0
                ? index / ROWS_BETWEEN_BANNERS - 1
                : -1
            const banner = inlineBanners[bannerIndex]

            return (
              <div key={row.appliance.id}>
                {banner ? (
                  <Section className="mt-8">
                    <BannerCard banner={banner} />
                  </Section>
                ) : null}

                <Section
                  title={row.appliance.name}
                  subtitle={summariseServices(row.services)}
                  action={
                    <Link
                      href={`/services/appliance/?a=${row.appliance.id}` as Route}
                      className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-brand"
                    >
                      See all
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Link>
                  }
                >
                  <ServiceRail
                    items={row.services.map((service) => ({
                      id: service.id,
                      name: service.name,
                      image: imageFor.get(service.applianceId),
                      href:
                        `/services/appliance/?a=${service.applianceId}` as Route,
                      note: durationNote(service.durationMinutes),
                      priceLabel: 'Visit fee',
                      price: service.visitFee,
                      onBook: () =>
                        startBooking(service.applianceId, service.serviceKey),
                    }))}
                  />
                </Section>
              </div>
            )
          })}

          {data.brands.length > 0 ? (
            <Section title="Brands we service">
              <ul className="flex flex-wrap gap-2">
                {data.brands.map((brand) => (
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
      ) : home.status === 'loading' ? (
        <HomeSkeleton />
      ) : null}
    </AppShell>
  )
}

// ---------------------------------------------------------------------------

/**
 * The blue block at the top of the screen, and the one thing on Home painted on
 * every path — loading, loaded, failed, and with no banner seeded at all. The
 * header floats on it and is transparent until it scrolls away, so a path that
 * leaves this unpainted is white text on a white page.
 *
 * It is the app's own gradient rather than a banner's, which is the whole point
 * of the arrangement. The banner under the header used to have to be the
 * background, so the background was whatever shade that banner happened to be
 * seeded in. Now the colour is fixed, the header's fill matches its top stop
 * exactly, and the offers are cards sitting on it.
 *
 * The bottom padding is what the first white card of the page laps into. Keep
 * the two numbers in step — this one and that card's negative top margin — or
 * the card either floats clear of the blue or swallows it.
 *
 * None of it applies from a laptop's width up, where the desktop bar carries
 * the location and a banner stretched across the window is a stripe, not a
 * banner.
 */
function HomeHero({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        '-mx-4 rounded-b-hero bg-linear-to-b from-brand-deep to-brand px-4 pb-14',
        HOME_HEADER_CLEARANCE,
        'lg:mx-0 lg:rounded-none lg:bg-none lg:px-0 lg:pt-5 lg:pb-0'
      )}
    >
      {children}
    </div>
  )
}

/**
 * A banner-shaped hole in the hero while the catalog is still coming, so the
 * card below does not jump up the screen when the real one lands. Tinted out of
 * the blue rather than shimmering grey: this sits on colour, and the grey
 * skeleton the rest of the app uses reads here as a picture that failed.
 *
 * Nothing at all once the answer is in and there is genuinely no banner — the
 * hero then shrinks to the header and its own padding, which is a header, not
 * a hole.
 */
function HeroPlaceholder({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div
      aria-hidden="true"
      className="min-h-52 rounded-card bg-bg/10 sm:min-h-56 lg:hidden"
    />
  )
}

/**
 * Whether the element has scrolled up past a band `offset` pixels deep at the
 * top of the viewport.
 *
 * An observer rather than a scroll handler: this fires twice in a session, when
 * the hero leaves and when it comes back, instead of on every frame of every
 * scroll to compute the same boolean.
 */
function useScrolledPast(
  ref: React.RefObject<HTMLElement | null>,
  offset: number
): boolean {
  const [past, setPast] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => setPast(entry !== undefined && !entry.isIntersecting),
      { rootMargin: `-${offset}px 0px 0px 0px` }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, offset])

  return past
}

/** Past this many, the line stops listing and says "and more". */
const SUMMARY_LIMIT = 3

/**
 * "Repair, service and installation" — the line under an appliance heading.
 *
 * Built from the service keys themselves rather than from a table of labels in
 * this file, so an appliance that gains a gas refill says so without anyone
 * remembering to come back here and write a word for it.
 *
 * It stops at three. A heading followed by two lines naming every single thing
 * in the row underneath is not a subtitle, it is the row read out loud.
 */
function summariseServices(services: readonly CatalogService[]): string {
  const words = [
    ...new Set(services.map((service) => service.serviceKey.replace(/-/g, ' '))),
  ]
  if (words.length === 0) return ''

  const sentence =
    words.length > SUMMARY_LIMIT
      ? `${words.slice(0, SUMMARY_LIMIT - 1).join(', ')} and more`
      : words.length === 1
        ? String(words[0])
        : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`

  return sentence.charAt(0).toUpperCase() + sentence.slice(1)
}

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
      className="mt-4 flex items-start gap-3 rounded-card border border-border bg-warning-soft p-4"
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
