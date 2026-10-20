import { useEffect, useRef, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { MessagesSquare, Send } from 'lucide-react-native'

import { SignInPrompt } from '@/components/ProfileShell'
import { Header, Screen } from '@/components/Screen'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/States'
import { Text } from '@/components/ui/Text'
import { useAuth } from '@/lib/auth'
import { sendMessage, useTicket, type SupportMessage } from '@/lib/data/support'
import { cn } from '@/lib/cn'

/**
 * One conversation, laid out like a chat: your messages on the right in the
 * brand colour, ours on the left, a date between the days, and the box to
 * write in pinned to the bottom above the keyboard.
 *
 * Until the backend gives this a live listener, the thread is read again every
 * three seconds while the screen is open — that is how the reply to a message
 * just sent turns up without anyone pulling to refresh. The interval stops the
 * moment the screen goes.
 *
 * A resolved conversation stays writable. Writing again reopens it, which is
 * what someone whose fault came back expects, rather than being made to start
 * over and explain the history.
 */

const POLL_MS = 3000
const MAX = 2000

export function TicketThreadScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const id = typeof params.id === 'string' ? params.id : ''
  const { user, ready } = useAuth()

  if (ready && !user) {
    return (
      <Screen header={<Header title="Conversation" showBack backFallback="/support/tickets" />}>
        <SignInPrompt
          icon={MessagesSquare}
          title="Your conversations"
          description="Anything you ask us collects here, with everything that was said."
          next={`/support/tickets/detail?id=${id}`}
        />
      </Screen>
    )
  }
  return <Thread id={id} />
}

type Item = { kind: 'day'; key: string; label: string } | { kind: 'message'; key: string; message: SupportMessage }

function Thread({ id }: { id: string }) {
  const toast = useToast()
  const insets = useSafeAreaInsets()
  const ticket = useTicket(id)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const list = useRef<FlatList<Item>>(null)

  const { reload } = ticket
  useEffect(() => {
    const timer = setInterval(reload, POLL_MS)
    return () => clearInterval(timer)
  }, [reload])

  async function send(): Promise<void> {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    try {
      await sendMessage(id, body)
      setText('')
      reload()
    } catch {
      toast.show('We could not send that. Please try again.', { tone: 'error' })
    } finally {
      setSending(false)
    }
  }

  const data = ticket.data
  const header = (
    <Header
      title={data?.subject ?? 'Conversation'}
      {...(data ? { subtitle: `#${data.id} · ${data.status === 'resolved' ? 'Resolved' : 'Open'}` } : {})}
      showBack
      backFallback="/support/tickets"
    />
  )

  if (ticket.status === 'loading' && data === undefined) {
    return (
      <Screen header={header}>
        <SkeletonGroup label="Loading conversation" className="mt-6 gap-3">
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-16 w-3/4 self-end" />
          <Skeleton className="h-16 w-3/4" />
        </SkeletonGroup>
      </Screen>
    )
  }
  if (ticket.status === 'error' && data === undefined) {
    return (
      <Screen header={header}>
        <ErrorState className="py-20" onRetry={reload} retrying={ticket.refreshing} />
      </Screen>
    )
  }
  if (!data) {
    return (
      <Screen header={header}>
        <ErrorState
          className="py-20"
          kind="notFound"
          title="We could not find that conversation"
          description="It may have been removed, or the link may be out of date."
        />
      </Screen>
    )
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {header}
      <FlatList
        ref={list}
        className="flex-1"
        data={withDays(data.messages)}
        keyExtractor={(item) => item.key}
        contentContainerClassName="gap-3 px-4 pb-4 pt-2"
        keyboardShouldPersistTaps="handled"
        // The newest message should be in view without scrolling for it.
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) =>
          item.kind === 'day' ? (
            <Text className="pt-3 text-center text-xs font-semibold text-muted">{item.label}</Text>
          ) : (
            <Bubble message={item.message} />
          )
        }
        ListFooterComponent={
          data.status === 'resolved' ? (
            <View className="mt-3 rounded-card bg-success-soft px-4 py-3">
              <Text className="text-center text-sm text-ink">This conversation was resolved. Write again to reopen it.</Text>
            </View>
          ) : null
        }
      />

      <View className="border-t border-border bg-bg px-4 pt-3" style={{ paddingBottom: 12 + insets.bottom }}>
        <View className="flex-row items-end gap-2">
          <View className="min-w-0 flex-1">
            <Input
              label="Your message"
              hideLabel
              value={text}
              onChangeText={(next) => setText(next.slice(0, MAX))}
              maxLength={MAX}
              placeholder="Type a message"
              enterKeyHint="send"
              returnKeyType="send"
              submitBehavior="submit"
              onSubmitEditing={() => void send()}
            />
          </View>
          <Button
            loading={sending}
            disabled={text.trim().length === 0}
            accessibilityLabel="Send"
            onPress={() => void send()}
            className="aspect-square px-0"
          >
            <Icon as={Send} className="size-5 text-white" />
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

/** The messages, with a date line before the first of each day. */
function withDays(messages: readonly SupportMessage[]): Item[] {
  const items: Item[] = []
  let day = ''
  for (const message of messages) {
    const at = new Date(message.at)
    const key = at.toDateString()
    if (key !== day) {
      day = key
      items.push({ kind: 'day', key: `day-${key}`, label: dayLabel(at) })
    }
    items.push({ kind: 'message', key: message.id, message })
  }
  return items
}

/** "Today", "Yesterday", or "Mon, 21 Sep". */
function dayLabel(at: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (at.toDateString() === today.toDateString()) return 'Today'
  if (at.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return at.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** One message. Yours on the right in the brand colour; ours on the left. */
function Bubble({ message }: { message: SupportMessage }) {
  const mine = message.from === 'customer'
  const time = new Date(message.at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  return (
    <View className={cn('max-w-[85%]', mine ? 'self-end' : 'self-start')}>
      <View className={cn('rounded-card px-4 py-2.5', mine ? 'rounded-br-sm bg-brand' : 'rounded-bl-sm bg-surface')}>
        <Text className={cn('text-sm leading-[22px]', mine ? 'text-white' : 'text-ink')}>{message.text}</Text>
      </View>
      <Text className={cn('mt-1 text-xs text-muted', mine ? 'text-right' : 'text-left')}>
        {mine ? time : `Support · ${time}`}
      </Text>
    </View>
  )
}
