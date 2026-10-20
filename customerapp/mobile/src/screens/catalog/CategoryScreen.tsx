import { useEffect, useRef, useState } from 'react'
import { SectionList, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { PackageOpen, Search, Sparkles } from 'lucide-react-native'
import type { Category, Service } from '@app/shared/catalog-v2'

import { Header, HeaderAction, Screen } from '@/components/Screen'
import { Icon } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { serviceQty } from '@/lib/data/cart'
import { useCategoryPage, type CategorySection } from '@/lib/data/catalog'
import { hasPublicAsset } from '@/lib/publicAsset'
import { useCartActions, ViewCartBar } from './cartActions'
import { OptionsSheet } from './OptionsSheet'
import { ServiceListItem } from './ServiceListItem'

/**
 * A category: its sub-categories as tiles across the top, then a section per
 * sub-category with its services, the way UC opens AC Repair or Cleaning.
 * A tile jumps to its section. Opened on a sub-category (/category/ac), the
 * page is still the whole category, scrolled to that section.
 *
 * Everything on it is data (lib/data/catalog), so Cleaning and Salon are this
 * same screen with different rows.
 */
export function CategoryScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const id = typeof params.id === 'string' ? params.id : ''
  const page = useCategoryPage(id)
  const { cart, change, confirm } = useCartActions(page.data?.root.id)
  const [optionsFor, setOptionsFor] = useState<Service | null>(null)
  const list = useRef<SectionList<Service, CategorySection & { data: Service[] }>>(null)

  const sections = (page.data?.sections ?? []).map((section) => ({ ...section, data: section.services }))

  function jumpTo(categoryId: string): void {
    const sectionIndex = sections.findIndex((s) => s.category.id === categoryId)
    if (sectionIndex >= 0) list.current?.scrollToLocation({ sectionIndex, itemIndex: 0, viewOffset: 56 })
  }

  // Opened on a sub-category: once the list is drawn, go to its section.
  const initial = page.data?.initialSectionId ?? null
  useEffect(() => {
    if (!initial) return
    const timer = setTimeout(() => jumpTo(initial), 300)
    return () => clearTimeout(timer)
    // jumpTo reads the sections drawn for this page; it runs once they are.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, sections.length])

  const title = page.data?.root.name ?? ''

  return (
    <Screen
      scroll={false}
      header={
        <Header
          title={title}
          showBack
          backFallback="/home"
          right={
            <HeaderAction href="/search" label="Search">
              <Icon as={Search} className="size-5 text-ink" />
            </HeaderAction>
          }
        />
      }
      footer={<ViewCartBar cart={cart} />}
    >
      {page.status === 'loading' ? (
        <CategorySkeleton />
      ) : page.status === 'error' ? (
        <ErrorState className="mt-10 px-4" onRetry={page.reload} retrying={page.refreshing} />
      ) : !page.data ? (
        <ErrorState className="mt-10 px-4" kind="notFound" />
      ) : sections.length === 0 ? (
        <EmptyState
          className="mt-10 px-4"
          icon={PackageOpen}
          title="Nothing here yet"
          description="We are adding services to this category. Check back soon."
          action={{ label: 'Back to Home', href: '/home' }}
        />
      ) : (
        <SectionList
          ref={list}
          sections={sections}
          keyExtractor={(service) => service.id}
          stickySectionHeadersEnabled={false}
          contentContainerClassName="px-4 pb-10"
          onScrollToIndexFailed={() => undefined}
          ListHeaderComponent={
            <SubCategoryTiles
              categories={sections.map((s) => s.category)}
              tagline={page.data.root.tagline}
              onPick={jumpTo}
            />
          }
          renderSectionHeader={({ section }) => (
            <View className="-mx-4 mt-2 border-t-8 border-surface px-4 pt-6">
              <Text accessibilityRole="header" className="text-xl font-bold text-ink">
                {section.category.name}
              </Text>
            </View>
          )}
          renderItem={({ item, index, section }) => {
            const qty = serviceQty(cart.items, item.id)
            const hasOptions = item.variants.length > 0
            return (
              <ServiceListItem
                service={item}
                qty={qty}
                last={index === section.data.length - 1}
                onAdd={() => (hasOptions ? setOptionsFor(item) : change(item, undefined, 1))}
                onIncrease={() => (hasOptions ? setOptionsFor(item) : change(item, undefined, qty + 1))}
                onDecrease={() => (hasOptions ? setOptionsFor(item) : change(item, undefined, qty - 1))}
              />
            )
          }}
        />
      )}

      <OptionsSheet
        service={optionsFor}
        cart={cart}
        onChange={(service, variant, qty) => change(service, variant, qty)}
        onClose={() => setOptionsFor(null)}
      />
      {confirm}
    </Screen>
  )
}

/** The sub-categories as picture tiles, three to a row. */
function SubCategoryTiles({
  categories,
  tagline,
  onPick,
}: {
  categories: Category[]
  tagline: string | undefined
  onPick: (id: string) => void
}) {
  return (
    <View className="pb-6 pt-2">
      {tagline ? <Text className="text-sm text-muted">{tagline}</Text> : null}
      <View className="mt-4 flex-row flex-wrap gap-3">
        {categories.map((category) => (
          <Tappable
            key={category.id}
            onPress={() => onPick(category.id)}
            accessibilityLabel={`${category.name} services`}
            className="w-[30.5%] items-center gap-2 active:opacity-70"
          >
            <View className="aspect-square w-full items-center justify-center overflow-hidden rounded-card bg-plate">
              {hasPublicAsset(category.image) ? (
                <Img src={category.image} alt="" className="size-full" contentFit="contain" />
              ) : (
                <Icon as={Sparkles} className="size-6 text-muted" />
              )}
            </View>
            <Text numberOfLines={2} className="text-center text-xs font-medium text-ink">
              {category.name}
            </Text>
          </Tappable>
        ))}
      </View>
    </View>
  )
}

function CategorySkeleton() {
  return (
    <SkeletonGroup label="Loading services" className="gap-4 px-4 pt-4">
      <View className="flex-row gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square flex-1" />
        ))}
      </View>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} className="flex-row gap-4 py-2">
          <View className="flex-1 gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </View>
          <Skeleton className="size-28" />
        </View>
      ))}
    </SkeletonGroup>
  )
}
