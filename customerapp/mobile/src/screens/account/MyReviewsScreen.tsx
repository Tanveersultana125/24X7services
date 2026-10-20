import { FlatList, View } from 'react-native'
import { ChevronRight, Star } from 'lucide-react-native'
import type { Href } from 'expo-router'

import { SignInPrompt } from '@/components/ProfileShell'
import { Header, Screen } from '@/components/Screen'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useAuth } from '@/lib/auth'
import { useMyReviews, type MyReview } from '@/lib/data/profile'
import { cn } from '@/lib/cn'

/**
 * What this customer told us, newest first, each one a way back to the
 * booking it was about. Read-only: a review is a record of what someone
 * thought at the time, and one that can be quietly rewritten later is worth
 * less to everyone — including the next customer reading the rating.
 */
export function MyReviewsScreen() {
  const { user, ready } = useAuth()
  return (
    <Screen scroll={false} header={<Header title="My reviews" showBack backFallback="/profile" />}>
      {!ready ? null : user ? (
        <ReviewList />
      ) : (
        <View className="px-4">
          <SignInPrompt
            icon={Star}
            title="What you told us"
            description="Reviews you write after a job are kept here. Log in to read yours."
          />
        </View>
      )}
    </Screen>
  )
}

function ReviewList() {
  const reviews = useMyReviews()

  if (reviews.status === 'loading' && !reviews.data) {
    return (
      <SkeletonGroup label="Loading your reviews" className="gap-3 px-4 pt-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </SkeletonGroup>
    )
  }
  if (reviews.status === 'error' && !reviews.data) {
    return <ErrorState className="mt-10 px-4" onRetry={reviews.reload} retrying={reviews.refreshing} />
  }

  return (
    <FlatList
      data={reviews.data ?? []}
      keyExtractor={(review) => review.bookingId}
      contentContainerClassName="gap-3 px-4 pb-10 pt-4"
      renderItem={({ item }) => <ReviewRow review={item} />}
      ListEmptyComponent={
        <EmptyState
          className="mt-10"
          icon={Star}
          title="No reviews yet"
          description="Reviews you write after a job show here."
          action={{ label: 'See your bookings', href: '/bookings' }}
        />
      }
    />
  )
}

function ReviewRow({ review }: { review: MyReview }) {
  return (
    <Tappable
      href={`/booking/${review.bookingId}` as Href}
      accessibilityLabel={`${review.serviceName}, ${review.rating} out of 5 stars. Open the booking.`}
      className="rounded-card border border-border p-4 active:bg-surface active:opacity-100"
    >
      <View className="flex-row items-start gap-3">
        <View className="min-w-0 flex-1">
          <Text numberOfLines={2} className="text-base font-semibold text-ink">
            {review.serviceName}
          </Text>
          <View className="mt-1.5 flex-row items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Icon
                key={n}
                as={Star}
                filled={n <= review.rating}
                className={cn('size-4', n <= review.rating ? 'text-warning' : 'text-border')}
              />
            ))}
            <Text className="ml-2 text-xs text-muted">{shortDate(review.at)}</Text>
          </View>
        </View>
        <Icon as={ChevronRight} className="mt-1 size-4 text-muted" />
      </View>
      {review.comment ? <Text className="mt-3 text-sm leading-[20px] text-ink">{review.comment}</Text> : null}
    </Tappable>
  )
}

/** "5 Oct 2026" */
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
