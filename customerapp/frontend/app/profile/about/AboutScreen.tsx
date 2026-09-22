'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import {
  ChevronRight,
  FileText,
  Headset,
  Phone,
  ShieldCheck,
  Undo2,
} from 'lucide-react'

import { Header } from '@/components/Header'
import {
  BottomNavigation,
  BOTTOM_NAV_CLEARANCE,
} from '@/components/BottomNavigation'
import { fetchBusinessConfig } from '@/lib/catalog'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * Who we are, what you agreed to, and how to reach a person.
 *
 * Open to anyone, signed in or not. An About screen behind a login is a company
 * that will tell you its registered name once you have given it your phone
 * number, and the two things most often wanted from this screen — the support
 * number and the cancellation policy — are wanted most by people deciding
 * whether to book at all.
 *
 * The legal name, the GSTIN and the address are read from the same config
 * document that every invoice copies, so this screen and the bill can never
 * disagree about who took the money.
 */

/** Inlined at build time from package.json — see next.config.ts. */
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION

const LEGAL = [
  {
    href: '/legal/terms',
    label: 'Terms of service',
    detail: 'What you agreed to when you signed in',
    icon: FileText,
  },
  {
    href: '/legal/privacy',
    label: 'Privacy policy',
    detail: 'What we keep, and for how long',
    icon: ShieldCheck,
  },
  {
    href: '/legal/cancellation',
    label: 'Cancellation and refunds',
    detail: 'What it costs to call one off',
    icon: Undo2,
  },
] as const satisfies ReadonlyArray<{
  href: Route
  label: string
  detail: string
  icon: typeof FileText
}>

export function AboutScreen() {
  const load = useCallback(() => fetchBusinessConfig(), [])
  const config = useAsync(load)

  return (
    <div className="min-h-dvh bg-bg">
      <Header title="About 24X7" showBack backFallback="/profile" />

      <main
        id="content"
        className={cn(
          'mx-auto w-full max-w-lg px-4 lg:max-w-2xl',
          BOTTOM_NAV_CLEARANCE
        )}
      >
        <section className="mt-6">
          <p className="text-sm font-semibold tracking-[0.08em] uppercase text-muted">
            24X7 Home Services
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-ink">
            Appliance repair that turns up when it said it would
          </h1>
          <p className="mt-2 text-sm text-muted">
            We service refrigerators, washing machines, air conditioners,
            microwaves and geysers across Hyderabad. Every technician is on our
            own roster, every price is quoted before the work starts, and every
            completed job carries a written warranty.
          </p>
        </section>

        <Band />

        <section>
          <h2 className="text-lg font-bold text-ink">Talk to a person</h2>
          <ul className="mt-2 divide-y divide-border border-y border-border">
            <li>
              <Link
                href="/support"
                className="flex items-center gap-4 py-4 hover:bg-surface"
              >
                <Headset className="size-5 shrink-0 text-ink" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-medium text-ink">
                    Help &amp; support
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Open a ticket about any booking
                  </span>
                </span>
                <ChevronRight
                  className="size-5 shrink-0 text-muted"
                  aria-hidden="true"
                />
              </Link>
            </li>

            {config.data?.supportPhone ? (
              <li>
                <a
                  href={`tel:${config.data.supportPhone}`}
                  className="flex items-center gap-4 py-4 hover:bg-surface"
                >
                  <Phone className="size-5 shrink-0 text-ink" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium text-ink">
                      Call us
                    </span>
                    <span className="mt-0.5 block text-xs text-muted tabular-nums">
                      {config.data.supportPhone}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-5 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                </a>
              </li>
            ) : null}
          </ul>
        </section>

        <Band />

        <section>
          <h2 className="text-lg font-bold text-ink">The paperwork</h2>
          <ul className="mt-2 divide-y divide-border border-y border-border">
            {LEGAL.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-4 py-4 hover:bg-surface"
                >
                  <item.icon
                    className="size-5 shrink-0 text-ink"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium text-ink">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {item.detail}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-5 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <Band />

        {/*
          The registered entity, read from the same document the invoices copy.
          It is small print because it is small print — but it is on a screen a
          customer can find, which is the difference between a business and a
          phone number.
        */}
        <section className="pb-6">
          <h2 className="text-lg font-bold text-ink">Registered details</h2>
          {config.data ? (
            <dl className="mt-3 flex flex-col gap-3 text-sm">
              <Detail term="Legal name" value={config.data.legalName} />
              <Detail term="GSTIN" value={config.data.gstin} mono />
              <Detail term="Registered address" value={config.data.address} />
              <Detail
                term="Service tax rate"
                value={`${config.data.gstRate}% GST, included in every price shown`}
              />
            </dl>
          ) : (
            <p className="mt-3 text-sm text-muted">
              {config.status === 'loading'
                ? 'Loading…'
                : 'We could not load these right now. They are printed on every invoice.'}
            </p>
          )}

          {APP_VERSION ? (
            <p className="mt-8 text-center text-xs text-muted">
              Version {APP_VERSION}
            </p>
          ) : null}
        </section>
      </main>

      <BottomNavigation />
    </div>
  )
}

function Detail({
  term,
  value,
  mono = false,
}: {
  term: string
  value: string
  /** For a number that gets read out digit by digit. */
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-xs text-muted">{term}</dt>
      <dd className={cn('mt-0.5 text-ink', mono && 'tabular-nums')}>{value}</dd>
    </div>
  )
}

/** The full-width grey rule this app puts between unrelated blocks. */
function Band() {
  return <div aria-hidden="true" className="-mx-4 my-6 h-2 bg-surface" />
}
