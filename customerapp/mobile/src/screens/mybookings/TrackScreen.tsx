import { useEffect, useState } from 'react'
import { Linking, View, useWindowDimensions } from 'react-native'
import { useLocalSearchParams, type Href } from 'expo-router'
import { MapPin, Navigation, Phone, Star } from 'lucide-react-native'
import type { BookingStatus } from '@app/shared'
import type { Booking, TechnicianLite } from '@app/shared/catalog-v2'

import { Header, Screen } from '@/components/Screen'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Skeleton, SkeletonGroup, SkeletonText } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState, StatusBadge } from '@/components/ui/States'
import { Text } from '@/components/ui/Text'
import { fetchPosition, type LivePosition } from '@/lib/data/bookingActions'
import { useBooking } from '@/lib/data/bookings'
import { hasPublicAsset } from '@/lib/publicAsset'
import { LiveMap } from './LiveMap'

/**
 * Where the professional is right now: the map across the top half, and under
 * it the three things a customer waiting at home wants: how long, who, and a
 * way to call them. The position is asked for again every few seconds, which
 * is what the backend's live feed replaces.
 *
 * Tracking means something only between assignment and arrival. Before that
 * there is nobody to follow, and after it they are at the door, so outside
 * that window the screen says so and points back to the booking.
 */

const TRACKABLE: readonly BookingStatus[] = ['assigned', 'en_route', 'arrived']
const POLL_MS = 5000

export function TrackScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const id = typeof params.id === 'string' ? params.id : ''
  const booking = useBooking(id)
  const { height } = useWindowDimensions()
  const data = booking.data
  const mapHeight = Math.round(height * 0.55)

  return (
    <Screen header={<Header title="Track professional" showBack backFallback={`/booking/${id}` as Href} />} contentClassName="px-0">
      {booking.status === 'loading' ? (
        <SkeletonGroup label="Loading tracking" className="gap-4">
          <View style={{ height: mapHeight }}>
            <Skeleton className="flex-1 rounded-none" />
          </View>
          <View className="gap-3 px-4">
            <Skeleton className="h-7 w-1/2" />
            <SkeletonText lines={2} />
            <Skeleton className="h-20" />
          </View>
        </SkeletonGroup>
      ) : booking.status === 'error' ? (
        <ErrorState className="mt-10" onRetry={booking.reload} retrying={booking.refreshing} />
      ) : !data ? (
        <ErrorState className="mt-10" kind="notFound" />
      ) : !TRACKABLE.includes(data.status) || !data.technician ? (
        <EmptyState
          className="mt-10"
          icon={Navigation}
          title="Tracking starts when your professional is on the way"
          description="Once a professional is assigned and sets off, you can follow them here and see when they will arrive."
          action={{ label: 'Back to booking', href: `/booking/${data.id}` as Href }}
        />
      ) : (
        <Live booking={data} technician={data.technician} mapHeight={mapHeight} />
      )}
    </Screen>
  )
}

function Live({ booking, technician, mapHeight }: { booking: Booking; technician: TechnicianLite; mapHeight: number }) {
  const [step, setStep] = useState(0)
  const [position, setPosition] = useState<LivePosition | null>(null)
  const arrived = booking.status === 'arrived'

  // The clock: one tick every few seconds while the screen is open.
  useEffect(() => {
    if (arrived) return
    const timer = setInterval(() => setStep((s) => s + 1), POLL_MS)
    return () => clearInterval(timer)
  }, [arrived])

  // Each tick asks where they are. A late answer for an old tick is dropped.
  useEffect(() => {
    let live = true
    fetchPosition(booking, step)
      .then((next) => {
        if (live) setPosition(next)
      })
      .catch(() => {
        // Keep the last known position; the next tick tries again.
      })
    return () => {
      live = false
    }
  }, [booking, step])

  const home = booking.address.geo ?? null
  const professional = arrived ? home : position ? { lat: position.lat, lng: position.lng } : null
  const headline = arrived
    ? 'Your professional has arrived'
    : position
      ? `Arriving in ${position.etaMinutes} min`
      : 'Finding your professional…'

  return (
    <View>
      <MapFrame height={mapHeight} professional={professional} home={home} />

      <View className="-mt-5 rounded-t-3xl border-t border-border bg-bg px-4 pt-5">
        <View className="mb-1 h-1 w-10 self-center rounded-full bg-border" />
        <View className="mt-3 flex-row items-center justify-between gap-3">
          <Text accessibilityRole="header" accessibilityLiveRegion="polite" className="min-w-0 flex-1 text-2xl font-bold text-ink">
            {headline}
          </Text>
          <StatusBadge status={booking.status} />
        </View>
        <Text className="mt-1 text-sm text-muted">
          {arrived ? 'They are at your door. Keep your appliance easy to reach.' : 'Updates every few seconds as they get closer.'}
        </Text>

        <ProCard technician={technician} />

        <View className="mt-4 flex-row items-start gap-3 rounded-card border border-border p-4">
          <Icon as={MapPin} className="mt-0.5 size-5 text-muted" />
          <View className="min-w-0 flex-1">
            <Text className="text-base font-semibold text-ink">{booking.address.line1}</Text>
            <Text className="mt-0.5 text-sm text-muted">
              {[booking.address.line2, `${booking.address.city} ${booking.address.pincode}`].filter(Boolean).join(', ')}
            </Text>
          </View>
        </View>

        <Button variant="ghost" fullWidth className="mt-3" href={`/booking/${booking.id}` as Href}>
          View booking details
        </Button>
      </View>
    </View>
  )
}

/** The map, sized to the top ~55% of the window rather than a fixed height. */
function MapFrame({ height, professional, home }: { height: number; professional: { lat: number; lng: number } | null; home: { lat: number; lng: number } | null }) {
  return (
    <View style={{ height }}>
      <LiveMap professional={professional} home={home} className="flex-1" />
    </View>
  )
}

function ProCard({ technician }: { technician: TechnicianLite }) {
  const phone = technician.phone
  const initials = technician.name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <View className="mt-5 rounded-card border border-border p-4">
      <View className="flex-row items-center gap-3">
        <View className="size-14 items-center justify-center overflow-hidden rounded-full bg-brand-soft">
          {technician.photo && hasPublicAsset(technician.photo) ? (
            <Img src={technician.photo} alt={technician.name} className="size-full" />
          ) : (
            <Text className="text-lg font-bold text-brand">{initials}</Text>
          )}
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-base font-semibold text-ink">
            {technician.name}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-1">
            {technician.rating ? (
              <>
                <Icon as={Star} filled className="size-3.5 text-warning" />
                <Text className="text-sm text-ink tabular-nums">{technician.rating.toFixed(1)}</Text>
              </>
            ) : null}
            {technician.jobs ? (
              <Text className="text-sm text-muted">{`${technician.rating ? ' · ' : ''}${technician.jobs.toLocaleString('en-IN')} jobs`}</Text>
            ) : null}
          </View>
        </View>
      </View>
      <Button
        className="mt-4"
        fullWidth
        variant="secondary"
        disabled={!phone}
        onPress={phone ? () => void Linking.openURL(`tel:${phone}`) : undefined}
        accessibilityLabel={phone ? `Call ${technician.name}` : 'Calling is not available'}
        iconLeft={<Icon as={Phone} className={phone ? 'size-4 text-brand' : 'size-4 text-white'} />}
      >
        {`Call ${technician.name.split(' ')[0]}`}
      </Button>
      {phone ? null : (
        <Text className="mt-2 text-center text-xs text-muted">Their number appears here once they set off.</Text>
      )}
    </View>
  )
}
