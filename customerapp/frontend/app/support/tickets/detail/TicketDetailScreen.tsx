'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { Send, UserRound } from 'lucide-react'
import {
  COL,
  SUB,
  supportMessageSchema,
  supportTicketSchema,
  type SupportMessage,
  type SupportTicket,
} from '@app/shared'

import { Header } from '@/components/Header'
import { Chip } from '@/components/ui/Chip'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { useToast } from '@/components/Toast'
import { callFn, friendlyError } from '@/lib/callables'
import { useAuth } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * One conversation.
 *
 * Every message is written by the server, including the customer's own — the
 * rules refuse client writes to the thread entirely. That is what lets a reply
 * land in the same operation as the question, and what stops anything posting
 * as an agent.
 *
 * "Talk to a person" is on screen from the first reply and never moves. The
 * fastest way to make an automated first answer infuriating is to make the way
 * past it hard to find.
 */
export function TicketDetailScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const ticketId = params.get('id')
  const { user, ready } = useAuth()
  const toast = useToast()

  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>(
    'loading'
  )
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ready && !user) router.replace('/login?next=%2Fsupport%2Ftickets')
  }, [ready, user, router])

  useEffect(() => {
    if (!ticketId || !user) return

    const unsubscribeTicket = onSnapshot(
      doc(db(), COL.supportTickets, ticketId),
      (snap) => {
        const parsed = supportTicketSchema.safeParse({
          id: snap.id,
          ...snap.data(),
        })
        if (!snap.exists() || !parsed.success) {
          setStatus('missing')
          return
        }
        setTicket(parsed.data)
        setStatus('ready')
      },
      () => setStatus('missing')
    )

    const unsubscribeMessages = onSnapshot(
      query(
        collection(db(), COL.supportTickets, ticketId, SUB.messages),
        orderBy('at', 'asc')
      ),
      (snap) => {
        const next: SupportMessage[] = []
        for (const document of snap.docs) {
          const parsed = supportMessageSchema.safeParse({
            id: document.id,
            ...document.data(),
          })
          if (parsed.success) next.push(parsed.data)
        }
        setMessages(next)
        // A new message should be visible without scrolling for it.
        bottom.current?.scrollIntoView({ block: 'end' })
      },
      () => setMessages([])
    )

    return () => {
      unsubscribeTicket()
      unsubscribeMessages()
    }
  }, [ticketId, user])

  async function send(body: string): Promise<void> {
    if (!ticketId || body.trim().length === 0) return
    setSending(true)
    try {
      await callFn('sendSupportMessage', { ticketId, text: body.trim() })
      setText('')
    } catch (error) {
      toast.show(friendlyError(error), { tone: 'error' })
    } finally {
      setSending(false)
    }
  }

  async function escalate(): Promise<void> {
    if (!ticketId) return
    setSending(true)
    try {
      await callFn('escalateTicket', { ticketId })
    } catch (error) {
      toast.show(friendlyError(error), { tone: 'error' })
    } finally {
      setSending(false)
    }
  }

  const withAPerson = ticket?.assignee === 'human'
  const closed = ticket?.status === 'resolved'
  const lastReply = [...messages].reverse().find((m) => m.author !== 'user')

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <Header
        title={ticket?.subject ?? 'Conversation'}
        subtitle={
          ticket
            ? closed
              ? 'Resolved'
              : withAPerson
                ? 'With a person'
                : 'Open'
            : undefined
        }
        showBack
        backFallback="/support/tickets"
      />

      <main id="content" className="mx-auto w-full max-w-lg flex-1 px-4 pb-4 lg:max-w-2xl">
        {status === 'loading' ? (
          <SkeletonGroup label="Loading" className="mt-6 flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </SkeletonGroup>
        ) : status === 'missing' ? (
          <ErrorState
            className="py-20"
            kind="notFound"
            title="We could not find that conversation"
            description="It may have been removed, or the link may be out of date."
          />
        ) : (
          <>
            <ul className="mt-5 flex flex-col gap-3">
              {messages.map((message) => (
                <li key={message.id}>
                  <Bubble message={message} />
                </li>
              ))}
            </ul>

            {/* Offered against the latest reply, so it reads as a response to
                what was just said rather than as a permanent escape hatch. */}
            {!withAPerson && !closed && lastReply ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {lastReply.quickReplies.map((reply) =>
                  reply.toLowerCase().includes('person') ? (
                    <Chip key={reply} onClick={() => void escalate()}>
                      <UserRound className="size-3.5" aria-hidden="true" />
                      {reply}
                    </Chip>
                  ) : (
                    <Chip key={reply} onClick={() => void send(reply)}>
                      {reply}
                    </Chip>
                  )
                )}
              </div>
            ) : null}

            <div ref={bottom} />
          </>
        )}
      </main>

      {status === 'ready' && !closed ? (
        <div className="sticky bottom-0 border-t border-border bg-bg px-4 py-3 pb-[calc(0.75rem+var(--safe-bottom))]">
          <form
            className="mx-auto flex max-w-lg items-end gap-2 lg:max-w-2xl"
            onSubmit={(event) => {
              event.preventDefault()
              void send(text)
            }}
          >
            <label htmlFor="reply" className="sr-only">
              Your message
            </label>
            <input
              id="reply"
              value={text}
              onChange={(event) => setText(event.target.value.slice(0, 2000))}
              placeholder="Type a message"
              enterKeyHint="send"
              className="min-h-12 flex-1 rounded-pill border border-border bg-bg px-4 text-base text-ink outline-none focus:border-brand"
            />
            <Button
              type="submit"
              loading={sending}
              disabled={text.trim().length === 0}
              aria-label="Send"
              className="aspect-square px-0"
            >
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  )
}

function Bubble({ message }: { message: SupportMessage }) {
  const mine = message.author === 'user'
  const system = message.author === 'system'

  if (system) {
    return (
      <p className="py-1 text-center text-xs text-muted">{message.text}</p>
    )
  }

  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[85%]">
        <div
          className={cn(
            'rounded-card px-4 py-2.5 text-sm leading-relaxed',
            mine
              ? 'bg-ink text-bg'
              : 'border border-border bg-bg text-ink'
          )}
        >
          {message.text}
        </div>
        <p
          className={cn(
            'mt-1 text-xs text-muted',
            mine ? 'text-right' : 'text-left'
          )}
        >
          {/* Said plainly. A first reply that lets someone believe a person
              typed it is the thing they resent afterwards. */}
          {mine
            ? relativeTime(message.at)
            : `${
                message.author === 'agent' ? 'Support' : 'Automatic reply'
              } · ${relativeTime(message.at)}`}
        </p>
      </div>
    </div>
  )
}
