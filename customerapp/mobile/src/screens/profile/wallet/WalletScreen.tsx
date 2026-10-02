import { useCallback, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { Href } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ArrowDownToLine,
  ChevronDown,
  Gift,
  HandCoins,
  Plus,
  ReceiptIndianRupee,
  WalletMinimal,
  type LucideIcon,
} from 'lucide-react-native'
import {
  formatPaise,
  isCreditEntry,
  TOPUP_PRESETS,
  type Paise,
  type Wallet as WalletDoc,
  type WalletEntry,
} from '@app/shared'

import { Header } from '@/components/Screen'
import { BottomSheet } from '@/components/BottomSheet'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { useToast } from '@/components/Toast'
import { Icon, useColor } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
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
 * anyone — so signed out, the balance is replaced by a way in and the
 * questions below it are shown in full: they are the part someone who has not
 * signed in actually came to read.
 *
 * The screen owns its ScrollView (rather than leaving it to Screen) so the two
 * figures can bring the statement into view when pressed.
 */

interface CreditsData {
  wallet: WalletDoc
  entries: WalletEntry[]
}

/**
 * Where every way in from this screen points. `next` is this screen's own
 * path, written out: it takes no query parameters, so a constant cannot come
 * back wrong.
 */
const SIGN_IN = '/login?next=%2Fprofile%2Fwallet' as Href

export function WalletScreen() {
  const { user, ready } = useAuth()

  return (
    <WalletFrame>
      {(scrollTo) =>
        !ready ? (
          <CreditsSkeleton />
        ) : user ? (
          <Credits uid={user.uid} scrollTo={scrollTo} />
        ) : (
          <SignedOut scrollTo={scrollTo} />
        )
      }
    </WalletFrame>
  )
}

/** Brings a y offset in the scroll content into view. */
export type ScrollTo = (y: number) => void

/** The header and the scroll the screen sits in. */
export function WalletFrame({ children }: { children: (scrollTo: ScrollTo) => React.ReactNode }) {
  const insets = useSafeAreaInsets()
  const scroller = useRef<ScrollView>(null)
  const scrollTo = useCallback<ScrollTo>((y) => {
    // A little headroom so the heading is not flush with the header.
    scroller.current?.scrollTo({ y: Math.max(0, y - 8), animated: true })
  }, [])

  return (
    <View className="flex-1 bg-bg">
      <Header title="Balance" showBack backFallback="/profile" />
      <ScrollView
        ref={scroller}
        className="flex-1"
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
      >
        {children(scrollTo)}
      </ScrollView>
    </View>
  )
}

/**
 * What someone who has not signed in sees: the whole screen, with zero
 * wherever a figure would be and the one button that fills them in. Zero is the
 * truthful number for an account nobody has named yet, and the button above
 * says whose zero it is not.
 */
function SignedOut({ scrollTo }: { scrollTo: ScrollTo }) {
  return (
    <CreditsBody
      balance={0}
      given={0}
      used={0}
      entries={[]}
      emptyNote="Sign in and everything on your balance shows up here."
      signedIn={false}
      scrollTo={scrollTo}
      action={
        <Tappable
          href={SIGN_IN}
          className="mt-3 h-12 w-full items-center justify-center rounded-pill bg-brand active:bg-brand-deep active:opacity-100"
        >
          <Text className="text-base font-semibold text-white">Sign in to see your balance</Text>
        </Tappable>
      }
    />
  )
}

function CreditsSkeleton() {
  return (
    <SkeletonGroup label="Loading your balance" className="mt-5 gap-4">
      <Skeleton className="h-48" />
      <View className="flex-row gap-3">
        <Skeleton className="h-24 flex-1" />
        <Skeleton className="h-24 flex-1" />
      </View>
      <Skeleton className="h-32" />
    </SkeletonGroup>
  )
}

function Credits({ uid, scrollTo }: { uid: string; scrollTo: ScrollTo }) {
  const load = useCallback(async (): Promise<CreditsData> => {
    const [wallet, entries] = await Promise.all([fetchWallet(uid), fetchLedger(uid)])
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
      scrollTo={scrollTo}
    />
  )
}

/**
 * The screen itself, signed in or not.
 *
 * One component for both states rather than two that drift: the only thing
 * the signed-out state adds is a button under the card. Everything else — the
 * blocks, their order, the bands between them — is decided once.
 */
export function CreditsBody({
  balance,
  given,
  used,
  entries,
  signedIn,
  emptyNote,
  action,
  onAdded,
  scrollTo,
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
  scrollTo: ScrollTo
}) {
  // The filter lives up here because two controls set it: the pills above the
  // list, and the two figures above those. A figure that cannot be pressed to
  // see what it is made of is a number with the receipts locked in the
  // next room.
  const [filter, setFilter] = useState<FilterId>('all')
  const [adding, setAdding] = useState(false)
  const activityY = useRef(0)

  function show(next: FilterId): void {
    // Pressing the figure that is already showing puts everything back, so the
    // same tap undoes itself rather than being a dead press.
    setFilter(next === filter ? 'all' : next)
    // The list is a screen further down on a phone, so filtering it without
    // moving there looks like the tap did nothing at all.
    scrollTo(activityY.current)
  }

  return (
    <>
      <View className="mt-5">
        <BalanceCard
          balance={balance}
          signedIn={signedIn}
          {...(signedIn ? { onAdd: () => setAdding(true) } : {})}
        />
        {action}

        <View className="mt-3 flex-row gap-3">
          <StatTile
            icon={HandCoins}
            label="Credited by us"
            value={formatPaise(given)}
            hint="See everything added to your balance"
            selected={filter === 'issued'}
            {...(signedIn ? { onSelect: () => show('issued') } : {})}
          />
          <StatTile
            icon={ReceiptIndianRupee}
            label="Used on bills"
            value={formatPaise(used)}
            hint="See what you spent"
            selected={filter === 'used'}
            {...(signedIn ? { onSelect: () => show('used') } : {})}
          />
        </View>
      </View>

      <Band />
      <View onLayout={(event) => (activityY.current = event.nativeEvent.layout.y)}>
        <Activity entries={entries} filter={filter} onFilter={setFilter} emptyNote={emptyNote} />
      </View>
      <Band />
      <Faq />

      <AddMoneySheet open={adding} onClose={() => setAdding(false)} {...(onAdded ? { onAdded } : {})} />
    </>
  )
}

// ---------------------------------------------------------------------------

/**
 * Choosing how much to put in.
 *
 * Four amounts and no free-text field. A top-up is not a payment for anything
 * in particular, so an empty box asking how much is a question with no right
 * answer in it.
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
        toast.show(`${formatPaise(amount)} added to your balance`, { tone: 'success' })
        onAdded?.()
        onClose()
      }
      // Cancelled: the customer closed the payment sheet. The choices stay up
      // so they can pick again, and nothing is announced — they know.
    } catch {
      // "Your money may or may not have moved" is the only thing a customer
      // can act on.
      toast.show('We could not complete that. If money has left your account, contact support.', {
        tone: 'error',
      })
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
      <View className="flex-row flex-wrap justify-between gap-y-3 py-4">
        {TOPUP_PRESETS.map((amount) => (
          <Tappable
            key={amount}
            onPress={() => void choose(amount)}
            disabled={busy !== null}
            className={cn(
              'h-14 w-[48%] items-center justify-center rounded-card border',
              busy === amount
                ? 'border-brand bg-brand-soft'
                : cn('border-border active:border-brand', busy !== null && 'opacity-60')
            )}
          >
            <Text className={cn('text-lg font-bold', busy === amount ? 'text-brand' : 'text-ink')}>
              {busy === amount ? 'Opening…' : formatPaise(amount)}
            </Text>
          </Tappable>
        ))}
      </View>

      <Text className="pb-4 text-xs text-muted">
        Your balance can only be spent on 24X7 services. It cannot be transferred or withdrawn as cash.
      </Text>
    </BottomSheet>
  )
}

/**
 * The full-width grey rule between blocks: the balance, the statement and the
 * questions are three unrelated things, and without a band between them they
 * read as one long list that happens to change subject twice.
 */
function Band() {
  return <View aria-hidden className="-mx-4 my-6 h-2 bg-surface" />
}

/**
 * The speckle on the balance card: a grid of dots fading out from a point
 * near the top right — the web's repeating radial gradient under a radial
 * mask, drawn as views since RN has neither.
 */
const SPECKLE_COUNT = 16
const SPECKLE_STEP = 14
function Speckle() {
  const size = SPECKLE_COUNT * SPECKLE_STEP
  const cx = size * 0.7
  const cy = size * 0.3
  const reach = size * 0.7
  const dots: React.ReactNode[] = []
  for (let row = 0; row < SPECKLE_COUNT; row++) {
    for (let col = 0; col < SPECKLE_COUNT; col++) {
      const x = col * SPECKLE_STEP + SPECKLE_STEP / 2
      const y = row * SPECKLE_STEP + SPECKLE_STEP / 2
      const fade = 1 - Math.hypot(x - cx, y - cy) / reach
      if (fade <= 0) continue
      dots.push(
        <View
          key={`${row}-${col}`}
          className="absolute size-[3px] rounded-full bg-bg"
          style={{ left: x - 1.5, top: y - 1.5, opacity: fade }}
        />
      )
    }
  }
  return (
    <View
      aria-hidden
      pointerEvents="none"
      className="absolute -right-10 -top-10 opacity-25"
      style={{ width: size, height: size }}
    >
      {dots}
    </View>
  )
}

/**
 * The balance, as the one thing on the screen allowed to be large. Brand
 * colours rather than a decorative palette of its own — this is the app
 * talking about the customer's money.
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
  const deep = useColor('text-brand-deep')
  const blue = useColor('text-brand')

  return (
    <View className="overflow-hidden rounded-card">
      <LinearGradient colors={[deep, blue]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20 }}>
        <Speckle />

        <View className="flex-row items-center gap-2">
          <Icon as={WalletMinimal} className="size-5 text-white" />
          <Text className="text-sm font-semibold uppercase tracking-[0.84px] text-white">24X7 Credits</Text>
        </View>

        <Text className="mt-10 text-xs font-semibold uppercase tracking-[0.96px] text-white/70">Balance</Text>
        <View className="mt-0.5 flex-row items-end justify-between gap-4">
          <Text className="shrink text-3xl font-bold text-white">{formatPaise(balance)}</Text>

          {onAdd ? (
            <Tappable
              onPress={onAdd}
              className="h-11 shrink-0 flex-row items-center gap-1.5 rounded-pill bg-white px-4 active:opacity-90"
            >
              <Icon as={Plus} className="size-4 text-royal" />
              <Text className="text-sm font-semibold text-royal">Add money</Text>
            </Tappable>
          ) : null}
        </View>

        <Text className="mt-3 max-w-[352px] text-sm text-white/80">
          {!signedIn
            ? 'Your balance is tied to your number. Sign in to see it.'
            : balance > 0
              ? 'We take this off your next bill. Nothing to redeem.'
              : 'Add money, or wait for us to credit you. Either way it comes off your next bill.'}
        </Text>
      </LinearGradient>
    </View>
  )
}

/**
 * One of the two figures under the balance.
 *
 * It is a button wherever there is a statement to show: pressing it filters
 * the list below to the lines that add up to it. Signed out there is no
 * statement and no account, so it becomes the same link as the button above
 * it rather than a control that looks live and is not.
 */
function StatTile({
  icon,
  label,
  value,
  hint,
  selected,
  onSelect,
}: {
  icon: LucideIcon
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
      <Icon as={icon} className={cn('size-5', selected ? 'text-brand' : 'text-muted')} />
      <Text className="mt-3 text-sm text-muted">{label}</Text>
      <Text className="mt-0.5 text-lg font-bold tabular-nums text-ink">{value}</Text>
    </>
  )

  const base = 'min-w-0 flex-1 rounded-card border p-4'

  if (!onSelect) {
    return (
      <Tappable href={SIGN_IN} accessibilityLabel={hint} className={cn(base, 'border-border')}>
        {body}
      </Tappable>
    )
  }

  return (
    <Tappable
      onPress={onSelect}
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}. ${hint}`}
      className={cn(base, selected ? 'border-brand bg-brand-soft' : 'border-border active:border-brand')}
    >
      {body}
    </Tappable>
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
 * tab that appears only once it has something in it moves the two next to it,
 * and a control that moves under the finger is worse than one with nothing
 * behind it.
 */
function Activity({
  entries,
  filter,
  onFilter,
  emptyNote,
}: {
  entries: readonly WalletEntry[]
  filter: FilterId
  onFilter: (next: FilterId) => void
  emptyNote: string
}) {
  const shown = entries.filter((entry) =>
    filter === 'all' ? true : filter === 'issued' ? isCreditEntry(entry.kind) : !isCreditEntry(entry.kind)
  )

  return (
    <View>
      <Text accessibilityRole="header" className="text-xl font-bold text-ink">
        Balance activity
      </Text>

      <View accessibilityRole="tablist" accessibilityLabel="Filter activity" className="mt-3 flex-row flex-wrap gap-2">
        {FILTERS.map((option) => {
          const active = option.id === filter
          return (
            <Tappable
              key={option.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onFilter(option.id)}
              className={cn(
                'min-h-9 justify-center rounded-pill border px-4',
                active ? 'border-ink bg-surface' : 'border-border'
              )}
            >
              <Text className={cn('text-sm font-semibold', active ? 'text-ink' : 'text-muted')}>{option.label}</Text>
            </Tappable>
          )
        })}
      </View>

      {shown.length === 0 ? (
        <Text className="py-12 text-center text-sm text-muted">
          {entries.length === 0 ? emptyNote : 'Nothing under this filter.'}
        </Text>
      ) : (
        <View className="mt-2">
          {shown.map((entry, index) => (
            <View key={entry.id} className={cn(index > 0 && 'border-t border-border')}>
              <LedgerRow entry={entry} />
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

/**
 * One line of the statement. The direction is spelled out with a + or a − as
 * well as with colour, because a green number and a dark one are the same
 * number to anyone who cannot tell them apart.
 */
function LedgerRow({ entry }: { entry: WalletEntry }) {
  const added = isCreditEntry(entry.kind)
  const tone = added ? 'text-success' : 'text-muted'
  return (
    <View className="flex-row items-start justify-between gap-4 py-4">
      <View
        className={cn(
          'mt-0.5 size-9 shrink-0 items-center justify-center rounded-full',
          added ? 'bg-success-soft' : 'bg-surface'
        )}
      >
        <Icon
          as={entry.kind === 'topup' ? ArrowDownToLine : added ? Gift : ReceiptIndianRupee}
          className={cn('size-4', tone)}
        />
      </View>

      <View className="min-w-0 flex-1">
        <Text className="text-sm font-semibold text-ink">{entry.note}</Text>
        <Text className="mt-0.5 text-xs text-muted">{formatDateTime(entry.createdAt)}</Text>
      </View>

      <View className="shrink-0 items-end">
        <Text className={cn('text-sm font-bold tabular-nums', added ? 'text-success' : 'text-ink')}>
          {added ? '+' : '−'}
          {formatPaise(entry.amount)}
        </Text>
        <Text className="mt-0.5 text-xs tabular-nums text-muted">{formatPaise(entry.balanceAfter)} left</Text>
      </View>
    </View>
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
 * because today a person does. When spending at checkout lands, this answer
 * becomes "you do not have to do anything".
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
    <View className="pb-4">
      <Text accessibilityRole="header" className="text-xl font-bold text-ink">
        Frequently asked questions
      </Text>
      <View className="mt-1 border-b border-border">
        {FAQ.map((item, index) => (
          <FaqItem key={item.q} q={item.q} a={item.a} first={index === 0} />
        ))}
      </View>
    </View>
  )
}

/** The web's native <details>: a question that opens to its answer. */
function FaqItem({ q, a, first }: { q: string; a: string; first: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <View className={cn(!first && 'border-t border-border')}>
      <Tappable
        onPress={() => setOpen((value) => !value)}
        accessibilityState={{ expanded: open }}
        className="min-h-11 flex-row items-center justify-between gap-4 py-4"
      >
        <Text className="min-w-0 flex-1 text-sm font-semibold text-ink">{q}</Text>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <Icon as={ChevronDown} className="size-4 text-muted" />
        </View>
      </Tappable>
      {open ? <Text className="pb-4 text-sm text-muted">{a}</Text> : null}
    </View>
  )
}
