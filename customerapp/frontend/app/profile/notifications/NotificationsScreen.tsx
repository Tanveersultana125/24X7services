'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { Bell, ChevronRight } from 'lucide-react'
import { COL, notificationSchema, SUB, type AppNotification } from '@app/shared'

import { ProfileShell, SignInPrompt } from '@/components/ProfileShell'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { db } from '@/lib/firebase'
import { relativeTime } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * Everything we have sent this customer.
 *
 * Marking one as read is the only thing a client may write here, and the rules
 * say so field by field — `readAt` and nothing else. A notification is a record
 * of what we told someone and when; a client that could edit the text could
 * rewrite that.
 *
 * These are written by `onBookingStatusNotify`, which watches a booking's
 * status rather than being called from each path that moves one — so a path
 * added later is announced without anybody remembering to announce it. The
 * same call pushes to the customer's devices where they have asked for it.
 */
export function NotificationsScreen() {
  return (
    <ProfileShell title="Notifications"
      signedOut={
        <SignInPrompt
          icon={Bell}
          title="Your notifications"
          description="Everything we have sent you about a booking is kept here. Sign in to read it."
        />
      }
    >
      {(user) => <NotificationList uid={user.uid} />}
    </ProfileShell>
  )
}

function NotificationList({ uid }: { uid: string }) {
  const [read, setRead] = useState<Set<string>>(new Set())

  const load = useCallback(async (): Promise<AppNotification[]> => {
    const snap = await getDocs(
      query(
        collection(db(), COL.notifications, uid, SUB.items),
        orderBy('at', 'desc'),
        limit(100)
      )
    )
    const items: AppNotification[] = []
    for (const document of snap.docs) {
      const parsed = notificationSchema.safeParse({
        id: document.id,
        ...document.data(),
      })
      if (parsed.success) items.push(parsed.data)
    }
    return items
  }, [uid])

  const notifications = useAsync(load)

  // Wrapped because it reads the clock: declared loose in the body, the React
  // compiler has to assume it could run during render, and `Date.now()` in a
  // render is a render that is not a function of its inputs.
  const markRead = useCallback(
    async (item: AppNotification): Promise<void> => {
      if (item.readAt || read.has(item.id)) return
      // Marked locally straight away; a failed write is not worth a message
      // about something the customer has visibly just read.
      setRead((current) => new Set(current).add(item.id))
      try {
        await updateDoc(doc(db(), COL.notifications, uid, SUB.items, item.id), {
          readAt: Date.now(),
        })
      } catch {
        // Left as read on screen. It will come back unread next time.
      }
    },
    [read, uid]
  )

  if (notifications.status === 'loading') {
    return (
      <SkeletonGroup label="Loading" className="mt-6 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </SkeletonGroup>
    )
  }

  if (notifications.status === 'error') {
    return (
      <ErrorState
        className="py-16"
        onRetry={notifications.reload}
        retrying={notifications.refreshing}
      />
    )
  }

  if ((notifications.data?.length ?? 0) === 0) {
    return (
      <EmptyState
        className="py-16"
        icon={Bell}
        title="Nothing here yet"
        description="Updates about your bookings — an expert assigned, a quote to approve, a job finished — collect here."
        action={{ label: 'See your bookings', href: '/bookings' }}
      />
    )
  }

  return (
    <Card className="mt-5 overflow-hidden">
      <ul>
        {notifications.data?.map((item) => {
          const unread = !item.readAt && !read.has(item.id)
          const body = (
            <>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block text-sm',
                    unread ? 'font-semibold text-ink' : 'font-medium text-muted'
                  )}
                >
                  {item.title}
                </span>
                <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                  {item.body}
                </span>
                <span className="mt-1 block text-xs text-muted">
                  {relativeTime(item.at)}
                </span>
              </span>
              {item.href ? (
                <ChevronRight
                  className="mt-0.5 size-4 shrink-0 text-muted"
                  aria-hidden="true"
                />
              ) : null}
            </>
          )

          return (
            <li key={item.id} className="border-b border-border last:border-b-0">
              {item.href ? (
                <Link
                  href={item.href as Route}
                  onClick={() => void markRead(item)}
                  className="flex items-start gap-3 px-4 py-3.5 hover:bg-surface"
                >
                  {unread ? <Unread /> : <span className="w-2 shrink-0" />}
                  {body}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void markRead(item)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-surface"
                >
                  {unread ? <Unread /> : <span className="w-2 shrink-0" />}
                  {body}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function Unread() {
  return (
    <span
      className="mt-1.5 size-2 shrink-0 rounded-full bg-error"
      aria-label="Unread"
    />
  )
}
