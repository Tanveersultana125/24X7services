import { useCallback } from 'react'
import { ScrollView, View, useWindowDimensions } from 'react-native'
import { PackageOpen, TrendingUp } from 'lucide-react-native'
import { router } from 'expo-router'
import type { CatalogAppliance, CatalogService } from '@app/shared'

import { AppShell, Section } from '@/components/AppShell'
import { Header } from '@/components/Screen'
import { CartButton } from '@/components/CartButton'
import { SearchBar } from '@/components/SearchBar'
import { ServicesHero } from '@/components/ServicesHero'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { SERVICES_QUICK_LINKS } from '@/lib/trending'
import { ApplianceSpaceCard } from '@/components/ApplianceSpaceCard'
import { TrustPoints } from '@/components/TrustPoints'
import { HowItWorks, HOW_IT_WORKS_SUBTITLE } from '@/components/HowItWorks'
import { AllBrandsGrid, TopTechnicians } from '@/components/TopTechnicians'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { ApplianceGridSkeleton } from '@/components/SkeletonLoader'
import { cheapestByAppliance, fetchAllServices, fetchAppliances, summaryByAppliance } from '@/lib/catalog'
import { formatPaise } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

/**
 * Everything we service, and what happens after someone books it.
 *
 * The "how it works" block is here rather than on Home because this is the
 * screen a customer reaches when they are deciding whether to trust the
 * process, not when they already know what they want. It is the same block the
 * appliance page carries, from the same component, so the two never drift.
 */

interface ServicesData {
  appliances: CatalogAppliance[]
  services: CatalogService[]
}

export function ServicesScreen() {
  const load = useCallback(async (): Promise<ServicesData> => {
    const [appliances, services] = await Promise.all([fetchAppliances(), fetchAllServices()])
    return { appliances, services }
  }, [])

  const all = useAsync(load)
  const fromPrices = all.data ? cheapestByAppliance(all.data.services) : null
  // An appliance carries no clip and no score of its own — both are worked
  // out from the services under it, and so is how many there are.
  const summaries = all.data ? summaryByAppliance(all.data.services) : null
  // One and a half cards on screen, so the rail reads as one that scrolls.
  const { width } = useWindowDimensions()
  const cardWidth = Math.min(256, Math.round((width - 32) * 0.6))

  const countFor = (applianceId: string): number =>
    all.data?.services.filter((service) => service.applianceId === applianceId).length ?? 0

  return (
    // Services is a tab, and tabs do not usually carry a back arrow. This one
    // does, because most people do not arrive at it through the tab bar: they
    // tap "All services" at the end of Home's grid, and without an arrow the
    // only way back to where they were is to work out that Home is a tab.
    <AppShell
      mobileHeader={
        <Header title="All services" showBack backFallback="/home" right={<CartButton className="mr-2 size-11" />} />
      }
      onRefresh={all.reload}
      refreshing={all.refreshing}
    >
      <ServicesHero />

      {/* The search field floats over the foot of the photograph: the first
          thing to reach for, and it ties the picture to the page. It opens
          the search screen rather than searching in place; the chips under it
          open their service on the appliance page directly. */}
      <View className="-mt-8">
        <SearchBar readOnly prominent onOpen={() => router.push('/search')} />
        <View accessibilityLabel="Popular services" className="mt-3 gap-2">
          {[SERVICES_QUICK_LINKS.slice(0, 2), SERVICES_QUICK_LINKS.slice(2, 4)].map((row) => (
            <View key={row[0].label} className="flex-row gap-2">
              {row.map((chip) => (
                <Tappable
                  key={chip.label}
                  href={{ pathname: '/services/appliance', params: { a: chip.applianceId, s: chip.serviceKey } }}
                  className="min-h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-pill border border-border bg-bg px-3 active:border-brand active:opacity-100"
                >
                  <Icon as={TrendingUp} className="size-3.5 text-brand" />
                  <Text numberOfLines={1} className="shrink text-[13px] font-medium text-ink">
                    {chip.label}
                  </Text>
                </Tappable>
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* The appliances as tall photographs on a rail, the way a catalogue
          of rooms is browsed: the picture says what it is before the name
          does. */}
      <Section className="mt-8" title="What we service">
        {all.status === 'loading' ? (
          <ApplianceGridSkeleton />
        ) : all.status === 'error' ? (
          <ErrorState onRetry={all.reload} retrying={all.refreshing} />
        ) : all.data && all.data.appliances.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="Nothing listed yet"
            description="The catalog is being set up. Please check back shortly."
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + 12}
            decelerationRate="fast"
            className="-mx-4"
            contentContainerClassName="gap-3 px-4"
          >
            {all.data?.appliances.map((appliance, index) => {
              const from = fromPrices?.get(appliance.id)
              return (
                <View key={appliance.id} style={{ width: cardWidth }}>
                  <ApplianceSpaceCard
                    appliance={appliance}
                    serviceCount={countFor(appliance.id)}
                    from={from === undefined ? undefined : formatPaise(from)}
                    rating={summaries?.get(appliance.id)?.rating}
                    priority={index < 2}
                  />
                </View>
              )
            })}
          </ScrollView>
        )}
      </Section>

      <Section title="How it works" subtitle={HOW_IT_WORKS_SUBTITLE}>
        <HowItWorks />
      </Section>

      <Section title="What you get either way">
        <TrustPoints tiles />
      </Section>

      <Section title="Top technicians">
        <TopTechnicians />
      </Section>

      <Section title="We service all brands">
        <AllBrandsGrid />
      </Section>
    </AppShell>
  )
}
