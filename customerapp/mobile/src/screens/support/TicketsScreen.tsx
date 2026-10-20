import { useCallback } from 'react'
import { FlatList, View } from 'react-native'
import { useFocusEffect, type Href } from 'expo-router'
import { ChevronRight, MessagesSquare } from 'lucide-react-native'

import { SignInPrompt } from '@/components/ProfileShell'
import { Header, Screen } from '@/components/Screen'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState, ToneBadge } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useAuth } from '@/lib/auth'
import { useTickets, type SupportTicket } from '@/lib/data/support'
import { relativeTime } from '@/lib/format'
import { supportTopic } from './topics'

/**
 * Every conversation, most recently active first.
 *
 * Ordered by the last message rather than by when it was opened, because a
 * thread somebody replied to an hour ago is the one being looked for. Each row
 * shows the last thing said, so a reply can be read without opening it.
 *
 * Read again whenever the screen comes back into view, so a reply that landed
 * while a thread was open is already in its row on the way back.
 */
export function TicketsScreen() {
  const { user, ready } = useAuth()
  return (
    <Screen scroll={false} header={<Header title="Your conversations" showBack backFallback="/support" />}>
      {!ready ? null : user ? (
        <TicketList />
      ) : (
        <View className="px-4">
          <SignInPrompt
            icon={MessagesSquare}
            title="Your conversations"
            description="Anything you ask us collects here, with everything that was said."
          />
        </View>
      )}
    </Screen>
  )
}

function TicketList() {
  const tickets = useTickets()
  const { reload } = tickets
  useFocusEffect(useCallback(() => reload(), [reload]))

  if (tickets.status === 'loading' && !tickets.data) {
    return (
      <SkeletonGroup label="Loading conversations" className="gap-3 px-4 pt-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </SkeletonGroup>
    )
  }
  if (tickets.status === 'error' && !tickets.data) {
    return <ErrorState className="mt-10 px-4" onRetry={tickets.reload} retrying={tickets.refreshing} />
  }

  return (
    <FlatList
      data={tickets.data ?? []}
      keyExtractor={(ticket) => ticket.id}
      contentContainerClassName="gap-3 px-4 pb-10 pt-4"
      renderItem={({ item }) => <TicketRow ticket={item} />}
      ListEmptyComponent={
        <EmptyState
          className="mt-10"
          icon={MessagesSquare}
          title="No conversations yet"
          description="Anything you ask us collects here, with everything that was said."
          action={{ label: 'Start a conversation', href: '/support/chat' }}
        />
      }
    />
  )
}

/** One conversation: what it is about, the last thing said, and whether it is settled. */
function TicketRow({ ticket }: { ticket: SupportTicket }) {
  const last = ticket.messages.at(-1)
  const resolved = ticket.status === 'resolved'
  const topic = supportTopic(ticket.topicId)

  return (
    <Tappable
      href={`/support/tickets/detail?id=${ticket.id}` as Href}
      className="rounded-card border border-border p-4 active:bg-surface active:opacity-100"
    >
      <View className="flex-row items-start justify-between gap-3">
        <Text numberOfLines={2} className="min-w-0 flex-1 text-base font-semibold text-ink">
          {ticket.subject}
        </Text>
        <ToneBadge tone={resolved ? 'success' : 'warning'} label={resolved ? 'Resolved' : 'Open'} />
      </View>
      {topic ? <Text className="mt-0.5 text-xs text-muted">{topic.label}</Text> : null}
      {last ? (
        <Text numberOfLines={2} className="mt-2 text-sm text-muted">
          {last.from === 'customer' ? `You: ${last.text}` : last.text}
        </Text>
      ) : null}
      <View className="mt-3 flex-row items-center justify-between border-t border-border pt-3">
        <Text className="text-xs text-muted">{`#${ticket.id} · ${relativeTime(Date.parse(ticket.updatedAt))}`}</Text>
        <Icon as={ChevronRight} className="size-4 text-muted" />
      </View>
    </Tappable>
  )
}
