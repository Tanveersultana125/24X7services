import { router, usePathname, useGlobalSearchParams, type Href } from 'expo-router'
import { PenLine } from 'lucide-react-native'
import type { ApplianceId, ServiceKey } from '@app/shared'
import { useAuth } from '@/lib/auth'
import { useMyBookings } from '@/lib/useMyBookings'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'

const COMPLETED = ['completed'] as const

/**
 * The way into writing a review, from a page that lists them.
 *
 * A review belongs to a finished job — that is what makes the stars above it
 * worth reading — so this never opens a blank form. It looks for the
 * customer's own completed booking on this appliance (and this service, when
 * the page is about one) that has not been reviewed yet, and takes them to
 * that booking's review. Without one it says when they will be able to,
 * rather than showing a button that goes nowhere.
 */
export function WriteReviewButton({
  applianceId,
  serviceKey,
  className,
}: {
  applianceId: ApplianceId
  /** Narrows it to one service; absent on the appliance page. */
  serviceKey?: ServiceKey
  className?: string
}) {
  const { user, ready } = useAuth()
  const { bookings, loading } = useMyBookings(user?.uid, COMPLETED)
  const pathname = usePathname()
  const params = useGlobalSearchParams<Record<string, string>>()

  if (!ready) return null

  if (!user) {
    // Back to this page, query included, once signed in.
    const query = Object.entries(params)
      .filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')
    const here = `${pathname}${query ? `?${query}` : ''}`
    return (
      <Text className={cn('text-sm text-muted', className)}>
        Had this service with us?{' '}
        <Text
          accessibilityRole="link"
          onPress={() => router.push(`/login?next=${encodeURIComponent(here)}` as Href)}
          className="text-sm font-semibold text-brand"
        >
          Log in to review it
        </Text>
      </Text>
    )
  }

  if (loading) return null

  const due = bookings.find(
    (booking) =>
      booking.applianceId === applianceId &&
      (serviceKey === undefined || booking.serviceKey === serviceKey) &&
      !booking.reviewId
  )

  if (!due) {
    return (
      <Text className={cn('text-sm text-muted', className)}>You can review this once we have finished a job for you.</Text>
    )
  }

  return (
    <Tappable
      href={`/bookings/review?id=${due.id}` as Href}
      className={cn(
        'min-h-11 flex-row items-center gap-2 self-start rounded-card border border-brand px-4 active:bg-brand-soft active:opacity-100',
        className
      )}
    >
      <Icon as={PenLine} className="size-4 text-brand" />
      <Text className="text-sm font-semibold text-brand">Write a review</Text>
    </Tappable>
  )
}
