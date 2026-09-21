'use client'

import { useCallback } from 'react'
import { ChevronDown, Gift, Wallet } from 'lucide-react'
import { formatPaise, type Wallet as WalletDoc, type WalletEntry } from '@app/shared'

import { ProfileShell } from '@/components/ProfileShell'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { fetchLedger, fetchWallet } from '@/lib/wallet'
import { formatDateTime } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * Credits: what we owe this customer, and why.
 *
 * Deliberately not called a wallet anywhere the customer can read. A wallet is
 * a thing you put money into, and there is nothing here to put money into —
 * every paisa on this screen was issued by us, for a visit we were late to, a
 * job we could not make, or a referral. Calling it a wallet would have people
 * hunting for an Add money button that must never exist, because the moment it
 * does this app is holding public money and answering to the RBI for it.
 *
 * The balance and the statement are fetched together. They are two reads of
 * the same fact and a screen that showed one without the other would be a
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
        <Skeleton className="h-40" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-32" />
      </SkeletonGroup>
    )
  }

  if (credits.status === 'error' || !credits.data) {
    return (
      <ErrorState
        onRetry={credits.reload}
        retrying={credits.refreshing}
      />
    )
  }

  const { wallet, entries } = credits.data

  return (
    <div className="mt-5 flex flex-col gap-6">
      <BalanceCard balance={wallet.balance} />

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Ready to use" value={formatPaise(wallet.balance)} />
        <StatTile
          label="Given to you so far"
          value={formatPaise(wallet.lifetimeIssued)}
        />
      </div>

      <section>
        <h2 className="mb-3 text-xl font-bold text-ink">Activity</h2>
        {entries.length === 0 ? (
          <Card className="py-2">
            <EmptyState
              icon={Gift}
              title="No credits yet"
              description="When we owe you something — a visit we were late to, a job we could not make — it turns up here."
            />
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <LedgerRow entry={entry} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <Faq />
    </div>
  )
}

// ---------------------------------------------------------------------------

/**
 * The balance, as the one thing on the screen that is allowed to be large.
 *
 * Brand colours rather than a decorative gradient of its own: this is the app
 * talking about the customer's money, and a second house palette invented for
 * one card is how a design system starts leaking.
 */
function BalanceCard({ balance }: { balance: number }) {
  return (
    <div className="rounded-card bg-linear-to-br from-brand-deep to-brand p-5 text-bg">
      <div className="flex items-center gap-2">
        <Wallet className="size-5" aria-hidden="true" />
        <p className="text-sm font-semibold tracking-[0.06em] uppercase">
          24X7 Credits
        </p>
      </div>

      <p className="mt-6 text-xs font-semibold tracking-[0.08em] uppercase text-bg/70">
        Balance
      </p>
      <p className="mt-0.5 text-3xl font-bold">{formatPaise(balance)}</p>

      <p className="mt-3 text-sm text-bg/80">
        {balance > 0
          ? 'We take this off your next bill. Nothing to redeem.'
          : 'Credits we owe you show up here and come off your next bill.'}
      </p>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
    </Card>
  )
}

/**
 * One line of the statement.
 *
 * The sign is spelled out with a + or a − as well as with colour, because a
 * green number and a dark one are the same number to anyone who cannot tell
 * them apart, and this is the screen where that matters most.
 */
function LedgerRow({ entry }: { entry: WalletEntry }) {
  const added = entry.kind === 'issued'
  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div className="min-w-0">
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

/**
 * The questions this screen raises by existing.
 *
 * NEXT: "How do I use them?" says a person takes the credit off the bill,
 * because today a person does. Spending them at checkout needs `credits` in
 * the price breakdown and a spend inside markBookingPaid's own transaction —
 * the wallet and the booking have to settle together or a customer can lose
 * credits to a booking that did not confirm. When that lands, this answer
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
    a: 'No. Credits only ever come from us. There is no top-up, because this is not a wallet — we do not hold your money, and every payment you make goes straight to the payment provider.',
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
    <section>
      <h2 className="mb-3 text-xl font-bold text-ink">Common questions</h2>
      <Card>
        <ul className="divide-y divide-border">
          {FAQ.map((item) => (
            <li key={item.q}>
              <details className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 p-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown
                    className="size-4 shrink-0 text-muted transition-transform duration-[var(--duration-fast)] group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="px-4 pb-4 text-sm text-muted">{item.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}
