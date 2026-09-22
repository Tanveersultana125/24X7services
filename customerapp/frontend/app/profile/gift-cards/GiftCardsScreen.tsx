'use client'

import { useCallback, useState } from 'react'
import { Copy, Gift, Plus, Ticket } from 'lucide-react'
import {
  GIFT_CARD_AMOUNTS,
  formatPaise,
  giftCardCodeSchema,
  normaliseGiftCode,
  type GiftCard,
  type Paise,
} from '@app/shared'

import { ProfileShell } from '@/components/ProfileShell'
import { BottomSheet } from '@/components/BottomSheet'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Field'
import { Tag } from '@/components/ui/Chip'
import { useToast } from '@/components/Toast'
import { callFn, friendlyError } from '@/lib/callables'
import { fetchMyGiftCards } from '@/lib/giftCards'
import { buy } from '@/lib/purchase'
import { copyText, shareText } from '@/lib/share'
import { formatDateTime } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * Gift cards: buying one, and turning one into credits.
 *
 * Both halves are on one screen because they are the two ends of the same
 * object and a customer holding a code should not have to work out which of
 * two screens it belongs on. Redeeming is first — someone arriving with a code
 * in their hand outnumbers someone deciding to buy one, and the code in their
 * hand expires from short-term memory in about fifteen seconds.
 *
 * What lands is credits on the balance, which means every limit already on the
 * balance applies without being restated: 24X7 services only, no transfer, no
 * cash. That is also why there is no "check balance" for a card — a redeemed
 * card is not a card any more, it is a line on a statement.
 */
export function GiftCardsScreen() {
  return (
    <ProfileShell title="Gift cards">
      {(user) => <GiftCards uid={user.uid} />}
    </ProfileShell>
  )
}

function GiftCards({ uid }: { uid: string }) {
  const load = useCallback(() => fetchMyGiftCards(uid), [uid])
  const cards = useAsync(load)
  const [buying, setBuying] = useState(false)

  return (
    <>
      <Redeem />

      <Band />

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">Cards you have bought</h2>
          <button
            type="button"
            onClick={() => setBuying(true)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold text-brand"
          >
            <Plus className="size-4" aria-hidden="true" />
            Buy one
          </button>
        </div>

        {cards.status === 'loading' ? (
          <SkeletonGroup label="Loading your gift cards" className="mt-3 flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </SkeletonGroup>
        ) : cards.status === 'error' ? (
          <ErrorState className="py-12" onRetry={cards.reload} retrying={cards.refreshing} />
        ) : (cards.data ?? []).length === 0 ? (
          <EmptyState
            className="py-12"
            icon={Gift}
            title="No gift cards yet"
            description="Buy one and we give you a code to pass on. It never expires, and it can only be spent on 24X7 services."
            action={{ label: 'Buy a gift card', onClick: () => setBuying(true) }}
          />
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {(cards.data ?? []).map((card) => (
              <li key={card.code}>
                <CardRow card={card} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <BuySheet
        open={buying}
        onClose={() => setBuying(false)}
        onBought={cards.reload}
      />
    </>
  )
}

// ---------------------------------------------------------------------------

/**
 * The box a code goes into.
 *
 * At the top of the screen and never behind a tap, because the person using it
 * is holding a phone in one hand and reading a code off something in the other.
 */
function Redeem() {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault()
    if (busy) return

    const code = normaliseGiftCode(value)
    const parsed = giftCardCodeSchema.safeParse(code)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'That is not a valid code.')
      return
    }

    setError(undefined)
    setBusy(true)
    try {
      const result = await callFn('redeemGiftCard', { code: parsed.data })
      toast.show(
        `${formatPaise(result.amount)} added. Your balance is now ${formatPaise(
          result.balance
        )}.`,
        { tone: 'success' }
      )
      setValue('')
    } catch (caught) {
      setError(friendlyError(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-5">
      <h2 className="text-lg font-bold text-ink">Redeem a gift card</h2>
      <p className="mt-1 text-sm text-muted">
        The amount lands on your 24X7 balance and comes off your next bill. It
        never expires.
      </p>

      <form onSubmit={(event) => void submit(event)} className="mt-3 flex flex-col gap-3">
        <Input
          label="Gift card code"
          hideLabel
          placeholder="24X7-ABCD-EFGH"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          error={error}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="font-mono tracking-[0.12em] uppercase"
        />
        <Button
          type="submit"
          loading={busy}
          disabled={value.trim().length === 0}
          iconLeft={<Ticket className="size-4" aria-hidden="true" />}
        >
          Redeem
        </Button>
      </form>
    </section>
  )
}

/**
 * One card the customer bought.
 *
 * The code is shown in full on an unredeemed card and struck out of the
 * sentence on a used one — a code that has been spent is not a secret worth
 * hiding, and seeing it is how somebody works out which card was which.
 */
function CardRow({ card }: { card: GiftCard }) {
  const toast = useToast()
  const spent = card.status === 'redeemed'

  async function send(): Promise<void> {
    const outcome = await shareText(
      `Here is a ${formatPaise(card.amount)} 24X7 gift card: ${card.code}. ` +
        'Enter it under Profile, Gift cards, and it goes onto your balance.',
      '24X7 gift card'
    )
    if (outcome === 'copied') {
      toast.show('Gift card copied.', { tone: 'success' })
    } else if (outcome === 'failed') {
      toast.show('We could not share that.', { tone: 'error' })
    }
  }

  return (
    <div
      className={cn(
        'rounded-card border p-4',
        spent ? 'border-border bg-surface' : 'border-border'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-bold text-ink tabular-nums">
            {formatPaise(card.amount)}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {card.recipientName ? `For ${card.recipientName} · ` : ''}
            Bought {formatDateTime(card.purchasedAt)}
          </p>
        </div>
        <Tag
          className={
            spent ? undefined : 'border-success/30 bg-success-soft text-success'
          }
        >
          {spent ? 'Used' : 'Not used yet'}
        </Tag>
      </div>

      <p
        className={cn(
          'mt-3 font-mono text-base font-bold tracking-[0.12em]',
          spent ? 'text-muted line-through' : 'text-ink'
        )}
      >
        {card.code}
      </p>

      {card.message ? (
        <p className="mt-2 text-sm text-muted">“{card.message}”</p>
      ) : null}

      {!spent ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void send()}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-border px-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
          >
            <Gift className="size-4" aria-hidden="true" />
            Send it on
          </button>
          <button
            type="button"
            onClick={() =>
              void copyText(card.code).then((outcome) =>
                toast.show(
                  outcome === 'copied' ? `${card.code} copied` : 'We could not copy that.',
                  { tone: outcome === 'copied' ? 'success' : 'error' }
                )
              )
            }
            className="inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-border px-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
          >
            <Copy className="size-4" aria-hidden="true" />
            Copy code
          </button>
        </div>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------

/**
 * Buying one.
 *
 * Four amounts and no free-text field, like the top-up sheet and for the same
 * reason. The name and the note are optional and are for the buyer's benefit:
 * they are printed on the card in their own list so they can tell three cards
 * apart, and they are never checked against anything.
 */
function BuySheet({
  open,
  onClose,
  onBought,
}: {
  open: boolean
  onClose: () => void
  onBought: () => void
}) {
  const [amount, setAmount] = useState<Paise>(GIFT_CARD_AMOUNTS[0] ?? 50_000)
  const [recipientName, setRecipientName] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  async function pay(): Promise<void> {
    if (busy) return
    setBusy(true)
    try {
      const outcome = await buy({
        kind: 'gift_card',
        amount,
        ...(recipientName.trim() ? { recipientName: recipientName.trim() } : {}),
        ...(message.trim() ? { message: message.trim() } : {}),
      })

      if (outcome.kind === 'bought') {
        toast.show(
          outcome.code
            ? `Gift card ${outcome.code} is ready to send.`
            : 'Your gift card is on its way — it will appear here in a moment.',
          { tone: 'success' }
        )
        setRecipientName('')
        setMessage('')
        onBought()
        onClose()
      }
      // Cancelled: the customer closed the payment sheet. Nothing to announce.
    } catch {
      toast.show(
        'We could not complete that. If money has left your account, contact support.',
        { tone: 'error' }
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      dismissable={!busy}
      title="Buy a gift card"
      description="We give you a code to pass on. It never expires, and it can only be spent on 24X7 services."
      footer={
        <Button fullWidth loading={busy} onClick={() => void pay()}>
          Pay {formatPaise(amount)}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          {GIFT_CARD_AMOUNTS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setAmount(option)}
              aria-pressed={option === amount}
              className={cn(
                'flex h-14 items-center justify-center rounded-card border text-lg font-bold',
                'transition-colors duration-[var(--duration-fast)]',
                option === amount
                  ? 'border-brand bg-brand-soft text-brand'
                  : 'border-border text-ink hover:border-brand'
              )}
            >
              {formatPaise(option)}
            </button>
          ))}
        </div>

        <Input
          label="Who is it for? (optional)"
          placeholder="Amma"
          value={recipientName}
          onChange={(event) => setRecipientName(event.target.value)}
          maxLength={60}
          hint="Only so you can tell your own cards apart."
        />

        <Textarea
          label="A note (optional)"
          placeholder="Happy birthday — get the fridge looked at."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={200}
          rows={3}
        />
      </div>
    </BottomSheet>
  )
}

function Band() {
  return <div aria-hidden="true" className="-mx-4 my-6 h-2 bg-surface" />
}
