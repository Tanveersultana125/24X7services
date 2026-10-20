import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import type { Booking } from '@app/shared/catalog-v2'

import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { BottomSheet } from '@/components/ui/Overlay'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useSlots } from '@/lib/data/booking'
import { cancelBooking, rescheduleBooking } from '@/lib/data/bookingActions'
import { cn } from '@/lib/cn'
import { dayOfMonth, time12, weekday } from '@/screens/checkout/when'

/**
 * Cancel or reschedule, in one sheet. Rescheduling comes first: most people
 * who reach for Cancel mean "not then". Cancelling asks why (one tap) and
 * says where the money goes before it happens.
 */

const REASONS = [
  'I booked by mistake',
  'I need a different time',
  'The problem is fixed now',
  'I found someone else',
  'The price is too high',
  'Something else',
]

export function ManageSheet({
  booking,
  mode,
  onClose,
  onChanged,
}: {
  booking: Booking
  mode: 'reschedule' | 'cancel' | null
  onClose: () => void
  onChanged: () => void
}) {
  return (
    <BottomSheet
      open={mode !== null}
      onClose={onClose}
      title={mode === 'cancel' ? 'Cancel this booking?' : 'Pick a new time'}
      description={mode === 'cancel' ? 'Free until the professional is on the way.' : 'Same professional pool, same price.'}
    >
      {mode === 'cancel' ? <Cancel booking={booking} onDone={onChanged} /> : mode === 'reschedule' ? <Reschedule booking={booking} onDone={onChanged} /> : null}
    </BottomSheet>
  )
}

function Cancel({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const toast = useToast()
  const [reason, setReason] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const paid = booking.status !== 'pending_payment'

  async function confirm(): Promise<void> {
    if (!reason) return
    setBusy(true)
    try {
      await cancelBooking(booking.id, reason)
      toast.show(paid ? 'Cancelled. Your refund is on its way.' : 'Cancelled.', { tone: 'success' })
      onDone()
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'We could not cancel it. Please try again.', { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-ink">Why are you cancelling?</Text>
      <View accessibilityRole="radiogroup">
        {REASONS.map((r) => (
          <Tappable
            key={r}
            onPress={() => setReason(r)}
            accessibilityRole="radio"
            accessibilityState={{ selected: reason === r }}
            className="min-h-12 flex-row items-center gap-3 border-b border-border"
          >
            <View className={cn('size-5 items-center justify-center rounded-full border-2', reason === r ? 'border-brand' : 'border-border')}>
              {reason === r ? <View className="size-2.5 rounded-full bg-brand" /> : null}
            </View>
            <Text className="flex-1 text-sm text-ink">{r}</Text>
          </Tappable>
        ))}
      </View>
      {paid ? (
        <Text className="mt-3 text-xs text-muted">The full amount goes back to how you paid, in 3–5 working days.</Text>
      ) : null}
      <Button variant="danger" fullWidth size="lg" className="mt-5" onPress={() => void confirm()} loading={busy} disabled={!reason}>
        Cancel booking
      </Button>
    </View>
  )
}

function Reschedule({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const toast = useToast()
  const slots = useSlots()
  const [date, setDate] = useState<string | null>(null)
  const [start, setStart] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const days = slots.data ?? []
  const activeDate = date ?? days.find((d) => d.slots.some((s) => s.available))?.date ?? null
  const day = days.find((d) => d.date === activeDate)

  async function confirm(): Promise<void> {
    if (!activeDate || !start) return
    setBusy(true)
    try {
      await rescheduleBooking(booking.id, { date: activeDate, start })
      toast.show('Moved. We will let your professional know.', { tone: 'success' })
      onDone()
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'We could not move it. Please try again.', { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  if (slots.status === 'loading') return <Skeleton className="h-48" />
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pb-1">
        {days.map((d) => {
          const on = d.date === activeDate
          return (
            <Tappable
              key={d.date}
              onPress={() => {
                setDate(d.date)
                setStart(null)
              }}
              accessibilityState={{ selected: on }}
              className={cn('h-16 w-14 items-center justify-center rounded-card border', on ? 'border-brand bg-brand-soft' : 'border-border')}
            >
              <Text className={cn('text-xs', on ? 'font-semibold text-brand' : 'text-muted')}>{weekday(d.date)}</Text>
              <Text className={cn('text-lg font-bold', on ? 'text-brand' : 'text-ink')}>{dayOfMonth(d.date)}</Text>
            </Tappable>
          )
        })}
      </ScrollView>
      <View className="mt-4 flex-row flex-wrap gap-2">
        {(day?.slots ?? []).map((slot) => (
          <Chip key={slot.start} selected={slot.start === start} disabled={!slot.available} onPress={() => setStart(slot.start)}>
            {time12(slot.start)}
          </Chip>
        ))}
      </View>
      <Button fullWidth size="lg" className="mt-5" onPress={() => void confirm()} loading={busy} disabled={!start}>
        Move booking
      </Button>
    </View>
  )
}
