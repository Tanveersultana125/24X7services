import { useState } from 'react'
import { Linking, View } from 'react-native'
import { useLocalSearchParams, type Href } from 'expo-router'
import { CalendarClock, MapPin, Navigation, Phone, Star } from 'lucide-react-native'
import { formatPaise } from '@app/shared'
import type { Booking, Service } from '@app/shared/catalog-v2'

import { Header, Screen } from '@/components/Screen'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { ErrorState, StatusBadge } from '@/components/ui/States'
import { Text } from '@/components/ui/Text'
import { useCartQuestions } from '@/lib/data/booking'
import { canManage } from '@/lib/data/bookingActions'
import { useBooking } from '@/lib/data/bookings'
import { useServicesByIds } from '@/lib/data/catalog'
import { cn } from '@/lib/cn'
import { STATUS_PRESENTATION } from '@/lib/status'
import { PriceBreakup } from '@/screens/cart/PriceBreakup'
import { longDate, time12 } from '@/screens/checkout/when'
import { ApprovalCard } from './ApprovalCard'
import { BookingTimeline } from './BookingTimeline'
import { ManageSheet } from './ManageSheet'
import { PhotosSection } from './PhotosSection'

/**
 * One booking: where it stands, who is coming, what was booked, the answers
 * given, the photos of the job, the bill, and what can still be done with it.
 * There is no job OTP; the timeline and the photos are the record.
 */
export function BookingDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const id = typeof params.id === 'string' ? params.id : ''
  const booking = useBooking(id)
  const data = booking.data

  return (
    <Screen header={<Header title={data ? `Booking #${data.id}` : 'Booking'} showBack backFallback="/bookings" />}>
      {booking.status === 'loading' && !data ? (
        <SkeletonGroup label="Loading booking" className="mt-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-48" />
          <Skeleton className="h-40" />
        </SkeletonGroup>
      ) : booking.status === 'error' && !data ? (
        <ErrorState className="mt-10" onRetry={booking.reload} retrying={booking.refreshing} />
      ) : !data ? (
        <ErrorState className="mt-10" kind="notFound" />
      ) : (
        <Detail booking={data} reload={booking.reload} />
      )}
    </Screen>
  )
}

function Detail({ booking, reload }: { booking: Booking; reload: () => void }) {
  const services = useServicesByIds(booking.items.map((i) => i.serviceId))
  const questions = useCartQuestions(booking.items.map((i) => i.serviceId))
  const [manage, setManage] = useState<'reschedule' | 'cancel' | null>(null)
  const tracking = ['assigned', 'en_route', 'arrived'].includes(booking.status)
  const answered = (questions.data ?? []).filter((q) => booking.answers[q.id] !== undefined)

  return (
    <View className="pt-2">
      <View className="rounded-card border border-border p-4">
        <StatusBadge status={booking.status} />
        <Text className="mt-2 text-sm text-ink">{STATUS_PRESENTATION[booking.status].description}</Text>
        <View className="mt-3 flex-row items-center gap-2">
          <Icon as={CalendarClock} className="size-4 text-muted" />
          <Text className="text-sm text-muted">{`${longDate(booking.slot.date)} · ${time12(booking.slot.start)}`}</Text>
        </View>
      </View>

      {booking.technician ? (
        <View className="mt-4 flex-row items-center gap-3 rounded-card border border-border p-4">
          <View className="size-12 items-center justify-center overflow-hidden rounded-full bg-brand-soft">
            {booking.technician.photo ? (
              <Img src={booking.technician.photo} alt="" className="size-full" />
            ) : (
              <Text className="text-base font-bold text-brand">{booking.technician.name.slice(0, 1)}</Text>
            )}
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-base font-semibold text-ink">{booking.technician.name}</Text>
            {booking.technician.rating ? (
              <View className="flex-row items-center gap-1">
                <Icon as={Star} filled className="size-3 text-ink" />
                <Text className="text-xs text-muted">
                  {`${booking.technician.rating.toFixed(1)}${booking.technician.jobs ? ` · ${booking.technician.jobs} jobs` : ''}`}
                </Text>
              </View>
            ) : null}
          </View>
          {booking.technician.phone ? (
            <Button variant="secondary" size="sm" onPress={() => void Linking.openURL(`tel:${booking.technician?.phone}`)} iconLeft={<Icon as={Phone} className="size-4 text-brand" />}>
              Call
            </Button>
          ) : null}
        </View>
      ) : null}
      {tracking ? (
        <Button fullWidth className="mt-3" href={`/booking/${booking.id}/track` as Href} iconLeft={<Icon as={Navigation} className="size-4 text-white" />}>
          Track your professional
        </Button>
      ) : null}

      {booking.status === 'awaiting_approval' ? <ApprovalCard bookingId={booking.id} onAnswered={reload} /> : null}

      <Block title="Booking status">
        <BookingTimeline booking={booking} />
      </Block>

      <Block title="Services">
        {booking.items.map((item) => (
          <ItemLine key={`${item.serviceId}:${item.variantId ?? ''}`} item={item} services={services.data ?? []} />
        ))}
      </Block>

      {answered.length ? (
        <Block title="What you told us">
          {answered.map((q) => {
            const a = booking.answers[q.id]
            return (
              <View key={q.id} className="mb-2">
                <Text className="text-xs text-muted">{q.label}</Text>
                <Text className="text-sm text-ink">{q.kind === 'photo' ? `${Array.isArray(a) ? a.length : 0} photo(s)` : Array.isArray(a) ? a.join(', ') : a}</Text>
              </View>
            )
          })}
        </Block>
      ) : null}

      <Block title="Address">
        <View className="flex-row gap-3">
          <Icon as={MapPin} className="mt-0.5 size-4 text-muted" />
          <Text className="flex-1 text-sm text-ink">
            {[booking.address.line1, booking.address.line2, `${booking.address.city} ${booking.address.pincode}`].filter(Boolean).join(', ')}
          </Text>
        </View>
      </Block>

      <Block title="Photos of the job">
        <PhotosSection booking={booking} />
      </Block>

      <PriceBreakup price={booking.price} className="mt-6" />

      <View className="mt-6 gap-3">
        {canManage(booking) ? (
          <View className="flex-row gap-3">
            <Button variant="secondary" className="flex-1" onPress={() => setManage('reschedule')}>
              Reschedule
            </Button>
            <Button variant="ghost" className="flex-1" onPress={() => setManage('cancel')} textClassName="text-error">
              Cancel
            </Button>
          </View>
        ) : null}
        {booking.status === 'completed' ? (
          <>
            {booking.rating ? (
              <Text className="text-center text-sm text-muted">{`You rated this ${booking.rating}★. Thank you.`}</Text>
            ) : (
              <Button fullWidth href={`/booking/${booking.id}/review` as Href}>
                Rate your experience
              </Button>
            )}
            <Button variant="secondary" fullWidth href={`/booking/${booking.id}/invoice` as Href}>
              View invoice
            </Button>
          </>
        ) : null}
        <Button variant="ghost" fullWidth href="/support">
          Need help with this booking?
        </Button>
      </View>

      <ManageSheet
        booking={booking}
        mode={manage}
        onClose={() => setManage(null)}
        onChanged={() => {
          setManage(null)
          reload()
        }}
      />
    </View>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-6">
      <Text accessibilityRole="header" className="mb-3 text-lg font-bold text-ink">
        {title}
      </Text>
      {children}
    </View>
  )
}

function ItemLine({ item, services }: { item: Booking['items'][number]; services: readonly Service[] }) {
  const service = services.find((s) => s.id === item.serviceId)
  const variant = service?.variants.find((v) => v.id === item.variantId)
  return (
    <View className={cn('flex-row justify-between gap-3 py-1.5')}>
      <Text className="min-w-0 flex-1 text-sm text-ink">
        {`${service?.name ?? 'Service'}${variant ? ` · ${variant.label}` : ''}${item.qty > 1 ? ` × ${item.qty}` : ''}`}
      </Text>
      <Text className="text-sm text-ink tabular-nums">{formatPaise(item.unitPrice * item.qty)}</Text>
    </View>
  )
}
