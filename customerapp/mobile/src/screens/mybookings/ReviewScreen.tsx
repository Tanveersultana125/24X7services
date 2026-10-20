import { useState } from 'react'
import { View } from 'react-native'
import { router, useLocalSearchParams, type Href } from 'expo-router'
import { ClipboardCheck, Star } from 'lucide-react-native'
import type { Booking } from '@app/shared/catalog-v2'

import { Header, Screen } from '@/components/Screen'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Textarea } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { rateBooking } from '@/lib/data/bookingActions'
import { useBooking } from '@/lib/data/bookings'
import { cn } from '@/lib/cn'

/**
 * Rate a finished job. Stars first, because that is the one thing everyone
 * will answer; then tags that match the rating, so a five-star review is
 * one more tap and a one-star review says what went wrong without typing;
 * then a comment for anyone who wants to say more.
 *
 * A booking is rated once. Coming back to it shows what was given.
 */

const MEANING = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Excellent'] as const

const GOOD_TAGS = ['On time', 'Polite', 'Clean work', 'Fixed it right', 'Explained the problem', 'Fair price']
const POOR_TAGS = ['Late', 'Rude', 'Left a mess', 'Problem not fixed', 'Overcharged', 'Did not explain']

const MAX_COMMENT = 500

export function ReviewScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const id = typeof params.id === 'string' ? params.id : ''
  const booking = useBooking(id)
  const data = booking.data
  const back = `/booking/${id}` as Href

  return (
    <Screen header={<Header title="Rate your service" subtitle={data ? `Booking ${data.id}` : undefined} showBack backFallback={back} />}>
      {booking.status === 'loading' ? (
        <SkeletonGroup label="Loading booking" className="mt-8 items-center gap-4">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-28 w-full" />
        </SkeletonGroup>
      ) : booking.status === 'error' ? (
        <ErrorState className="mt-10" onRetry={booking.reload} retrying={booking.refreshing} />
      ) : !data ? (
        <ErrorState className="mt-10" kind="notFound" />
      ) : data.status !== 'completed' ? (
        <EmptyState
          className="mt-10"
          icon={ClipboardCheck}
          title="You can rate this once the job is done"
          description="We will ask for your rating as soon as your professional marks the job complete."
          action={{ label: 'Back to booking', href: back }}
        />
      ) : data.rating ? (
        <Rated rating={data.rating} back={back} />
      ) : (
        <ReviewForm booking={data} />
      )}
    </Screen>
  )
}

function Rated({ rating, back }: { rating: number; back: Href }) {
  return (
    <View className="mt-10 items-center gap-3">
      <Stars value={rating} />
      <Text accessibilityRole="header" className="text-center text-xl font-bold text-ink">{`You rated this ${rating}★`}</Text>
      <Text className="max-w-xs text-center text-sm text-muted">Thank you. Your rating helps other customers and helps our professionals improve.</Text>
      <Button className="mt-3" variant="secondary" href={back} replace>
        Back to booking
      </Button>
    </View>
  )
}

function ReviewForm({ booking }: { booking: Booking }) {
  const toast = useToast()
  const [rating, setRating] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const name = booking.technician?.name.split(' ')[0]
  const options = rating >= 4 ? GOOD_TAGS : POOR_TAGS

  function choose(next: number): void {
    // Moving between good and poor swaps the tag list; keep only what still applies.
    const nextOptions = next >= 4 ? GOOD_TAGS : POOR_TAGS
    setTags((current) => current.filter((tag) => nextOptions.includes(tag)))
    setRating(next)
  }

  function toggle(tag: string): void {
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]))
  }

  async function submit(): Promise<void> {
    if (!rating) return
    setSending(true)
    try {
      await rateBooking({ bookingId: booking.id, rating, tags, comment: comment.trim() })
      toast.show('Thanks for your rating', { tone: 'success' })
      router.replace(`/booking/${booking.id}` as Href)
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'We could not send your rating. Please try again.', { tone: 'error' })
      setSending(false)
    }
  }

  return (
    <>
      <View className="mt-8 items-center">
        <Text accessibilityRole="header" className="text-center text-xl font-bold text-ink">
          {name ? `How was your service with ${name}?` : 'How was your service?'}
        </Text>
        <Stars value={rating} onChange={choose} className="mt-5" />
        <Text accessibilityLiveRegion="polite" className={cn('mt-2 h-6 text-base font-semibold', rating ? 'text-ink' : 'text-muted')}>
          {rating ? MEANING[rating] : 'Tap a star to rate'}
        </Text>
      </View>

      {rating ? (
        <View className="mt-6">
          <Text className="mb-3 text-base font-semibold text-ink">{rating >= 4 ? 'What went well?' : 'What went wrong?'}</Text>
          <View className="flex-row flex-wrap gap-2">
            {options.map((tag) => (
              <Chip key={tag} selected={tags.includes(tag)} showCheck onPress={() => toggle(tag)}>
                {tag}
              </Chip>
            ))}
          </View>
        </View>
      ) : null}

      <View className="mt-6">
        <Textarea
          label="Anything else? (optional)"
          placeholder="Tell us more about the visit"
          value={comment}
          onChangeText={(text) => setComment(text.slice(0, MAX_COMMENT))}
          maxLength={MAX_COMMENT}
          hint={`${comment.length}/${MAX_COMMENT}`}
        />
      </View>

      <Button className="mt-6" fullWidth size="lg" disabled={!rating} loading={sending} onPress={() => void submit()}>
        Submit rating
      </Button>
    </>
  )
}

/** Five stars, each a full 44pt target. Read-only when there is no onChange. */
function Stars({ value, onChange, className }: { value: number; onChange?: (n: number) => void; className?: string }) {
  return (
    <View
      className={cn('flex-row items-center gap-1', className)}
      accessibilityRole={onChange ? 'radiogroup' : undefined}
      accessible={!onChange}
      accessibilityLabel={onChange ? undefined : `${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value
        const star = <Icon as={Star} filled={on} strokeWidth={1.75} className={cn('size-9', on ? 'text-warning' : 'text-border')} />
        return onChange ? (
          <Tappable
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="radio"
            accessibilityLabel={`Rate ${n} star${n === 1 ? '' : 's'}`}
            accessibilityState={{ selected: n === value }}
            className="size-14 items-center justify-center rounded-full"
          >
            {star}
          </Tappable>
        ) : (
          <View key={n} className="size-11 items-center justify-center">
            {star}
          </View>
        )
      })}
    </View>
  )
}
