'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import {
  ArrowDownToLine,
  ChevronDown,
  Gift,
  HandCoins,
  Plus,
  ReceiptIndianRupee,
  WalletMinimal,
} from 'lucide-react'
import {
  formatPaise,
  isCreditEntry,
  TOPUP_PRESETS,
  type Paise,
  type Wallet as WalletDoc,
  type WalletEntry,
} from '@app/shared'

import { Header } from '@/components/Header'
import {
  BottomNavigation,
  BOTTOM_NAV_CLEARANCE,
} from '@/components/BottomNavigation'
import { BottomSheet } from '@/components/BottomSheet'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/lib/auth'
import { topUp } from '@/lib/topup'
import { fetchLedger, fetchWallet } from '@/lib/wallet'
import { formatDateTime } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * The customer's balance with us, and the reason for every paisa of it.
 *
 * Laid out the way every wallet screen on a phone here is laid out, because
 * that shape is now what people expect and fighting it wins nothing: a
 * coloured balance card at the top, two figures under it, the statement, and
 * the questions. What is deliberately missing from that shape is Add money.
 *
 * Two kinds of money are on it, and the screen never pretends they are one.
 * Credits, which we issued because we owed them; and the customer's own money,
 * added through Add money. They share a balance because they buy the same
 * thing, and the statement says which is which on every line.
 *
 * Add money is the reason the limits in the schema matter — see the note at
 * the top of `shared/wallet.ts`. The balance is closed-loop: it buys 24X7
 * services, it cannot be transferred or withdrawn, and it is refundable on
 * request. Nothing on this screen may quietly stop any of those being true.
 *
 * The balance and the statement are fetched together. They are two reads of
 * the same fact, and a screen that showed one without the other would be a
 * screen showing a number with no reason behind it.
 *
 * It is the one screen under /profile that does not bounce a signed-out
 * visitor to the login form. The way in is a tile on Home, and Home is open to
 * anyone — so the tap that should answer "what are these credits?" was
 * answering with a phone number field instead. Signed out, the balance is
 * replaced by a way in and the questions below it are shown in full: they are
 * the part someone who has not signed in actually came to read.
 */

interface CreditsData {
  wallet: WalletDoc
  entries: WalletEntry[]
}

/**
 * Where every way in from this screen points.
 *
 * `next` is this screen's own path, written out rather than read off the
 * location: this screen takes no query parameters, so there is nothing about
 * the current URL worth preserving, and a constant cannot come back wrong.
 */
const SIGN_IN = '/login?next=%2Fprofile%2Fwallet' as Route

export function WalletScreen() {
  const { user, ready } = useAuth()

  return (
    <div className="min-h-dvh bg-bg">
      <Header title="Balance" showBack backFallback="/profile" />
      <main
        id="content"
        className={cn(
          'mx-auto w-full max-w-lg px-4 lg:max-w-2xl',
          BOTTOM_NAV_CLEARANCE
        )}
      >
        {!ready ? (
          <CreditsSkeleton />
        ) : user ? (
          <Credits uid={user.uid} />
        ) : (
          <SignedOut />
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}

/**
 * What someone who has not signed in sees: the whole screen, with a dash
 * wherever a figure would be and the one button that fills them in.
 *
 * The blocks are all here rather than hidden, and the figures read zero
 * rather than a dash. A screen that drops two thirds of itself until you sign
 * in does not read as "sign in to see your figures", it reads as a different,
 * emptier product; and a row of dashes where the money goes reads as a screen
 * that failed to load rather than one waiting to be signed into. Zero is the
 * truthful number for an account nobody has named yet, and the button above
 * says whose zero it is not.
 */
function SignedOut() {
  return (
    <CreditsBody
      balance={0}
      given={0}
      used={0}
      entries={[]}
      emptyNote="Sign in and everything on your balance shows up here."
      signedIn={false}
      action={
        <Link
          href={SIGN_IN}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-pill bg-brand text-base font-semibold text-bg"
        >
          Sign in to see your balance
        </Link>
      }
    />
  )
}

function CreditsSkeleton() {
  return (
    <SkeletonGroup label="Loading your balance" className="mt-5 flex flex-col gap-4">
      <Skeleton className="h-48" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-32" />
    </SkeletonGroup>
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

  if (credits.status === 'loading') return <CreditsSkeleton />

  if (credits.status === 'error' || !credits.data) {
    return <ErrorState onRetry={credits.reload} retrying={credits.refreshing} />
  }

  const { wallet, entries } = credits.data
  const used = entries
    .filter((entry) => !isCreditEntry(entry.kind))
    .reduce((total, entry) => total + entry.amount, 0)

  return (
    <CreditsBody
      balance={wallet.balance}
      given={wallet.lifetimeIssued}
      used={used}
      entries={entries}
      signedIn
      emptyNote="Nothing yet. Add money, or wait for us to owe you something."
      onAdded={credits.reload}
    />
  )
}

/**
 * The screen itself, signed in or not.
 *
 * One component for both states rather than two that drift: a figure is either
 * a number or a dash, and the only thing the signed-out state adds is a button
 * under the card. Everything else — the blocks, their order, the bands between
 * them — is decided once.
 */
function CreditsBody({
  balance,
  given,
  used,
  entries,
  signedIn,
  emptyNote,
  action,
  onAdded,
}: {
  balance: number
  given: number
  used: number
  entries: readonly WalletEntry[]
  signedIn: boolean
  emptyNote: string
  action?: React.ReactNode
  /** Re-reads the wallet once money has landed. */
  onAdded?: () => void
}) {
  // The filter lives up here because two controls set it: the pills above the
  // list, and the two figures above those. A figure that cannot be pressed to
  // see what it is made of is a number with the receipts locked in the
  // next room.
  const [filter, setFilter] = useState<FilterId>('all')
  const [adding, setAdding] = useState(false)
  const activity = useRef<HTMLElement>(null)

  function show(next: FilterId): void {
    // Pressing the figure that is already showing puts everything back, so the
    // same tap undoes itself rather than being a dead press.
    const applied = next === filter ? 'all' : next
    setFilter(applied)

    // The list is a screen further down on a phone, so filtering it without
    // moving there looks like the tap did nothing at all.
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    activity.current?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <>
      <div className="mt-5">
        <BalanceCard
          balance={balance}
          signedIn={signedIn}
          onAdd={signedIn ? () => setAdding(true) : undefined}
        />
        {action}

        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatTile
            icon={HandCoins}
            label="Credited by us"
            value={formatPaise(given)}
            hint="See everything added to your balance"
            selected={filter === 'issued'}
            onSelect={signedIn ? () => show('issued') : undefined}
          />
          <StatTile
            icon={ReceiptIndianRupee}
            label="Used on bills"
            value={formatPaise(used)}
            hint="See what you spent"
            selected={filter === 'used'}
            onSelect={signedIn ? () => show('used') : undefined}
          />
        </div>
      </div>

      <Band />
      <Activity
        ref={activity}
        entries={entries}
        filter={filter}
        onFilter={setFilter}
        emptyNote={emptyNote}
      />
      <Band />
      <Faq />

      <AddMoneySheet
        open={adding}
        onClose={() => setAdding(false)}
        onAdded={onAdded}
      />
    </>
  )
}

// ---------------------------------------------------------------------------

/**
 * Choosing how much to put in.
 *
 * Four amounts and no free-text field. A top-up is not a payment for anything
 * in particular, so an empty box asking how much is a question with no right
 * answer in it — and the bounds that box would need are the same four numbers
 * with more ways to get them wrong.
 *
 * The sheet stays open while the gateway is up, and closes on the way back.
 * Closing it under the payment sheet would leave a customer looking at the
 * screen behind, unsure whether anything was charged.
 */
function AddMoneySheet({
  open,
  onClose,
  onAdded,
}: {
  open: boolean
  onClose: () => void
  onAdded?: () => void
}) {
  const [busy, setBusy] = useState<Paise | null>(null)
  const toast = useToast()

  async function choose(amount: Paise): Promise<void> {
    if (busy !== null) return
    setBusy(amount)
    try {
      const outcome = await topUp(amount)
      if (outcome.kind === 'added') {
        toast.show(`${formatPaise(amount)} added to your balance`, {
          tone: 'success',
        })
        onAdded?.()
        onClose()
      }
      // Cancelled: the customer closed the payment sheet. The choices stay up
      // so they can pick again, and nothing is announced — they know.
    } catch {
      // The real cause is in the console and the function logs. On screen it
      // is one line, because "your money may or may not have moved" is the
      // only thing a customer can act on.
      toast.show(
        'We could not complete that. If money has left your account, contact support.',
        { tone: 'error' }
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      dismissable={busy === null}
      title="Add money"
      description="Goes into your 24X7 balance and comes off your next bill. Refundable on request; it never expires."
    >
      <div className="grid grid-cols-2 gap-3 p-4">
        {TOPUP_PRESETS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => void choose(amount)}
            disabled={busy !== null}
            className={cn(
              'flex h-14 items-center justify-center rounded-card border text-lg font-bold',
              'transition-colors duration-[var(--duration-fast)]',
              busy === amount
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-border text-ink hover:border-brand disabled:opacity-60'
            )}
          >
            {busy === amount ? 'Opening…' : formatPaise(amount)}
          </button>
        ))}
      </div>

      <p className="px-4 pb-4 text-xs text-muted">
        Your balance can only be spent on 24X7 services. It cannot be
        transferred or withdrawn as cash.
      </p>
    </BottomSheet>
  )
}

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
function BalanceCard({
  balance,
  signedIn,
  onAdd,
}: {
  balance: number
  signedIn: boolean
  /** Absent when nobody is signed in — there is no account to add to. */
  onAdd?: () => void
}) {
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
      <div className="relative mt-0.5 flex items-end justify-between gap-4">
        <p className="text-3xl font-bold">{formatPaise(balance)}</p>

        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-pill bg-bg px-4 text-sm font-semibold text-brand hover:bg-brand-soft"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add money
          </button>
        ) : null}
      </div>

      <p className="relative mt-3 max-w-[22rem] text-sm text-bg/80">
        {!signedIn
          ? 'Your balance is tied to your number. Sign in to see it.'
          : balance > 0
            ? 'We take this off your next bill. Nothing to redeem.'
            : 'Add money, or wait for us to credit you. Either way it comes off your next bill.'}
      </p>
    </div>
  )
}

/**
 * One of the two figures under the balance.
 *
 * It is a button wherever there is a statement to show: pressing it filters
 * the list below to the lines that add up to it, which is the only question a
 * figure like this raises. Signed out there is no statement and no account, so
 * it becomes the same link as the button above it rather than a control that
 * looks live and is not.
 */
function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  selected,
  onSelect,
}: {
  icon: typeof HandCoins
  label: string
  value: string
  /** Read out in place of the bare label, so the press is not a surprise. */
  hint: string
  selected: boolean
  /** Absent when there is nothing to filter — see above. */
  onSelect?: () => void
}) {
  const body = (
    <>
      <Icon
        className={cn('size-5', selected ? 'text-brand' : 'text-muted')}
        aria-hidden="true"
      />
      <p className="mt-3 text-sm text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-ink tabular-nums">{value}</p>
    </>
  )

  // `min-w-0` because a grid column is min-content wide by default, and a
  // label that cannot wrap would push the page sideways the way the filter
  // pills did.
  const base =
    'block w-full min-w-0 rounded-card border p-4 text-left ' +
    'transition-colors duration-[var(--duration-fast)]'

  if (!onSelect) {
    return (
      <Link href={SIGN_IN} className={cn(base, 'border-border')} aria-label={hint}>
        {body}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${label}. ${hint}`}
      className={cn(
        base,
        selected
          ? 'border-brand bg-brand-soft'
          : 'border-border hover:border-brand'
      )}
    >
      {body}
    </button>
  )
}

// ---------------------------------------------------------------------------

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'issued', label: 'Added' },
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
function Activity({
  ref,
  entries,
  filter,
  onFilter,
  emptyNote,
}: {
  /** So the figures above can bring their own filtered list into view. */
  ref: React.Ref<HTMLElement>
  entries: readonly WalletEntry[]
  filter: FilterId
  onFilter: (next: FilterId) => void
  emptyNote: string
}) {
  const shown = entries.filter((entry) =>
    filter === 'all'
      ? true
      : filter === 'issued'
        ? isCreditEntry(entry.kind)
        : !isCreditEntry(entry.kind)
  )

  return (
    <section ref={ref} className="scroll-mt-16">
      <h2 className="text-xl font-bold text-ink">Balance activity</h2>

      {/* Wraps rather than holding its width. Three pills with padding come to
          about 250px, and a flex row that cannot shrink below that pushes the
          whole page sideways on anything narrower — which cuts every block on
          the screen, not just this one. */}
      <div
        role="tablist"
        aria-label="Filter activity"
        className="mt-3 flex flex-wrap gap-2"
      >
        {FILTERS.map((option) => {
          const active = option.id === filter
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onFilter(option.id)}
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
          {entries.length === 0 ? emptyNote : 'Nothing under this filter.'}
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
  const added = isCreditEntry(entry.kind)
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <span
        className={cn(
          'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
          added ? 'bg-success-soft text-success' : 'bg-surface text-muted'
        )}
      >
        {entry.kind === 'topup' ? (
          <ArrowDownToLine className="size-4" aria-hidden="true" />
        ) : added ? (
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
 * The questions this screen raises by existing.
 *
 * Every limit stated here is a limit the code actually enforces, and they are
 * the three that keep this balance a closed-loop instrument rather than a
 * regulated one: it buys only our own services, it cannot be transferred, and
 * it cannot be taken as cash. If any of those answers ever stops being true,
 * it stops being true in the schema first — see `shared/wallet.ts`.
 *
 * NEXT: "How do I use it?" says a person takes the balance off the bill,
 * because today a person does. Spending it at checkout needs `credits` in the
 * price breakdown and the spend inside markBookingPaid's own transaction — the
 * wallet and the booking have to settle together, or a customer loses money to
 * a booking that never confirmed. When that lands, this answer becomes "you do
 * not have to do anything".
 *
 * Native `<details>`, not a JavaScript accordion: it opens before hydration,
 * it is searchable by the browser's own find, and a screen reader announces
 * its state without being told how.
 */
const FAQ = [
  {
    q: 'What is my 24X7 balance?',
    a: 'Two things in one number. Credits we gave you — for a visit we reached late, a job we had to cancel, a referral — and money you added yourself. Both are spent the same way, and the activity list above says which is which on every line.',
  },
  {
    q: 'How do I add money?',
    a: 'Add money on the card above, pick an amount, and pay the way you would pay for a booking. It goes to the same payment provider; we never see your card.',
  },
  {
    q: 'How do I use it?',
    a: 'There is nothing to redeem and no code to enter. Tell us which booking you want it against and we take it off what you owe before you pay.',
  },
  {
    q: 'Does it expire?',
    a: 'No. Nothing on this screen expires — neither the credits we gave you nor the money you added. It stays until you use it.',
  },
  {
    q: 'Can I get money I added back?',
    a: 'Yes. Ask support and we refund it to the card or account it came from. Credits we issued are not refundable in cash, because no cash came in for them.',
  },
  {
    q: 'Can I send it to someone else, or withdraw it?',
    a: 'No. Your balance can only be spent on 24X7 services, on this account. It is not a wallet you can pay other people from, and there is no cash withdrawal.',
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
