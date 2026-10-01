'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { ChevronRight, MapPinOff, ShieldCheck } from 'lucide-react'
import type {
  Banner,
  BannerTone,
  CatalogAppliance,
  CatalogBrand,
  CatalogIssue,
  CatalogService,
  Paise,
  PopularService,
} from '@app/shared'
import { formatPaise } from '@app/shared'

import { AppShell, Section } from '@/components/AppShell'
import { HomeHeader } from '@/components/HomeHeader'
import { SearchBar } from '@/components/SearchBar'
import {
  PromotionalBanner,
  BannerCard,
  TONE_TOP,
  TONES_EDGE,
} from '@/components/PromotionalBanner'
import { CategoryGrid } from '@/components/CategoryGrid'
import {
  ServiceRail,
  durationNote,
  type ServiceRailItem,
} from '@/components/ServiceRail'
import { BrandDisclaimer } from '@/components/BrandCard'
import { BrandLogoRow } from '@/components/BrandLogoRow'
import { TrustPoints } from '@/components/TrustPoints'
import { useLocation } from '@/lib/useLocation'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ErrorState'
import {
  CategoryGridSkeleton,
  HomeSkeleton,
  Skeleton,
} from '@/components/SkeletonLoader'
import { CartBar } from '@/components/CartBar'
import { VideoRail, type ReelItem } from '@/components/VideoRail'
import { ServiceSheet, serviceOptions } from '@/components/ServiceSheet'
import { ReferBanner } from '@/components/ReferBanner'
import { SpotlightRail } from '@/components/SpotlightRail'
import { cn } from '@/lib/cn'
import {
  fetchAllIssues,
  fetchAllServices,
  fetchAppliances,
  fetchBanners,
  fetchBrands,
  fetchPopularServices,
} from '@/lib/catalog'
import { callFn } from '@/lib/callables'
import { LOCATION_STALE_MS, locationLabel } from '@/lib/location'
import { useAsync } from '@/lib/useAsync'

/**
 * Home.
 *
 * Everything on it comes from the catalog. No appliance, service, brand or
 * price is written into this file — a new appliance is a seed entry, and it
 * appears here without anyone editing a screen.
 *
 * The top of it is one unbroken block of colour running the full width of the
 * screen, from the status bar down: the location and the search field float on
 * it, and it is the offer itself that paints it. The white page starts where
 * that block stops, with the grid of everything we service. The block says
 * where you are and what this place sells; everything below it is the shop.
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
  issues: CatalogIssue[]
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
    const [banners, popular, appliances, services, brands, issues] =
      await Promise.all([
        fetchBanners(),
        fetchPopularServices(),
        fetchAppliances(),
        fetchAllServices(),
        fetchBrands(),
        fetchAllIssues(),
      ])
    return { banners, popular, appliances, services, brands, issues }
  }, [])

  const home = useAsync(load)

  // The service whose options sheet is open — a repair, where "Add" means
  // picking the problem first.
  const [sheetId, setSheetId] = useState<string | null>(null)

  // Once the page leaves the top, the pinned search field grows a shadow so
  // it reads as sitting above what scrolls under it.
  const scrolled = useScrolled(SCROLL_THRESHOLD)
  // The banner's colour under the header, and whether the banner has gone up
  // past it — the header keeps the colour until then, so no strip of page
  // colour opens between it and the banner still in view.
  const [heroTone, setHeroTone] = useState<BannerTone | null>(null)
  const pastHero = useScrolled(HERO_HEIGHT)

  // How far down the page the banner ends, for the gradient behind the header
  // and the banner to reach exactly that far.
  const heroRef = useRef<HTMLDivElement | null>(null)
  const [heroHeight, setHeroHeight] = useState(0)
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const measure = (): void => {
      setHeroHeight(Math.round(el.getBoundingClientRect().bottom + window.scrollY))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useStaleLocationCheck(location, setLocation)

  // Someone who cleared their storage, or arrived on this URL directly, has no
  // location and nothing on this screen applies to them yet.
  useEffect(() => {
    if (ready && !location) router.replace('/location')
  }, [ready, location, router])

  const data = home.data
  const imageFor = new Map(
    data?.appliances.map((appliance) => [appliance.id, appliance.image]) ?? []
  )

  const sheetService =
    data?.services.find((service) => service.id === sheetId) ?? null

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
        // A promoted row names an appliance and a service key; the
        // photograph and the score both belong to the catalog entry behind
        // that pair, not to the promotion. The technician at that job, where
        // there is one: a row of people at work, in colour, rather than a
        // row of grey machines.
        photo: listed?.technicianPhoto ?? listed?.photo,
        rating: listed?.rating,
        reviewCount: listed?.reviewCount,
        href: `/services/appliance/?a=${popular.applianceId}` as Route,
        note: durationNote(listed?.durationMinutes),
        priceLabel: 'Visit from',
        price: popular.fromPrice,
        applianceId: popular.applianceId,
        serviceKey: popular.serviceKey,
        options: listed ? serviceOptions(listed, data.issues).length : 0,
        onOptions: listed ? () => setSheetId(listed.id) : undefined,
        onOpen: listed ? () => setSheetId(listed.id) : undefined,
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

  // The reels: one per appliance, opening on the repair where there is one,
  // since that is what most people arrive needing. Its footage where it has
  // some; otherwise the appliance's photograph of itself in a room.
  const reels: ReelItem[] = rows.flatMap((row) => {
    const service =
      row.services.find((each) => each.serviceKey === 'repair') ??
      row.services[0]
    const photo = service?.reelPoster ?? row.appliance.heroImage
    if (!service || !photo) return []
    return [
      {
        id: service.id,
        photo,
        video: service.reel,
        title: service.name,
        href: `/services/appliance/?a=${service.applianceId}&s=${
          service.serviceKey
        }` as Route,
      },
    ]
  })

  return (
    <AppShell
      mobileHeader={
        <HomeHeader
          raised={scrolled}
          area={location?.area}
          detail={
            location ? `${location.city} ${location.pincode}` : undefined
          }
          // The banner's colour while there is a banner to match.
          tone={
            heroTone && heroBanners.length > 0 && !pastHero
              ? TONE_TOP[heroTone]
              : undefined
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

      {/* The banner's own height while it loads, so the page does not jump
          when it lands; nothing at all once there is genuinely no banner. */}
      {/* One gradient behind the header and the banner together, from the
          top of the screen to the foot of the banner, in the colour of the
          slide in view — the way the marketplaces open Home, as one block.
          A layer per tone, cross-fading, so a slide change is a change of
          light rather than a cut. Phone only; a laptop has the card. */}
      {data && heroBanners.length > 0 && heroHeight > 0 ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 lg:hidden"
          style={{ height: heroHeight }}
        >
          {[...new Set(heroBanners.map((banner) => banner.tone))].map((tone) => (
            <div
              key={tone}
              className={cn(
                'absolute inset-0 bg-linear-to-b transition-opacity duration-500',
                TONES_EDGE[tone],
                tone === (heroTone ?? heroBanners[0]?.tone)
                  ? 'opacity-100'
                  : 'opacity-0'
              )}
            />
          ))}
        </div>
      ) : null}

      <div ref={heroRef} className="relative z-[1] -mx-4 lg:mx-0 lg:mt-5">
        {data && heroBanners.length > 0 ? (
          <PromotionalBanner
            banners={heroBanners}
            edgeToEdge
            onToneChange={setHeroTone}
          />
        ) : home.status === 'loading' ? (
          <Skeleton className="h-48 rounded-none lg:hidden" />
        ) : null}
      </div>

      {location && !location.serviceable ? (
        <UnserviceableNotice
          area={locationLabel(location)}
          onChange={() => router.push('/location')}
        />
      ) : null}

      {/* The first card under the hero, and the one that renders in all three
          states: the grid, the retry, or the grid's own skeleton.

          The catalog is checked before the status, so a reload that fails with
          a catalog already on screen leaves the page standing rather than
          punching an error through the middle of it. */}
      <Card raised className="mt-5 p-4 lg:mt-8 lg:p-5">
        {data ? (
          <>
            <h2 className="mb-3 text-xl font-bold text-ink">What we service</h2>
            <CategoryGrid
              appliances={data.appliances}
              services={data.services}
            />
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

      {/* The one thing on Home that is not a single visit. Both halves of it
          — the annual plans and Plus — lived under Profile, behind an
          account, which is where a price list goes to be unread. */}
      <Link
        href={'/care' as Route}
        className="mt-5 flex items-center gap-3 rounded-card bg-brand-soft p-4 transition-colors duration-[var(--duration-fast)] hover:bg-brand-soft/70 lg:mt-8"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg">
          <ShieldCheck className="size-5 text-brand" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-ink">Care plans</span>
          <span className="mt-0.5 block text-sm text-muted">
            Cover a whole year in one go, and stop paying the visit fee.
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
      </Link>

      {data ? (
        <>
          {/* Large photograph cards, one per appliance, between the
              categories and the lists — the technician at work, and what a
              visit starts at. */}
          <Section title="In the spotlight">
            <SpotlightRail
              items={data.appliances.flatMap((appliance) => {
                if (!appliance.heroImage) return []
                const fees = data.services
                  .filter((service) => service.applianceId === appliance.id)
                  .map((service) => service.visitFee)
                return [
                  {
                    id: appliance.id,
                    title: `${appliance.name} service & repair`,
                    note: fees.length
                      ? `Starts at ${formatPaise(Math.min(...fees) as Paise)}`
                      : undefined,
                    photo: appliance.heroImage,
                    href: `/services/appliance/?a=${appliance.id}` as Route,
                  },
                ]
              })}
            />
          </Section>

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
                {/* Halfway down the rows rather than at the top: a break in a
                    long run of near-identical rails, at a row no inline
                    banner lands on. */}
                {index === Math.min(REELS_AT_ROW, rows.length - 1) &&
                reels.length > 0 ? (
                  <Section
                    title="Handpicked for your home"
                    subtitle="Our most trusted services"
                  >
                    <VideoRail items={reels} />
                  </Section>
                ) : null}

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
                      photo: service.photo,
                      rating: service.rating,
                      reviewCount: service.reviewCount,
                      href:
                        `/services/appliance/?a=${service.applianceId}` as Route,
                      note: durationNote(service.durationMinutes),
                      priceLabel: 'Visit fee',
                      price: service.visitFee,
                      applianceId: service.applianceId,
                      serviceKey: service.serviceKey,
                      options: serviceOptions(service, data.issues).length,
                      onOptions: () => setSheetId(service.id),
                      onOpen: () => setSheetId(service.id),
                    }))}
                  />
                </Section>
              </div>
            )
          })}

          {data.brands.length > 0 ? (
            <Section title="Brands we service">
              <BrandLogoRow brands={data.brands} />
              {/* Required wherever manufacturer names appear. */}
              <BrandDisclaimer className="mt-3" />
            </Section>
          ) : null}

          <Section title="Why book with us">
            <Card className="p-4">
              <TrustPoints />
            </Card>
          </Section>

          <ReferBanner className="mt-8" />

          <HomeFooter />
        </>
      ) : home.status === 'loading' ? (
        <HomeSkeleton />
      ) : null}
      <ServiceSheet
        service={sheetService}
        appliance={data?.appliances.find(
          (appliance) => appliance.id === sheetService?.applianceId
        )}
        services={data?.services ?? []}
        issues={data?.issues ?? []}
        onClose={() => setSheetId(null)}
      />
      <CartBar services={data?.services ?? []} />
    </AppShell>
  )
}

// ---------------------------------------------------------------------------

/**
 * The appliance row the reels go in front of — the middle of the page, or the
 * last row on a catalog too short to have one there.
 */
const REELS_AT_ROW = 3

/** How far the page scrolls before the search field grows its shadow. */
const SCROLL_THRESHOLD = 8

/**
 * Whether the page has left the top.
 *
 * A passive listener that sets state only when the answer flips, so a long
 * scroll costs two renders — one each way — and not one per frame.
 */
/** Roughly the edge-to-edge banner's height on a phone, in px. */
const HERO_HEIGHT = 180

function useScrolled(threshold: number): boolean {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function check(): void {
      setScrolled(window.scrollY > threshold)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [threshold])

  return scrolled
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
