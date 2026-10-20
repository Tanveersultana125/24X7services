import { View } from 'react-native'
import type { BookingStatus } from '@app/shared'
import type { Booking } from '@app/shared/catalog-v2'

import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'

/**
 * Where the booking has got to, as UC shows it: the steps from Confirmed to
 * Completed, done ones filled with the time they happened, the current one
 * marked, the rest waiting. "Finding a professional" is a step of its own on
 * screen even though the backend keeps it inside `confirmed`.
 *
 * A cancelled booking does not pretend to be on the way: it shows what
 * actually happened, in order.
 */

const STEPS: { key: string; label: string; reachedBy: BookingStatus[] }[] = [
  { key: 'confirmed', label: 'Booking confirmed', reachedBy: ['confirmed'] },
  { key: 'searching', label: 'Finding a professional', reachedBy: ['confirmed'] },
  { key: 'assigned', label: 'Professional assigned', reachedBy: ['assigned'] },
  { key: 'en_route', label: 'On the way', reachedBy: ['en_route'] },
  { key: 'arrived', label: 'Arrived', reachedBy: ['arrived'] },
  { key: 'in_progress', label: 'Work in progress', reachedBy: ['in_progress', 'awaiting_approval'] },
  { key: 'completed', label: 'Completed', reachedBy: ['completed'] },
]

const ORDER: BookingStatus[] = ['pending_payment', 'confirmed', 'assigned', 'en_route', 'arrived', 'in_progress', 'awaiting_approval', 'completed']

const LABELS: Partial<Record<BookingStatus, string>> = {
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  failed: 'Payment failed',
  pending_payment: 'Waiting for payment',
  awaiting_approval: 'Waiting for your approval',
}

function time(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export function BookingTimeline({ booking, className }: { booking: Booking; className?: string }) {
  const ended = booking.status === 'cancelled' || booking.status === 'refunded' || booking.status === 'failed'
  if (ended) {
    return (
      <View className={className}>
        {booking.timeline.map((event, index) => (
          <Step
            key={`${event.status}-${event.at}`}
            label={LABELS[event.status] ?? STEPS.find((s) => s.key === event.status)?.label ?? event.status}
            detail={[time(event.at), event.note].filter(Boolean).join(' · ')}
            state={index === booking.timeline.length - 1 ? 'current' : 'done'}
            last={index === booking.timeline.length - 1}
            tone={event.status === 'cancelled' || event.status === 'failed' ? 'error' : 'brand'}
          />
        ))}
      </View>
    )
  }

  const at = ORDER.indexOf(booking.status)
  return (
    <View className={className}>
      {STEPS.map((step, index) => {
        const stepAt = Math.min(...step.reachedBy.map((s) => ORDER.indexOf(s)))
        // "Finding a professional" is current while confirmed, done once assigned.
        const reached = step.key === 'searching' ? at >= ORDER.indexOf('assigned') : at >= stepAt
        const current =
          step.key === 'searching'
            ? booking.status === 'confirmed'
            : step.key !== 'confirmed' && booking.status !== 'completed' && step.reachedBy.includes(booking.status)
        const event = [...booking.timeline].reverse().find((e) => e.status === step.key || (step.key === 'in_progress' && e.status === 'awaiting_approval'))
        const detail = booking.status === 'awaiting_approval' && step.key === 'in_progress' ? LABELS.awaiting_approval : event ? time(event.at) : undefined
        return (
          <Step
            key={step.key}
            label={step.label}
            detail={detail}
            state={current ? 'current' : reached ? 'done' : 'todo'}
            last={index === STEPS.length - 1}
            tone="brand"
          />
        )
      })}
    </View>
  )
}

function Step({
  label,
  detail,
  state,
  last,
  tone,
}: {
  label: string
  detail?: string
  state: 'done' | 'current' | 'todo'
  last: boolean
  tone: 'brand' | 'error'
}) {
  const fill = tone === 'error' ? 'bg-error border-error' : 'bg-brand border-brand'
  return (
    <View className="flex-row gap-3" accessibilityLabel={`${label}${state === 'done' ? ', done' : state === 'current' ? ', now' : ''}`}>
      <View className="items-center">
        <View className={cn('mt-0.5 size-4 rounded-full border-2', state === 'todo' ? 'border-border bg-bg' : fill, state === 'current' && 'bg-bg')} />
        {last ? null : <View className={cn('w-0.5 flex-1', state === 'done' ? (tone === 'error' ? 'bg-error' : 'bg-brand') : 'bg-border')} />}
      </View>
      <View className="min-w-0 flex-1 pb-5">
        <Text className={cn('text-sm', state === 'todo' ? 'text-muted' : 'font-semibold text-ink')}>{label}</Text>
        {detail ? <Text className="mt-0.5 text-xs text-muted">{detail}</Text> : null}
      </View>
    </View>
  )
}
