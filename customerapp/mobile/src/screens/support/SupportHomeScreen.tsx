import { useCallback } from 'react'
import { Linking, View } from 'react-native'
import { useFocusEffect, type Href } from 'expo-router'
import {
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  Compass,
  MessageSquare,
  MessagesSquare,
  Phone,
  ReceiptIndianRupee,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native'
import type { Booking, Service } from '@app/shared/catalog-v2'

import { useSignInHref } from '@/components/ProfileShell'
import { Header, Screen, Section } from '@/components/Screen'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { ErrorState, StatusBadge } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useAuth } from '@/lib/auth'
import { isUpcoming, useBookings } from '@/lib/data/bookings'
import { useServicesByIds } from '@/lib/data/catalog'
import { useTickets } from '@/lib/data/support'
import { brand } from '@/config/brand'
import { cn } from '@/lib/cn'
import { formatPhone } from '@/lib/format'
import { bookingTitle } from '@/screens/mybookings/BookingRow'
import { longDate, time12 } from '@/screens/checkout/when'
import { SUPPORT_TOPICS } from './topics'

/**
 * The Support tab, the way UC lays it out: the booking you most likely came
 * about first, with one button to get help on it; then every topic, each
 * opening to its questions answered in full; then your past conversations
 * and the two ways to reach a person.
 *
 * The booking card is there because almost every support question is about a
 * specific job. Offering the job up front saves the customer finding its
 * reference, and saves the first three messages of the conversation.
 *
 * The phone number is on this screen, not three taps under the chat. Some
 * problems are ones people want to say out loud, and hiding the number to
 * deflect them into a form only makes the call angrier when it comes.
 *
 * Signed out, the topics are all still here — reading an answer needs no
 * account — and the rows that do need one go to the sign-in and come back.
 */



/** Which icon stands for which topic. The topics themselves carry no JSX. */
const TOPIC_ICONS: Record<string, LucideIcon> = {
  'getting-started': Compass,
  'booking-changes': CalendarClock,
  payments: ReceiptIndianRupee,
  'plans-membership': BadgeCheck,
  warranty: ShieldCheck,
  account: UserRound,
}

export function SupportHomeScreen() {
  const { user, ready } = useAuth()
  const signedIn = ready && Boolean(user)

  return (
    <Screen tab header={<Header title="How can we help?" />}>
      <Text className="mt-5 text-sm leading-[22px] text-muted">
        Tell us what happened and we will sort it out. Most things are quicker to fix than to explain.
      </Text>

      {signedIn ? <BookingHelp /> : null}

      <Section title="All topics">
        <View className="overflow-hidden rounded-card border border-border">
          {SUPPORT_TOPICS.map((topic, index) => (
            <Row
              key={topic.id}
              href={`/support/topic?t=${topic.id}` as Href}
              icon={TOPIC_ICONS[topic.id] ?? UserRound}
              label={topic.label}
              detail={topic.blurb}
              last={index === SUPPORT_TOPICS.length - 1}
            />
          ))}
        </View>
      </Section>

      <Section title="Talk to us">
        <Contact signedIn={signedIn} />
      </Section>
    </Screen>
  )
}

/**
 * The booking the customer is most likely asking about: the next one still to
 * happen, or failing that the last one that did. Nothing is drawn when there
 * are no bookings — an empty card about nothing is noise on a help screen.
 */
function BookingHelp() {
  const bookings = useBookings()
  const all = bookings.data ?? []
  const upcoming = all.filter(isUpcoming)
  // The list comes newest slot first, so the soonest upcoming one is last.
  const booking = upcoming.at(-1) ?? all.find((b) => !isUpcoming(b)) ?? null
  const services = useServicesByIds(booking ? booking.items.map((i) => i.serviceId) : [])

  if (bookings.status === 'loading' && !bookings.data) {
    return (
      <SkeletonGroup label="Loading your booking" className="mt-6">
        <Skeleton className="h-36" />
      </SkeletonGroup>
    )
  }
  if (bookings.status === 'error' && !bookings.data) {
    return (
      <ErrorState
        className="py-8"
        description="We could not load your bookings. Topics and chat still work."
        onRetry={bookings.reload}
        retrying={bookings.refreshing}
      />
    )
  }
  if (!booking) return null

  return (
    <View className="mt-6">
      <Text accessibilityRole="header" className="mb-3 text-xl font-bold text-ink">
        Help with your booking
      </Text>
      <BookingSummary booking={booking} services={services.data ?? []}>
        <Button className="mt-4" fullWidth href={`/support/chat?booking=${booking.id}` as Href}>
          Get help
        </Button>
      </BookingSummary>
    </View>
  )
}

/**
 * One booking as the support screens show it: what, when, and where it has
 * got to. Shared with the start-a-conversation screen, which attaches one.
 */
export function BookingSummary({
  booking,
  services,
  className,
  children,
}: {
  booking: Booking
  services: readonly Service[]
  className?: string
  children?: React.ReactNode
}) {
  return (
    <View className={cn('rounded-card border border-border p-4', className)}>
      <View className="flex-row items-start justify-between gap-3">
        <Text className="min-w-0 flex-1 text-base font-semibold text-ink">{bookingTitle(booking, services)}</Text>
        <StatusBadge status={booking.status} />
      </View>
      <View className="mt-2 flex-row items-center gap-2">
        <Icon as={CalendarClock} className="size-4 text-muted" />
        <Text className="min-w-0 flex-1 text-sm text-muted">
          {`${longDate(booking.slot.date)} · ${time12(booking.slot.start)} · #${booking.id}`}
        </Text>
      </View>
      {children}
    </View>
  )
}

/** Past conversations, and the two ways to a person: the chat and the phone. */
function Contact({ signedIn }: { signedIn: boolean }) {
  const ticketsSignIn = useSignInHref('/support/tickets')
  const chatSignIn = useSignInHref('/support/chat')

  return (
    <View className="overflow-hidden rounded-card border border-border">
      {signedIn ? (
        <ConversationsRow />
      ) : (
        <Row href={ticketsSignIn} icon={MessagesSquare} label="Your conversations" detail="Log in to see them" />
      )}
      <Row
        href={signedIn ? '/support/chat' : chatSignIn}
        icon={MessageSquare}
        label="Chat with us"
        detail={signedIn ? 'Answered here, in the app' : 'Log in to start a conversation'}
      />
      <Row
        onPress={() => void Linking.openURL(`tel:${brand.supportPhone}`)}
        icon={Phone}
        label="Call us"
        detail={formatPhone(brand.supportPhone)}
        last
      />
    </View>
  )
}

/** The conversations row, with how many are still open once that is known. */
function ConversationsRow() {
  const tickets = useTickets()
  // Read again whenever the tab comes back into view: a conversation just
  // started should count.
  const { reload } = tickets
  useFocusEffect(useCallback(() => reload(), [reload]))
  const open = (tickets.data ?? []).filter((t) => t.status === 'open').length
  const detail =
    tickets.status === 'ready'
      ? open > 0
        ? `${open} open`
        : 'Everything you have asked us'
      : tickets.status === 'error'
        ? 'Everything you have asked us'
        : 'Checking…'
  return <Row href="/support/tickets" icon={MessagesSquare} label="Your conversations" detail={detail} />
}

/** A menu row, the same shape as the Account tab's. */
function Row({
  href,
  onPress,
  icon,
  label,
  detail,
  last = false,
}: {
  href?: Href
  onPress?: () => void
  icon: LucideIcon
  label: string
  detail?: string
  last?: boolean
}) {
  return (
    <Tappable
      {...(href ? { href } : {})}
      onPress={onPress}
      className={cn(
        'min-h-14 flex-row items-center gap-3 px-4 py-3 active:bg-surface active:opacity-100',
        !last && 'border-b border-border'
      )}
    >
      <Icon as={icon} className="size-5 shrink-0 text-muted" />
      <View className="min-w-0 flex-1">
        <Text className="text-base text-ink">{label}</Text>
        {detail ? <Text className="mt-0.5 text-xs text-muted">{detail}</Text> : null}
      </View>
      <Icon as={ChevronRight} className="size-4 shrink-0 text-muted" />
    </Tappable>
  )
}
