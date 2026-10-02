import { View } from 'react-native'
import { Check } from 'lucide-react-native'
import type { BookingEvent } from '@app/shared'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * What has happened to a booking, in order.
 *
 * It renders the `events` subcollection rather than deriving steps from the
 * current status, so a booking that went through awaiting_approval and back
 * shows both passes instead of a tidy line that never happened.
 *
 * The list is ordered oldest-first, because a timeline read out of order tells
 * a different story.
 */

export interface StatusTimelineProps {
  events: readonly BookingEvent[]
  /** Highlights the last entry as the state the booking is in right now. */
  live?: boolean
  className?: string
}

export function StatusTimeline({ events, live = false, className }: StatusTimelineProps) {
  if (events.length === 0) return null

  return (
    <View accessibilityRole="list" className={className}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1
        const isCurrent = live && isLast

        return (
          <View key={event.id} className="flex-row gap-3">
            <View className="items-center">
              <View
                aria-hidden
                className={cn(
                  'size-6 shrink-0 items-center justify-center rounded-full border-2 border-brand',
                  isCurrent ? 'bg-bg' : 'bg-brand'
                )}
              >
                {isCurrent ? (
                  <View className="size-2 rounded-full bg-brand" />
                ) : (
                  <Icon as={Check} className="size-3.5 text-white" strokeWidth={3} />
                )}
              </View>
              {/* The connector stops at the last entry so the line does not
                  trail off into a step that has not happened. */}
              {!isLast ? <View aria-hidden className="w-0.5 flex-1 bg-border" /> : null}
            </View>

            <View className={cn('min-w-0 flex-1', isLast ? 'pb-0' : 'pb-5')}>
              <Text className={cn('text-sm text-ink', isCurrent ? 'font-semibold' : 'font-medium')}>
                {event.title}
              </Text>
              {event.note ? <Text className="mt-0.5 text-sm text-muted">{event.note}</Text> : null}
              <Text className="mt-0.5 text-xs text-muted">{formatDateTime(event.at)}</Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}
