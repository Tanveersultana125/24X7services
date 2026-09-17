'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { ChevronRight, MessagesSquare } from 'lucide-react'
import { COL, supportTicketSchema, type SupportTicket } from '@app/shared'

import { AppShell } from '@/components/AppShell'
import { Header } from '@/components/Header'
import { Card } from '@/components/ui/Card'
import { ToneBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { TicketListSkeleton } from '@/components/SkeletonLoader'
import { useAuth } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { relativeTime } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

/**
 * Past and open conversations, most recently answered first.
 *
 * Ordered by last message rather than by when it was opened, because a thread
 * somebody replied to an hour ago is the one being looked for.
 */
export function TicketsScreen() {
  const router = useRouter()
  const { user, ready } = useAuth()
  const uid = user?.uid

  useEffect(() => {
    if (ready && !user) router.replace('/login?next=%2Fsupport%2Ftickets')
  }, [ready, user, router])

  const load = useCallback(async (): Promise<SupportTicket[]> => {
    if (!uid) return []
    const snap = await getDocs(
      query(
        collection(db(), COL.supportTickets),
        where('uid', '==', uid),
        orderBy('lastMessageAt', 'desc'),
        limit(100)
      )
    )
    const tickets: SupportTicket[] = []
    for (const document of snap.docs) {
      const parsed = supportTicketSchema.safeParse({
        id: document.id,
        ...document.data(),
      })
      if (parsed.success) tickets.push(parsed.data)
    }
    return tickets
  }, [uid])

  const tickets = useAsync(load)

  return (
    <AppShell
      mobileHeader={
        <Header title="Your conversations" showBack backFallback="/support" />
      }
    >
      {!ready || tickets.status === 'loading' ? (
        <div className="mt-5">
          <TicketListSkeleton />
        </div>
      ) : tickets.status === 'error' ? (
        <ErrorState
          className="py-16"
          onRetry={tickets.reload}
          retrying={tickets.refreshing}
        />
      ) : (tickets.data?.length ?? 0) === 0 ? (
        <EmptyState
          className="py-16"
          icon={MessagesSquare}
          title="No conversations yet"
          description="Anything you ask us collects here, with everything that was said."
          action={{ label: 'Start a conversation', href: '/support/chat' }}
        />
      ) : (
        <Card className="mt-5 overflow-hidden">
          <ul>
            {tickets.data?.map((ticket) => (
              <li key={ticket.id} className="border-b border-border last:border-b-0">
                <Link
                  href={`/support/tickets/detail?id=${ticket.id}` as Route}
                  className="flex items-start gap-3 px-4 py-3.5 hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">
                        {ticket.subject}
                      </p>
                      <ToneBadge
                        tone={
                          ticket.status === 'resolved'
                            ? 'success'
                            : ticket.assignee === 'human'
                              ? 'warning'
                              : 'neutral'
                        }
                        label={
                          ticket.status === 'resolved'
                            ? 'Resolved'
                            : ticket.assignee === 'human'
                              ? 'With a person'
                              : 'Open'
                        }
                      />
                    </div>
                    {ticket.lastMessagePreview ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted">
                        {ticket.lastMessagePreview}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted">
                      {relativeTime(ticket.lastMessageAt)}
                    </p>
                  </div>
                  <ChevronRight
                    className="mt-0.5 size-4 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </AppShell>
  )
}
