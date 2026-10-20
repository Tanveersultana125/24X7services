import { View } from 'react-native'
import { type Href } from 'expo-router'
import { ChevronRight, Sparkles } from 'lucide-react-native'

import { Icon } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useCategories } from '@/lib/data/catalog'
import { cn } from '@/lib/cn'
import { hasPublicAsset } from '@/lib/publicAsset'

/**
 * The top-level categories (Appliance Repair, Cleaning, Salon) as rows, each
 * opening its category page. Drawn from data, so a new category shows up here
 * without a code change. Nothing at all while it fails: the rest of the screen
 * still works without it.
 */
export function CategoryStrip({ className }: { className?: string }) {
  const categories = useCategories()

  if (categories.status === 'loading') return <Skeleton className={cn('h-44', className)} />
  if (categories.status === 'error' || !categories.data?.length) return null

  return (
    <View className={className}>
      <Text accessibilityRole="header" className="mb-3 text-xl font-bold text-ink">
        Browse by category
      </Text>
      <View className="overflow-hidden rounded-card border border-border">
        {categories.data.map((category, index) => (
          <Tappable
            key={category.id}
            href={`/category/${category.id}` as Href}
            className={cn(
              'min-h-16 flex-row items-center gap-3 px-4 py-3 active:bg-surface active:opacity-100',
              index < categories.data!.length - 1 && 'border-b border-border'
            )}
          >
            <View className="size-12 items-center justify-center overflow-hidden rounded-card bg-plate">
              {hasPublicAsset(category.image) ? (
                <Img src={category.image} alt="" className="size-full" contentFit="contain" />
              ) : (
                <Icon as={Sparkles} className="size-5 text-muted" />
              )}
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-base font-semibold text-ink">{category.name}</Text>
              {category.tagline ? (
                <Text numberOfLines={1} className="text-xs text-muted">
                  {category.tagline}
                </Text>
              ) : null}
            </View>
            <Icon as={ChevronRight} className="size-4 text-muted" />
          </Tappable>
        ))}
      </View>
    </View>
  )
}
