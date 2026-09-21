'use client'

import { useCallback, useState } from 'react'
import {
  ChevronDown,
  Gift,
  HandCoins,
  ReceiptIndianRupee,
  WalletMinimal,
} from 'lucide-react'
import {
  formatPaise,
  type Wallet as WalletDoc,
  type WalletEntry,
} from '@app/shared'

import { ProfileShell } from '@/components/ProfileShell'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { fetchLedger, fetchWallet } from '@/lib/wallet'
import { formatDateTime } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * Credits: what we owe this customer, and why.
 *
 * Laid out the way every wallet screen on a phone here is laid out, because
 * that shape is now what people expect and fighting it wins nothing: a
 * coloured balance card at the top, two figures under it, the statement, and
 * the questions. What is deliberately missing from that shape is Add money.
 *
 * A wallet is a thing you put money into, and there is nothing here to put
 * money into — every paisa on this screen was issued by us, for a visit we
 * were late to, a job we could not make, or a referral. The moment this app
 * accepts a top-up it is holding public money: a float account, a refund
 * policy and, past a threshold, the RBI's permission. So the word wallet
 * appears nowhere a customer can read it, and the button that would start all
 * of that does not exist.
 *
 * The balance and the statement are fetched together. They are two reads of
 * the same fact, and a screen that showed one without the other would be a
 * screen showing a number with no reason behind it.
 */

interface CreditsData {
  wallet: WalletDoc
  entries: WalletEntry[]
}

export function WalletScreen() {
  return (
    <ProfileShell title="Credits">
      {(user) => <Credits uid={user.uid} />}
    </ProfileShell>
  )
}

function Credits({ uid }: { uid: string }) {
  const load = useCallback(async (): Promise<CreditsData> => {
    const [wallet, entries] = await Promise.all([
      fetchWallet(uid),
      fetchLedger(uid),
    ])
    return { wallet, entries }
  }, [uid])

  const credits = useAsync(load)

  if (credits.status === 'loading') {
    return (
      <SkeletonGroup label="Loading credits" className="mt-5 flex flex-col gap-4">
        <Skeleton className="h-48" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-32" />
      </SkeletonGroup>
    )
  }

  if (credits.status === 'error' || !credits.data) {
    return <ErrorState onRetry={credits.reload} retrying={credits.refreshing} />
  }

  const { wallet, entries } = credits.data
  const used = entries
    .filter((entry) => entry.kind !== 'issued')
    .reduce((total, entry) => total + entry.amount, 0)

  return (
    <>
      <div className="mt-5">
        <BalanceCard balance={wallet.balance} />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatTile
            icon={HandCoins}
            label="Given to you"
            value={formatPaise(wallet.lifetimeIssued)}
          />
          <StatTile
            icon={ReceiptIndianRupee}
            label="Used on bills"
            value={formatPaise(used)}
          />
        </div>
      </div>

      <Band />
      <Activity entries={entries} />
      <Band />
      <Faq />
    </>
  )
}

// ---------------------------------------------------------------------------

/**
 * The full-width grey rule between blocks.
 *
 * Every phone wallet screen has these, and they are doing a real job: the
 * balance, the statement and the questions are three unrelated things, and
 * without a band between them they read as one long list that happens to
 * change subject twice.
 */
function Band() {
  return <div aria-hidden="true" className="-mx-4 my-6 h-2 bg-surface" />
}

/**
 * The balance, as the one thing on the screen allowed to be large.
 *
 * Brand colours rather than a decorative palette of its own — this is the app
 * talking about the customer's money, and a second house gradient invented for
 * one card is how a design system starts leaking. The speckle is a repeating
 * radial gradient rather than an image: it survives any card size, costs no
 * request, and is the one flourish on the screen.
 */
function BalanceCard({ balance }: { balance: number }) {
  return (
    <div className="relative overflow-hidden rounded-card bg-linear-to-br from-brand-deep to-brand p-5 text-bg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 size-56 opacity-25 [background-image:radial-gradient(circle,var(--color-bg)_1.5px,transparent_1.6px)] [background-size:14px_14px] [mask-image:radial-gradient(circle_at_70%_30%,#000,transparent_70%)]"
      />

      <div className="relative flex items-center gap-2">
        <WalletMinimal className="size-5" aria-hidden="true" />
        <p className="text-sm font-semibold tracking-[0.06em] uppercase">
          24X7 Credits
        </p>
      </div>

      <p className="relative mt-10 text-xs font-semibold tracking-[0.08em] uppercase text-bg/70">
        Balance
      </p>
      <p className="relative mt-0.5 text-3xl font-bold">{formatPaise(balance)}</p>

      <p className="relative mt-3 max-w-[22rem] text-sm text-bg/80">
        {balance > 0
          ? 'We take this off your next bill. Nothing to redeem.'
          : 'Credits we owe you show up here and come off your next bill.'}
      </p>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof HandCoins
  label: string
  value: string
}) {
  return (
    <div className="rounded-card border border-border p-4">
      <Icon className="size-5 text-muted" aria-hidden="true" />
      <p className="mt-3 text-sm text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-ink tabular-nums">{value}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'issued', label: 'Received' },
  { id: 'used', label: 'Used' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

/**
 * The statement, with the filter every wallet screen puts above it.
 *
 * All three tabs are always offered, including ones that come back empty. A
 * tab that appears only once it has something in it moves the two next to it
 * the first time a customer is credited, and a control that moves under the
 * finger is worse than one with nothing behind it.
 */
function Activity({ entries }: { entries: readonly WalletEntry[] }) {
  const [filter, setFilter] = useState<FilterId>('all')

  const shown = entries.filter((entry) =>
    filter === 'all'
      ? true
      : filter === 'issued'
        ? entry.kind === 'issued'
        : entry.kind !== 'issued'
  )

  return (
    <section>
      <h2 className="text-xl font-bold text-ink">Credits activity</h2>

      <div role="tablist" aria-label="Filter activity" className="mt-3 flex gap-2">
        {FILTERS.map((option) => {
          const active = option.id === filter
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(option.id)}
              className={cn(
                'rounded-pill border px-4 text-sm font-semibold',
                'transition-colors duration-[var(--duration-fast)]',
                active
                  ? 'border-ink bg-surface text-ink'
                  : 'border-border text-muted hover:text-ink'
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          {entries.length === 0
            ? 'No credits yet. When we owe you something, it turns up here.'
            : 'Nothing under this filter.'}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {shown.map((entry) => (
            <li key={entry.id}>
              <LedgerRow entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/**
 * One line of the statement.
 *
 * The direction is spelled out with a + or a − as well as with colour, because
 * a green number and a dark one are the same number to anyone who cannot tell
 * them apart, and this is the screen where that matters most.
 */
function LedgerRow({ entry }: { entry: WalletEntry }) {
  const added = entry.kind === 'issued'
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <span
        className={cn(
          'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
          added ? 'bg-success-soft text-success' : 'bg-surface text-muted'
        )}
      >
        {added ? (
          <Gift className="size-4" aria-hidden="true" />
        ) : (
          <ReceiptIndianRupee className="size-4" aria-hidden="true" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{entry.note}</p>
        <p className="mt-0.5 text-xs text-muted">
          {formatDateTime(entry.createdAt)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            'text-sm font-bold tabular-nums',
            added ? 'text-success' : 'text-ink'
          )}
        >
          {added ? '+' : '−'}
          {formatPaise(entry.amount)}
        </p>
        <p className="mt-0.5 text-xs text-muted tabular-nums">
          {formatPaise(entry.balanceAfter)} left
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

/**
 * The questions this screen raises by existing. "Can I add money" is answered
 * first among the real ones, because it is the first thing anyone who has used
 * another app of this kind will look for.
 *
 * NEXT: "How do I use them?" says a person takes the credit off the bill,
 * because today a person does. Spending them at checkout needs `credits` in
 * the price breakdown and the spend inside markBookingPaid's own transaction —
 * the wallet and the booking have to settle together, or a customer loses
 * credits to a booking that never confirmed. When that lands, this answer
 * becomes "you do not have to do anything".
 *
 * Native `<details>`, not a JavaScript accordion: it opens before hydration,
 * it is searchable by the browser's own find, and a screen reader announces
 * its state without being told how.
 */
const FAQ = [
  {
    q: 'What are 24X7 Credits?',
    a: 'Money we owe you. We add credits when something on our side goes wrong — a visit we reached late, a job we had to cancel — and sometimes as a thank you for a referral.',
  },
  {
    q: 'Can I add money to my credits?',
    a: 'No, and there is no plan to. Credits only ever come from us. We do not hold your money at any point — every payment you make goes straight to the payment provider.',
  },
  {
    q: 'How do I use them?',
    a: 'There is nothing to redeem and no code to enter. Tell us which booking you want them against and we take the credit off what you owe before you pay.',
  },
  {
    q: 'Do they expire?',
    a: 'No. Credits stay on your account until you use them.',
  },
  {
    q: 'Can I transfer them or take them as cash?',
    a: 'No. Credits can only be spent on 24X7 services, on this account. If you were expecting a refund to your bank instead, contact support and we will sort it out.',
  },
  {
    q: 'Why does my balance not match what I expected?',
    a: 'Every change to it is in the activity list above, newest first, with the balance after each one. If a line looks wrong, contact support with the date and we will check it.',
  },
] as const

function Faq() {
  return (
    <section className="pb-4">
      <h2 className="text-xl font-bold text-ink">Frequently asked questions</h2>
      <ul className="mt-1 divide-y divide-border border-b border-border">
        {FAQ.map((item) => (
          <li key={item.q}>
            <details className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown
                  className="size-4 shrink-0 text-muted transition-transform duration-[var(--duration-fast)] group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="pb-4 text-sm text-muted">{item.a}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  )
}
