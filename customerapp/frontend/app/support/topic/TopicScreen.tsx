'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { Route } from 'next'
import { ChevronDown, MessageSquare } from 'lucide-react'

import { Header } from '@/components/Header'
import {
  BottomNavigation,
  BOTTOM_NAV_CLEARANCE,
} from '@/components/BottomNavigation'
import { ErrorState } from '@/components/ErrorState'
import { supportTopic } from '../topics'
import { cn } from '@/lib/cn'

/**
 * One help topic: its questions, answered in full.
 *
 * Answered here rather than linked to an article, because the whole reason
 * people open help is that they do not want to be sent somewhere else. Every
 * answer is checked against what the app actually does — see the note on the
 * topics file.
 *
 * The way to a person is at the bottom of every topic. Someone who has read
 * four answers and is still here has a question the list does not cover, and
 * making them walk back to find the chat is how a help centre earns its
 * reputation.
 *
 * Native `<details>`, not a JavaScript accordion: it opens before hydration,
 * the browser's own find can search inside it, and a screen reader announces
 * its state without being told how.
 */
export function TopicScreen() {
  const params = useSearchParams()
  const topic = supportTopic(params.get('t'))

  return (
    <div className="min-h-dvh bg-bg">
      <Header
        title={topic?.label ?? 'Help'}
        showBack
        backFallback={'/support' as Route}
      />

      <main
        id="content"
        className={cn(
          'mx-auto w-full max-w-lg px-4 lg:max-w-2xl',
          BOTTOM_NAV_CLEARANCE
        )}
      >
        {!topic ? (
          <ErrorState
            className="py-20"
            kind="notFound"
            title="We could not find that topic"
            description="It may have been renamed. The full list is on the support screen."
          />
        ) : (
          <>
            <h1 className="mt-6 text-2xl font-bold leading-tight text-ink">
              {topic.label}
            </h1>
            <p className="mt-1 text-sm text-muted">{topic.blurb}</p>

            <ul className="mt-4 divide-y divide-border border-y border-border">
              {topic.questions.map((item) => (
                <li key={item.q}>
                  <details className="group">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <ChevronDown
                        className="size-4 shrink-0 text-muted transition-transform duration-[var(--duration-fast)] group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <p className="pb-4 text-sm leading-relaxed text-muted">
                      {item.a}
                    </p>
                  </details>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-card border border-border p-4">
              <p className="text-base font-semibold text-ink">
                Still not answered?
              </p>
              <p className="mt-1 text-sm text-muted">
                Tell us what happened and we will sort it out. Most things are
                quicker to fix than to explain.
              </p>
              <Link
                href={'/support/chat' as Route}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-pill bg-ink px-5 text-sm font-semibold text-bg"
              >
                <MessageSquare className="size-4" aria-hidden="true" />
                Start a conversation
              </Link>
            </div>
          </>
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}
