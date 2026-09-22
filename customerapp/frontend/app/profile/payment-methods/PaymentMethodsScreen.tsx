'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import {
  Banknote,
  Check,
  Lock,
  Smartphone,
  WalletMinimal,
} from 'lucide-react'
import {
  COL,
  DEFAULT_PAYMENT_PREFERENCE,
  formatPaise,
  userProfileSchema,
  type PaymentPreference,
} from '@app/shared'

import { ProfileShell, useSignInHref } from '@/components/ProfileShell'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { useToast } from '@/components/Toast'
import { db } from '@/lib/firebase'
import { fetchWallet } from '@/lib/wallet'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * How this customer would rather pay.
 *
 * What this screen is not, and says so in the first line: a list of saved
 * cards. We do not have one and will not: the card details go from the
 * customer's phone to Razorpay and never touch this app, which is the only
 * arrangement where a breach here cannot cost anyone money. A screen promising
 * "manage your cards" over an arrangement like that would have to be lying
 * about one of the two.
 *
 * What it manages instead is a preference — one of three habits, stated once
 * and honoured at checkout. That is a real setting with a real effect, and it
 * is the thing people are actually looking for when they open a screen with
 * this name: not the card number, but "stop asking me every time".
 *
 * It is the one client-writable field added to the profile in a while, and the
 * rules validate it as an enum. There is nothing here worth stealing.
 *
 * Signed out it still draws itself. Three ways to pay and the fact that we
 * hold no cards are things about this business, not about one account — they
 * are worth reading before anybody signs in, and they are the answer somebody
 * came to this screen for. Only the tick needs an account, so only the tick
 * waits for one.
 */

const OPTIONS = [
  {
    id: 'balance_first',
    label: 'Use my 24X7 balance first',
    detail:
      'Credits and money you have added come off the bill, and you pay the rest.',
    icon: WalletMinimal,
  },
  {
    id: 'online',
    label: 'Card, UPI or netbanking',
    detail: 'Pay the whole bill through the payment sheet, every time.',
    icon: Smartphone,
  },
  {
    id: 'pay_after_service',
    label: 'Pay after the service',
    detail:
      'Settle with the technician once the job is done, where the service allows it.',
    icon: Banknote,
  },
] as const satisfies ReadonlyArray<{
  id: PaymentPreference
  label: string
  detail: string
  icon: typeof WalletMinimal
}>

/**
 * The write, kept outside the component.
 *
 * `Date.now` in a render is a bug waiting for a re-render, and the lint rule
 * that says so is right even here, where this only ever runs from a tap.
 */
async function savePreference(
  uid: string,
  preference: PaymentPreference
): Promise<void> {
  await setDoc(
    doc(db(), COL.users, uid),
    { paymentPreference: preference, updatedAt: Date.now() },
    { merge: true }
  )
}

export function PaymentMethodsScreen() {
  return (
    <ProfileShell title="Payment methods" signedOut={<Methods uid={null} />}>
      {(user) => <Methods uid={user.uid} />}
    </ProfileShell>
  )
}

function Methods({ uid }: { uid: string | null }) {
  const signIn = useSignInHref()
  const load = useCallback(async () => {
    if (!uid) {
      return { preference: DEFAULT_PAYMENT_PREFERENCE, balance: 0 }
    }
    const [snap, wallet] = await Promise.all([
      getDoc(doc(db(), COL.users, uid)),
      fetchWallet(uid),
    ])
    const parsed = userProfileSchema.safeParse(snap.data())
    return {
      preference:
        (parsed.success ? parsed.data.paymentPreference : undefined) ??
        DEFAULT_PAYMENT_PREFERENCE,
      balance: wallet.balance,
    }
  }, [uid])

  const data = useAsync(load)
  const toast = useToast()

  // Held here rather than re-read, so the tick moves under the finger and the
  // write happens behind it. A radio that waits for a round trip feels broken.
  const [chosen, setChosen] = useState<PaymentPreference | null>(null)
  const [saving, setSaving] = useState(false)

  if (data.status === 'loading') {
    return (
      <SkeletonGroup label="Loading payment methods" className="mt-6 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </SkeletonGroup>
    )
  }

  if (data.status === 'error' || !data.data) {
    return <ErrorState className="py-16" onRetry={data.reload} retrying={data.refreshing} />
  }

  const current = chosen ?? data.data.preference

  async function choose(next: PaymentPreference): Promise<void> {
    if (saving || next === current || !uid) return
    const previous = current
    setChosen(next)
    setSaving(true)
    try {
      await savePreference(uid, next)
    } catch {
      // Put the tick back where it was. A preference that silently did not
      // save is one the customer finds out about at checkout.
      setChosen(previous)
      toast.show('We could not save that. Please try again.', { tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <p className="mt-5 text-sm text-muted">
        Pick how you would rather settle a bill. We ask at checkout either way —
        this is what comes up first.
      </p>

      {!uid ? (
        <p className="mt-2 text-sm text-muted">
          <Link href={signIn} className="font-semibold text-brand">
            Sign in
          </Link>{' '}
          to set yours. The three below are what this app offers either way.
        </p>
      ) : null}

      <ul className="mt-4 flex flex-col gap-3">
        {OPTIONS.map((option) => {
          const selected = Boolean(uid) && option.id === current
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => void choose(option.id)}
                aria-pressed={selected}
                disabled={!uid}
                className={cn(
                  'flex w-full items-start gap-3 rounded-card border p-4 text-left',
                  'transition-colors duration-[var(--duration-fast)]',
                  selected
                    ? 'border-brand bg-brand-soft'
                    : 'border-border',
                  uid && !selected && 'hover:border-brand',
                  !uid && 'cursor-default'
                )}
              >
                <option.icon
                  className={cn(
                    'mt-0.5 size-5 shrink-0',
                    selected ? 'text-brand' : 'text-muted'
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-ink">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">
                    {option.detail}
                  </span>
                  {option.id === 'balance_first' && uid ? (
                    <span className="mt-1 block text-xs font-semibold text-brand tabular-nums">
                      {formatPaise(data.data?.balance ?? 0)} on your balance
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                    selected ? 'border-brand bg-brand text-bg' : 'border-border'
                  )}
                  aria-hidden="true"
                >
                  {selected ? <Check className="size-3.5" /> : null}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="-mx-4 my-6 h-2 bg-surface" aria-hidden="true" />

      {/*
        The honest version of "manage your cards". Saying it plainly is worth
        more than a screen that pretends to hold something it does not.
      */}
      <section className="pb-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
          <Lock className="size-4 text-muted" aria-hidden="true" />
          We do not store your cards
        </h2>
        <p className="mt-2 text-sm text-muted">
          There is no saved card list here because there are no saved cards.
          Your card, UPI id and netbanking details go straight from your phone to
          Razorpay, our payment provider, and never reach us. If your bank or
          Razorpay has offered to remember a card, that choice lives with them
          and you can undo it there.
        </p>

        <Link
          href="/profile/wallet"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-pill border border-border px-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
        >
          <WalletMinimal className="size-4" aria-hidden="true" />
          See your balance
        </Link>
      </section>
    </>
  )
}
