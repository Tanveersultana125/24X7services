import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { CalendarClock, CircleCheck, MapPin } from 'lucide-react-native'
import { formatPaise } from '@app/shared'

import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/States'
import { Text } from '@/components/ui/Text'
import { useBooking } from '@/lib/data/bookings'
import { longDate, time12 } from './when'

/**
 * Booked. The booking number, when and where, what was paid, and the two
 * things to do next: watch it, or go back to browsing. Back from here goes
 * Home, not into a checkout that has already been paid for.
 */
export function ConfirmedScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const id = typeof params.id === 'string' ? params.id : ''
  const booking = useBooking(id)
  const insets = useSafeAreaInsets()
  const data = booking.data

  return (
    <View className="flex-1 bg-bg px-4" style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }}>
      {booking.status === 'loading' ? (
        <SkeletonGroup label="Loading your booking" className="mt-10 gap-4">
          <Skeleton className="mx-auto size-20 rounded-full" />
          <Skeleton className="h-40" />
        </SkeletonGroup>
      ) : booking.status === 'error' ? (
        <ErrorState className="mt-10" onRetry={booking.reload} retrying={booking.refreshing} />
      ) : !data ? (
        <ErrorState className="mt-10" kind="notFound" />
      ) : (
        <View className="flex-1">
          <View className="items-center">
            <View className="size-20 items-center justify-center rounded-full bg-success-soft">
              <Icon as={CircleCheck} className="size-10 text-success" />
            </View>
            <Text accessibilityRole="header" className="mt-5 text-center text-2xl font-bold text-ink">
              Booking confirmed
            </Text>
            <Text className="mt-2 text-center text-sm text-muted">
              {`Booking ID ${data.id}. We will assign a professional and let you know before the visit.`}
            </Text>
          </View>

          <View className="mt-8 gap-4 rounded-card border border-border p-4">
            <Row icon={CalendarClock} title={longDate(data.slot.date)} detail={`Arrives from ${time12(data.slot.start)}`} />
            <Row icon={MapPin} title={data.address.line1} detail={[data.address.line2, `${data.address.city} ${data.address.pincode}`].filter(Boolean).join(', ')} />
            <View className="h-px bg-border" />
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Paid</Text>
              <Text className="text-base font-bold text-ink tabular-nums">{formatPaise(data.price.total)}</Text>
            </View>
          </View>

          <View className="mt-auto gap-2">
            <Button fullWidth size="lg" href="/bookings" replace>
              View my bookings
            </Button>
            <Button variant="ghost" fullWidth href="/home" replace>
              Back to Home
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}

function Row({ icon, title, detail }: { icon: typeof MapPin; title: string; detail: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <Icon as={icon} className="mt-0.5 size-5 text-muted" />
      <View className="min-w-0 flex-1">
        <Text className="text-base font-semibold text-ink">{title}</Text>
        <Text className="mt-0.5 text-sm text-muted">{detail}</Text>
      </View>
    </View>
  )
}
