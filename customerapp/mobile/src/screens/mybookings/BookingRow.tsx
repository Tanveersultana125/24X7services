import { View } from 'react-native'
import { type Href } from 'expo-router'
import { CalendarClock, ChevronRight } from 'lucide-react-native'
import { formatPaise } from '@app/shared'
import type { Booking, Service } from '@app/shared/catalog-v2'

import { Icon } from '@/components/ui/Icon'
import { StatusBadge } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { longDate, time12 } from '@/screens/checkout/when'

/** The name a booking goes by in a list: its first service, and how many more. */
export function bookingTitle(booking: Booking, services: readonly Service[]): string {
  const first = services.find((s) => s.id === booking.items[0]?.serviceId)?.name ?? 'Service'
  const more = booking.items.length - 1
  return more > 0 ? `${first} + ${more} more` : first
}

/** One booking in the list: what, when, its status, what it cost. Opens the booking. */
export function BookingRow({ booking, services }: { booking: Booking; services: readonly Service[] }) {
  return (
    <Tappable
      href={`/booking/${booking.id}` as Href}
      className="rounded-card border border-border p-4 active:bg-surface active:opacity-100"
    >
      <View className="flex-row items-start justify-between gap-3">
        <Text className="min-w-0 flex-1 text-base font-semibold text-ink">{bookingTitle(booking, services)}</Text>
        <StatusBadge status={booking.status} />
      </View>
      <View className="mt-2 flex-row items-center gap-2">
        <Icon as={CalendarClock} className="size-4 text-muted" />
        <Text className="text-sm text-muted">{`${longDate(booking.slot.date)} · ${time12(booking.slot.start)}`}</Text>
      </View>
      <View className="mt-3 flex-row items-center justify-between border-t border-border pt-3">
        <Text className="text-xs text-muted">{`#${booking.id}`}</Text>
        <View className="flex-row items-center gap-1">
          <Text className="text-sm font-semibold text-ink tabular-nums">{formatPaise(booking.price.total)}</Text>
          <Icon as={ChevronRight} className="size-4 text-muted" />
        </View>
      </View>
    </Tappable>
  )
}
