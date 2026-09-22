'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import {
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  MessageSquare,
  Phone,
  ReceiptIndianRupee,
  ShieldCheck,
  Compass,
  UserRound,
} from 'lucide-react'

import { AppShell, Section } from '@/components/AppShell'
import { SUPPORT_TOPICS } from './topics'
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
 * Under it, every topic the inbox actually fills up with, each opening to its
 * questions answered in full rather than to an article somewhere else. The
 * answers live in `topics.ts`; this screen only decides the order they are
 * offered in, which is roughly the order people arrive needing them.
 */

/** Which icon stands for which topic. The topics themselves carry no JSX. */
const TOPIC_ICONS: Record<string, typeof UserRound> = {
  'getting-started': Compass,
  'booking-changes': CalendarClock,
  payments: ReceiptIndianRupee,
  'plans-membership': BadgeCheck,
  warranty: ShieldCheck,
  account: UserRound,
}

export function SupportScreen() {
  const load = useCallback(() => fetchBusinessConfig(), [])
  const config = useAsync(load)

  return (
    <AppShell mobileHeader={<Header title="Support" showBack backFallback="/home" />}>
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
        className="mt-3 flex min-h-12 items-center justify-center rounded-card border border-border text-sm font-semibold text-ink hover:border-brand"
      >
        Your past conversations
      </Link>

      <Section title="All topics">
        <ul className="-mx-4 divide-y divide-border border-y border-border lg:mx-0">
          {SUPPORT_TOPICS.map((topic) => {
            const Icon = TOPIC_ICONS[topic.id] ?? UserRound
            return (
              <li key={topic.id}>
                <Link
                  href={`/support/topic?t=${topic.id}` as Route}
                  className="flex items-center gap-4 px-4 py-4 hover:bg-surface lg:px-0"
                >
                  <Icon
                    className="size-5 shrink-0 text-ink"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium text-ink">
                      {topic.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {topic.blurb}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-5 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            )
          })}
        </ul>
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
