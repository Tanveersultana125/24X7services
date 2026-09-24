'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { useSearchParams } from 'next/navigation'
import { ArrowUp, Lightbulb, Sparkles, Wrench } from 'lucide-react'

import { Header } from '@/components/Header'
import {
  answer,
  OPENING,
  type AssistantContext,
  type AssistantReply,
} from '@/lib/assistant'
import { cn } from '@/lib/cn'

/**
 * A conversation with the assistant in lib/assistant.ts.
 *
 * Opened from the search screen, either empty or with the prompt the customer
 * tapped already sent (`?q=`). The conversation lives in this screen only:
 * leaving and coming back starts a fresh one, which is what someone asking
 * about a different appliance next week would want anyway.
 */

type Message =
  | { id: number; from: 'customer'; text: string }
  | { id: number; from: 'assistant'; reply: AssistantReply }

/** Long enough to read as an answer being put together, not as lag. */
const THINKING_MS = 600

export function AssistantScreen() {
  const params = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: 'assistant', reply: OPENING },
  ])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const context = useRef<AssistantContext>({})
  const nextId = useRef(1)
  const endRef = useRef<HTMLDivElement>(null)
  const sentInitial = useRef(false)

  async function send(text: string): Promise<void> {
    const message = text.trim()
    if (!message || thinking) return

    setDraft('')
    setMessages((all) => [
      ...all,
      { id: nextId.current++, from: 'customer', text: message },
    ])
    setThinking(true)

    const started = Date.now()
    let reply: AssistantReply
    try {
      const result = await answer(message, context.current)
      context.current = result.context
      reply = result.reply
    } catch {
      reply = {
        text: 'I could not look that up just now. Check your connection and try again, or talk to our support team.',
        actions: [{ label: 'Talk to support', href: '/support' }],
      }
    }

    const wait = THINKING_MS - (Date.now() - started)
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))

    setMessages((all) => [
      ...all,
      { id: nextId.current++, from: 'assistant', reply },
    ])
    setThinking(false)
  }

  // The prompt tapped on the search screen, sent once on arrival.
  useEffect(() => {
    const initial = params.get('q')
    if (!initial || sentInitial.current) return
    sentInitial.current = true
    void send(initial)
    // `send` is stable enough for a run-once effect; re-running on its
    // identity would send the prompt twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, thinking])

  const lastId = messages[messages.length - 1]?.id

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <Header
        title="24X7 Assistant"
        subtitle="Answers from our technicians' repair guides"
        showBack
        backFallback="/search"
      />

      <main
        id="content"
        className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 pb-32 pt-4 lg:max-w-2xl"
      >
        {messages.map((message) =>
          message.from === 'customer' ? (
            <p
              key={message.id}
              className="ml-auto max-w-[85%] rounded-card rounded-br-sm bg-brand px-4 py-2.5 text-sm text-bg"
            >
              {message.text}
            </p>
          ) : (
            <AssistantBubble
              key={message.id}
              reply={message.reply}
              // Only the newest answer's quick replies are live; tapping an
              // old one would answer a question nobody is asking any more.
              onQuickReply={message.id === lastId ? send : undefined}
            />
          )
        )}

        {thinking ? (
          <div
            role="status"
            className="flex w-fit items-center gap-1.5 rounded-card rounded-bl-sm bg-surface px-4 py-3"
          >
            <span className="sr-only">The assistant is typing</span>
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                aria-hidden="true"
                style={{ animationDelay: `${delay}ms` }}
                className="size-1.5 animate-bounce rounded-full bg-muted"
              />
            ))}
          </div>
        ) : null}
        <div ref={endRef} />
      </main>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void send(draft)
        }}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg pb-[var(--safe-bottom)]"
      >
        <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3 lg:max-w-2xl">
          <label htmlFor="assistant-input" className="sr-only">
            Describe the problem
          </label>
          <input
            id="assistant-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Describe the problem…"
            autoComplete="off"
            enterKeyHint="send"
            className="h-12 min-w-0 flex-1 rounded-pill border border-border bg-bg px-4 text-base text-ink placeholder:text-muted focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim() || thinking}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-bg disabled:bg-border disabled:text-muted"
          >
            <ArrowUp className="size-5" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  )
}

function AssistantBubble({
  reply,
  onQuickReply,
}: {
  reply: AssistantReply
  onQuickReply?: (text: string) => void
}) {
  return (
    <div className="flex max-w-[92%] gap-2.5">
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#7C5CFF] to-[#E85DA8] text-bg"
      >
        <Sparkles className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="rounded-card rounded-tl-sm bg-surface px-4 py-3 text-sm text-ink">
          {reply.issue ? (
            <p className="mb-1 font-semibold">{reply.issue}</p>
          ) : null}
          <p className="leading-relaxed">{reply.text}</p>

          {reply.causes?.length ? (
            <section className="mt-3">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
                <Wrench className="size-3.5" aria-hidden="true" />
                Likely causes
              </h3>
              <ul className="mt-1.5 list-disc space-y-1 pl-5">
                {reply.causes.map((cause) => (
                  <li key={cause}>{cause}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {reply.tips?.length ? (
            <section className="mt-3">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
                <Lightbulb className="size-3.5" aria-hidden="true" />
                Worth trying first
              </h3>
              <ul className="mt-1.5 list-disc space-y-1 pl-5">
                {reply.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {reply.actions?.length ? (
          <div className="mt-2 flex flex-col gap-2">
            {reply.actions.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href as Route}
                className={cn(
                  'flex min-h-11 items-center justify-center rounded-pill px-4 text-center text-sm font-semibold',
                  action.primary
                    ? 'bg-brand text-bg hover:bg-brand-deep'
                    : 'border border-border text-brand hover:border-brand'
                )}
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}

        {onQuickReply && reply.quickReplies?.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {reply.quickReplies.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onQuickReply(option)}
                className="min-h-10 rounded-card border border-border bg-bg px-3 text-sm text-ink hover:border-brand"
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
