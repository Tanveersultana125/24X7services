import { useState } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { router, useLocalSearchParams, type Href } from 'expo-router'
import { MessageSquare, X } from 'lucide-react-native'
import type { Booking } from '@app/shared/catalog-v2'

import { SignInPrompt } from '@/components/ProfileShell'
import { Header, Screen, StickyCTA } from '@/components/Screen'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Textarea } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useAuth } from '@/lib/auth'
import { useBookings } from '@/lib/data/bookings'
import { useServicesByIds } from '@/lib/data/catalog'
import { createTicket } from '@/lib/data/support'
import { BookingSummary } from './SupportHomeScreen'
import { SUPPORT_TOPICS, supportTopic } from './topics'

/**
 * Starting a conversation: what it is about, which booking, and what happened.
 *
 * The topic comes first because it decides who picks the thread up. Arriving
 * from a topic or from a booking carries that through already chosen, so
 * nobody types again what the screen they came from already knew.
 *
 * A booking can be attached and usually should be — almost every question is
 * about a specific job. When none came with the link, the three most recent
 * are offered to pick from rather than asking for a reference number.
 *
 * Send sits in the footer, which the keyboard pushes up with it, so it is
 * never hidden behind the keyboard the message was typed on.
 */

const MIN = 10
const MAX = 2000

export function StartChatScreen() {
  const params = useLocalSearchParams<{ topic?: string; booking?: string }>()
  const { user, ready } = useAuth()
  const topicParam = typeof params.topic === 'string' ? params.topic : null
  const bookingParam = typeof params.booking === 'string' ? params.booking : null

  if (ready && !user) {
    const query = [topicParam && `topic=${topicParam}`, bookingParam && `booking=${bookingParam}`].filter(Boolean)
    return (
      <Screen header={<Header title="Chat with us" showBack backFallback="/support" />}>
        <SignInPrompt
          icon={MessageSquare}
          title="Chat with us"
          description="Log in so we can see your bookings and reply to you here."
          next={`/support/chat${query.length ? `?${query.join('&')}` : ''}`}
        />
      </Screen>
    )
  }
  if (!ready) return <Screen header={<Header title="Chat with us" showBack backFallback="/support" />}>{null}</Screen>

  return <ChatForm initialTopic={supportTopic(topicParam)?.id ?? null} initialBooking={bookingParam} />
}

function ChatForm({ initialTopic, initialBooking }: { initialTopic: string | null; initialBooking: string | null }) {
  const toast = useToast()
  const [topicId, setTopicId] = useState<string | null>(initialTopic)
  const [bookingId, setBookingId] = useState<string | null>(initialBooking)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [sending, setSending] = useState(false)

  async function send(): Promise<void> {
    const topic = supportTopic(topicId)
    if (!topic) {
      setError('Pick what this is about')
      return
    }
    if (message.trim().length < MIN) {
      setError(`Tell us a little more — at least ${MIN} characters`)
      return
    }
    setSending(true)
    try {
      const ticket = await createTicket({
        topicId: topic.id,
        subject: topic.label,
        ...(bookingId ? { bookingId } : {}),
        message: message.trim(),
      })
      router.replace(`/support/tickets/detail?id=${ticket.id}` as Href)
    } catch {
      toast.show('We could not send that. Please try again.', { tone: 'error' })
      setSending(false)
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Screen
        header={<Header title="Chat with us" showBack backFallback="/support" />}
        footer={
          <StickyCTA>
            <Button fullWidth size="lg" loading={sending} onPress={() => void send()}>
              Send
            </Button>
          </StickyCTA>
        }
      >
        <Text className="mt-5 text-sm font-semibold text-ink">What is this about?</Text>
        <View className="mt-3 flex-row flex-wrap gap-2" accessibilityRole="radiogroup" accessibilityLabel="What is this about?">
          {SUPPORT_TOPICS.map((topic) => (
            <Chip
              key={topic.id}
              selected={topicId === topic.id}
              onPress={() => {
                setTopicId(topic.id)
                setError(undefined)
              }}
            >
              {topic.label}
            </Chip>
          ))}
        </View>

        <Text className="mt-6 text-sm font-semibold text-ink">Which booking? (optional)</Text>
        <BookingPicker selected={bookingId} onChange={setBookingId} />

        <View className="mt-6">
          <Textarea
            label="What happened?"
            required
            value={message}
            onChangeText={(next) => {
              setMessage(next.slice(0, MAX))
              setError(undefined)
            }}
            maxLength={MAX}
            error={error}
            hint={`In your own words. ${MAX - message.length} characters left.`}
            placeholder="The professional was due between 11 and 1 and nobody arrived."
            rows={5}
          />
        </View>

        <Text className="mt-4 text-center text-xs leading-[20px] text-muted">
          You will get a first answer straight away, and a person replies here, usually within 10 minutes.
        </Text>
      </Screen>
    </KeyboardAvoidingView>
  )
}

/**
 * The attached booking as a card with a remove button, or, with none attached,
 * the three most recent to choose from. Reading the bookings can fail without
 * stopping the conversation — the booking is optional — so the error offers a
 * retry and nothing more.
 */
function BookingPicker({ selected, onChange }: { selected: string | null; onChange: (id: string | null) => void }) {
  const bookings = useBookings()
  const all = bookings.data ?? []
  const services = useServicesByIds(all.flatMap((b) => b.items.map((i) => i.serviceId)))
  const attached = selected ? all.find((b) => b.id === selected) : undefined

  if (bookings.status === 'loading' && !bookings.data) {
    return (
      <SkeletonGroup label="Loading your bookings" className="mt-3">
        <Skeleton className="h-24" />
      </SkeletonGroup>
    )
  }
  if (bookings.status === 'error' && !bookings.data) {
    return (
      <ErrorState
        className="py-6"
        description="We could not load your bookings. You can still send without one."
        onRetry={bookings.reload}
        retrying={bookings.refreshing}
      />
    )
  }

  if (selected) {
    return attached ? (
      <BookingSummary booking={attached} services={services.data ?? []} className="mt-3 border-brand bg-brand-soft">
        <RemoveButton onPress={() => onChange(null)} />
      </BookingSummary>
    ) : (
      // A booking id from a link that is not in the list: still attached, by reference.
      <View className="mt-3 rounded-card border border-brand bg-brand-soft p-4">
        <Text className="text-base font-semibold text-ink">{`Booking #${selected}`}</Text>
        <RemoveButton onPress={() => onChange(null)} />
      </View>
    )
  }

  const recent = all.slice(0, 3)
  if (recent.length === 0) {
    return <Text className="mt-2 text-sm text-muted">You have no bookings yet, so this one is about something else.</Text>
  }
  return (
    <View className="mt-3 gap-3">
      {recent.map((booking: Booking) => (
        <Tappable
          key={booking.id}
          onPress={() => onChange(booking.id)}
          accessibilityLabel={`Attach booking ${booking.id}`}
          className="rounded-card active:opacity-70"
        >
          <BookingSummary booking={booking} services={services.data ?? []} />
        </Tappable>
      ))}
    </View>
  )
}

function RemoveButton({ onPress }: { onPress: () => void }) {
  return (
    <Tappable
      onPress={onPress}
      accessibilityLabel="Remove this booking"
      className="mt-3 min-h-11 flex-row items-center gap-1.5 self-start"
    >
      <Icon as={X} className="size-4 text-brand" />
      <Text className="text-sm font-semibold text-brand">Remove</Text>
    </Tappable>
  )
}
