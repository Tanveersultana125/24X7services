import { View } from 'react-native'
import { Star } from 'lucide-react-native'
import type { Review } from '@app/shared'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Chip'
import { Icon, useColor } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * A review the customer left. Read-only — reviews go in through submitReview,
 * once, and only for a completed booking.
 */

export interface ReviewCardProps {
  review: Pick<Review, 'rating' | 'techRating' | 'tags' | 'text' | 'createdAt'>
  /** The service the review was left against, resolved by the caller. */
  serviceName?: string
  technicianName?: string
  className?: string
}

export function ReviewCard({ review, serviceName, technicianName, className }: ReviewCardProps) {
  return (
    <Card className={cn('p-4', className)}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          {serviceName ? (
            <Text numberOfLines={1} className="text-sm font-semibold text-ink">
              {serviceName}
            </Text>
          ) : null}
          <Text className="mt-0.5 text-xs text-muted">{relativeTime(review.createdAt)}</Text>
        </View>
        <Stars value={review.rating} label="Service rating" />
      </View>

      {review.text ? <Text className="mt-3 text-sm leading-[22px] text-ink">{review.text}</Text> : null}

      {review.tags.length > 0 ? (
        <View className="mt-3 flex-row flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </View>
      ) : null}

      {review.techRating && technicianName ? (
        <View className="mt-3 flex-row items-center justify-between border-t border-border pt-3">
          <Text className="text-xs text-muted">{technicianName}</Text>
          <Stars value={review.techRating} label="Technician rating" size="sm" />
        </View>
      ) : null}
    </Card>
  )
}

/**
 * The rating, drawn as filled and hollow stars with the number stated for
 * anyone who is not reading the shapes.
 */
export function Stars({
  value,
  label,
  size = 'md',
  className,
}: {
  value: number
  label: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const ink = useColor('text-ink')
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${label}: ${value} out of 5`}
      className={cn('flex-row items-center gap-0.5 self-start', className)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          as={Star}
          className={cn(size === 'sm' ? 'size-3' : 'size-3.5', n <= value ? 'text-ink' : 'text-border')}
          {...(n <= value ? { fill: ink } : {})}
        />
      ))}
    </View>
  )
}
