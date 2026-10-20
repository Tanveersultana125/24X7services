import { FlatList, View } from 'react-native'
import { Copy, TicketPercent } from 'lucide-react-native'
import { formatPaise } from '@app/shared'

import { Header, Screen } from '@/components/Screen'
import { useToast } from '@/components/Toast'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useCoupons, type Coupon } from '@/lib/data/account'
import { useCategories } from '@/lib/data/catalog'
import { copyText } from '@/lib/share'

/**
 * Every offer that is live today, with its code and its small print. This is
 * the shelf, not the till: a coupon is applied in the cart, where the cart
 * can say whether it fits. Here the customer only needs to read the terms and
 * take the code away, so each card has one action, Copy.
 *
 * Public: an offer you have to sign in to read is an offer nobody sees.
 */
export function CouponsScreen() {
  const coupons = useCoupons()
  // Root categories, to name the ones a limited coupon is for. Until they load
  // the id stands in, which already reads as a word.
  const categories = useCategories()
  const nameOf = (id: string): string => categories.data?.find((c) => c.id === id)?.name ?? id.replace(/-/g, ' ')

  return (
    <Screen scroll={false} header={<Header title="Coupons and offers" showBack backFallback="/profile" />}>
      {coupons.status === 'loading' && !coupons.data ? (
        <SkeletonGroup label="Loading offers" className="gap-3 px-4 pt-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </SkeletonGroup>
      ) : coupons.status === 'error' && !coupons.data ? (
        <ErrorState className="mt-10 px-4" onRetry={coupons.reload} retrying={coupons.refreshing} />
      ) : (
        <FlatList
          data={coupons.data ?? []}
          keyExtractor={(coupon) => coupon.code}
          contentContainerClassName="gap-3 px-4 pb-10 pt-4"
          renderItem={({ item }) => <CouponCard coupon={item} nameOf={nameOf} />}
          ListEmptyComponent={
            <EmptyState
              className="mt-10"
              icon={TicketPercent}
              title="No offers right now"
              description="New coupons show up here the day they go live. Check back before your next booking."
              action={{ label: 'Explore services', href: '/services' }}
            />
          }
        />
      )}
    </Screen>
  )
}

function CouponCard({ coupon, nameOf }: { coupon: Coupon; nameOf: (categoryId: string) => string }) {
  const toast = useToast()

  async function copy(): Promise<void> {
    const outcome = await copyText(coupon.code)
    if (outcome === 'copied') toast.show('Copied', { tone: 'success' })
    else toast.show('Could not copy the code. Type it in at checkout instead.', { tone: 'error' })
  }

  const terms = [
    coupon.minOrder > 0 ? `Min. order ${formatPaise(coupon.minOrder)}` : 'No minimum order',
    `Valid till ${validTill(coupon.expiresAt)}`,
  ].join(' · ')

  return (
    <View className="rounded-card border border-border p-4">
      <View className="flex-row items-start gap-3">
        <View className="size-10 items-center justify-center rounded-full bg-brand-soft">
          <Icon as={TicketPercent} className="size-5 text-brand" />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-ink">{coupon.title}</Text>
          <Text className="mt-0.5 text-sm text-muted">{coupon.description}</Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center gap-2">
        <View className="min-w-0 flex-1 flex-row">
          <Text
            accessibilityLabel={`Code ${coupon.code}`}
            className="rounded-pill border border-dashed border-brand bg-brand-soft px-3 py-1.5 text-sm font-bold tracking-[1px] text-brand"
          >
            {coupon.code}
          </Text>
        </View>
        <Tappable
          onPress={() => void copy()}
          accessibilityLabel={`Copy ${coupon.code}`}
          className="min-h-11 flex-row items-center gap-1.5 rounded-pill px-3 active:bg-surface"
        >
          <Icon as={Copy} className="size-4 text-brand" />
          <Text className="text-sm font-bold text-brand">Copy</Text>
        </Tappable>
      </View>

      <View className="mt-3 border-t border-dashed border-border pt-3">
        <Text className="text-xs text-muted">{terms}</Text>
        {coupon.categoryIds?.length ? (
          <Text className="mt-1 text-xs text-muted">{`Only on ${listOf(coupon.categoryIds.map(nameOf))} services`}</Text>
        ) : null}
      </View>
    </View>
  )
}

/** "30 Nov" — the year only when it is not this one. */
function validTill(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number) as [number, number, number]
  const date = new Date(y, m - 1, d)
  const sameYear = y === new Date().getFullYear()
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })
}

function listOf(names: string[]): string {
  return names.length < 2 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}
