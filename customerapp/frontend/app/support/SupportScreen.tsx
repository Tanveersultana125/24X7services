'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { ChevronDown, MessageSquare, Phone } from 'lucide-react'

import { AppShell, Section } from '@/components/AppShell'
import { Header } from '@/components/Header'
import { Card } from '@/components/ui/Card'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { fetchBusinessConfig } from '@/lib/catalog'
import { formatPhone } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

/**
 * Getting help.
 *
 * The phone number is on this screen, not buried under three taps of chat. Some
 * problems — an expert who has not turned up, a charge that looks wrong — are
 * problems people want to say out loud, and hiding the number to deflect them
 * into a form only makes the call angrier when it comes.
 *
 * The answers below are the ones the support inbox actually fills up with, so
 * they are here in full rather than as links to an article.
 */

const FAQS = [
  {
    question: 'How much will the repair cost?',
    answer:
      'You pay the visit fee to book. Your expert inspects the appliance and quotes anything beyond that, itemised, and nothing is charged or started until you approve it.',
  },
  {
    question: 'Can I cancel or change the time?',
    answer:
      'Both are on the booking itself. Cancelling well before your slot is free; closer to it a small fee applies, and the exact figure is shown before you confirm.',
  },
  {
    question: 'What if the same fault comes back?',
    answer:
      'Every completed repair carries a service warranty. While it is valid, a return visit for the same fault costs nothing — open a conversation here with the booking reference.',
  },
  {
    question: 'How do I know the person at my door is from you?',
    answer:
      'Their name and photo are on the booking before they arrive, and they cannot start the job until you read out the start code shown on that screen.',
  },
] as const

export function SupportScreen() {
  const load = useCallback(() => fetchBusinessConfig(), [])
  const config = useAsync(load)

  return (
    <AppShell mobileHeader={<Header title="Support" />}>
      <p className="mt-5 text-sm leading-relaxed text-muted">
        Tell us what happened and we will sort it out. Most things are quicker
        to fix than to explain.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          href={'/support/chat' as Route}
          className="flex items-center gap-3 rounded-card bg-ink p-4 text-bg"
        >
          <MessageSquare className="size-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-base font-semibold">
              Start a conversation
            </span>
            <span className="mt-0.5 block text-sm text-bg/70">
              Answered here, in the app
            </span>
          </span>
        </Link>

        {config.status === 'loading' ? (
          <SkeletonGroup label="Loading">
            <Skeleton className="h-20 w-full" />
          </SkeletonGroup>
        ) : config.data ? (
          <a
            href={`tel:${config.data.supportPhone}`}
            className="flex items-center gap-3 rounded-card border border-ink p-4 text-ink"
          >
            <Phone className="size-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-base font-semibold">Call us</span>
              <span className="mt-0.5 block text-sm text-muted">
                {formatPhone(config.data.supportPhone)}
              </span>
            </span>
          </a>
        ) : null}
      </div>

      <Link
        href={'/support/tickets' as Route}
        className="mt-3 flex min-h-12 items-center justify-center rounded-card border border-border text-sm font-semibold text-ink hover:border-ink"
      >
        Your past conversations
      </Link>

      <Section title="Common questions">
        <div className="flex flex-col gap-2">
          {FAQS.map((faq) => (
            <Faq key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </Section>

      <Card className="mt-6 p-4">
        <p className="text-sm leading-relaxed text-muted">
          If an expert has not arrived within your two-hour window, tell us
          straight away — we would rather hear it from you than from a review.
        </p>
      </Card>
    </AppShell>
  )
}

/**
 * A native `details` element rather than a hand-rolled accordion: the browser
 * gives keyboard handling, the open state and the screen-reader semantics, and
 * an unopened answer is still findable with the browser's own page search.
 */
function Faq({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-card border border-border bg-bg">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm font-medium text-ink">
        <span className="flex-1">{question}</span>
        <ChevronDown
          className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <p className="px-4 pb-4 text-sm leading-relaxed text-muted">{answer}</p>
    </details>
  )
}
