import { useCallback, useState } from 'react'
import { FlatList, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { CalendarCheck, CalendarX2, ClipboardList } from 'lucide-react-native'

import { SignInPrompt } from '@/components/ProfileShell'
import { Header, Screen } from '@/components/Screen'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useAuth } from '@/lib/auth'
import { isUpcoming, useBookings } from '@/lib/data/bookings'
import { useServicesByIds } from '@/lib/data/catalog'
import { cn } from '@/lib/cn'
import { BookingRow } from './BookingRow'

/**
 * My bookings, in two tabs the way UC splits them: Upcoming (anything still
 * to happen or happening, soonest first) and Past (done, cancelled or
 * refunded, most recent first). Comes back fresh every time the tab is
 * opened, so a booking just made or just cancelled is already where it
 * belongs.
 */
export function BookingsScreen() {
  const { user, ready } = useAuth()
  return (
    <Screen tab scroll={false} header={<Header title="My bookings" />}>
      {!ready ? null : user ? (
        <BookingLists />
      ) : (
        <View className="px-4 pt-6">
          <SignInPrompt
            icon={ClipboardList}
            title="Your bookings live here"
            description="Log in to see what is coming up, follow your professional on the way, and find past invoices."
          />
        </View>
      )}
    </Screen>
  )
}

function BookingLists() {
  const bookings = useBookings()
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const all = bookings.data ?? []
  const services = useServicesByIds(all.flatMap((b) => b.items.map((i) => i.serviceId)))

  // Read again whenever the tab comes into view.
  const { reload } = bookings
  useFocusEffect(useCallback(() => reload(), [reload]))

  const upcoming = all.filter(isUpcoming).sort((a, b) => `${a.slot.date}${a.slot.start}`.localeCompare(`${b.slot.date}${b.slot.start}`))
  const past = all.filter((b) => !isUpcoming(b))
  const list = tab === 'upcoming' ? upcoming : past

  return (
    <View className="flex-1">
      <View className="mx-4 mt-3 flex-row rounded-pill bg-surface p-1" accessibilityRole="tablist">
        {(['upcoming', 'past'] as const).map((key) => (
          <Tappable
            key={key}
            onPress={() => setTab(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
            className={cn('min-h-11 flex-1 items-center justify-center rounded-pill', tab === key && 'bg-bg')}
          >
            <Text className={cn('text-sm', tab === key ? 'font-semibold text-ink' : 'text-muted')}>
              {key === 'upcoming' ? `Upcoming${upcoming.length ? ` (${upcoming.length})` : ''}` : 'Past'}
            </Text>
          </Tappable>
        ))}
      </View>

      {bookings.status === 'loading' && !bookings.data ? (
        <SkeletonGroup label="Loading bookings" className="gap-3 px-4 pt-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </SkeletonGroup>
      ) : bookings.status === 'error' && !bookings.data ? (
        <ErrorState className="mt-10 px-4" onRetry={bookings.reload} retrying={bookings.refreshing} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(booking) => booking.id}
          contentContainerClassName="gap-3 px-4 pb-10 pt-4"
          renderItem={({ item }) => <BookingRow booking={item} services={services.data ?? []} />}
          ListEmptyComponent={
            tab === 'upcoming' ? (
              <EmptyState
                className="mt-10"
                icon={CalendarCheck}
                title="Nothing coming up"
                description="Book a service and it will show here, with your professional and the time they arrive."
                action={{ label: 'Explore services', href: '/services' }}
              />
            ) : (
              <EmptyState className="mt-10" icon={CalendarX2} title="No past bookings" description="Finished and cancelled bookings will show here." />
            )
          }
        />
      )}
    </View>
  )
}
