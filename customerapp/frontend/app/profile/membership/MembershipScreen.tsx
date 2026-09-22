'use client'

import { useCallback, useState } from 'react'
import { BadgeCheck, Check, Sparkles } from 'lucide-react'
import {
  MEMBERSHIP_BENEFITS,
  MEMBERSHIP_OPTIONS,
  formatPaise,
  isMembershipActive,
  type Membership,
  type MembershipOptionId,
} from '@app/shared'

import { ProfileShell } from '@/components/ProfileShell'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/Toast'
import { fetchMembership } from '@/lib/plans'
import { buy } from '@/lib/purchase'
import { daysUntil, formatDateTime } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * 24X7 Plus: what it does, what it costs, and when it runs out.
 *
 * Every benefit listed here is one the backend actually applies at checkout —
 * the visit fee is waived on the booking and the repair discount comes off the
 * approved total, both recorded on the booking itself so a membership that
 * lapses next week cannot re-price a job booked today. A membership screen
 * whose benefits are honoured by a person reading a spreadsheet is a refund
 * request with a screenshot attached.
 *
 * It does not renew itself, and the screen says so rather than burying it. A
 * subscription that charges without asking needs a mandate, a reminder, a
 * cancellation flow and somewhere to argue about the charge; until all four
 * exist, this lapses and the customer buys it again.
 */
export function MembershipScreen() {
  return (
    <ProfileShell title="Membership">
      {(user) => <Plus uid={user.uid} />}
    </ProfileShell>
  )
}

function Plus({ uid }: { uid: string }) {
  const load = useCallback(() => fetchMembership(uid), [uid])
  const membership = useAsync(load)

  if (membership.status === 'loading') {
    return (
      <SkeletonGroup label="Loading your membership" className="mt-6 flex flex-col gap-4">
        <Skeleton className="h-44" />
        <Skeleton className="h-40" />
      </SkeletonGroup>
    )
  }

  if (membership.status === 'error') {
    return (
      <ErrorState
        className="py-16"
        onRetry={membership.reload}
        retrying={membership.refreshing}
      />
    )
  }

  const current = membership.data ?? null
  const active = isMembershipActive(current)

  return (
    <>
      {active && current ? (
        <ActiveCard membership={current} />
      ) : (
        <PitchCard lapsed={current !== null} />
      )}

      <section className="mt-6">
        <h2 className="text-lg font-bold text-ink">What you get</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {MEMBERSHIP_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success"
                aria-hidden="true"
              >
                <Check className="size-3.5" />
              </span>
              <span className="text-base text-ink">{benefit}</span>
            </li>
          ))}
        </ul>
      </section>

      <div aria-hidden="true" className="-mx-4 my-6 h-2 bg-surface" />

      <Buy active={active} onBought={membership.reload} />

      <p className="mt-6 pb-6 text-xs text-muted">
        24X7 Plus does not renew on its own. We will not charge you again unless
        you come back here and buy it. The visit fee is waived on every booking
        made while it is live, and 10% comes off repairs you approve — both are
        applied to the booking when it is made, so a membership that runs out
        later does not change a bill you have already been quoted.
      </p>
    </>
  )
}

/** The card for somebody who is already a member. */
function ActiveCard({ membership }: { membership: Membership }) {
  const left = daysUntil(membership.expiresAt)

  return (
    <div className="relative mt-5 overflow-hidden rounded-card bg-linear-to-br from-brand-deep to-brand p-5 text-bg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 size-56 opacity-25 [background-image:radial-gradient(circle,var(--color-bg)_1.5px,transparent_1.6px)] [background-size:14px_14px] [mask-image:radial-gradient(circle_at_70%_30%,#000,transparent_70%)]"
      />

      <div className="relative flex items-center gap-2">
        <BadgeCheck className="size-5" aria-hidden="true" />
        <p className="text-sm font-semibold tracking-[0.06em] uppercase">
          24X7 Plus
        </p>
      </div>

      <p className="relative mt-8 text-2xl font-bold">You are a member</p>
      <p className="relative mt-1 text-sm text-bg/80">
        {left > 0
          ? `${left} ${left === 1 ? 'day' : 'days'} left — until ${formatDateTime(
              membership.expiresAt
            )}`
          : 'Ending today'}
      </p>
      <p className="relative mt-3 text-sm text-bg/80">
        Paid {membership.period === 'yearly' ? 'yearly' : 'monthly'}. It will not
        renew on its own.
      </p>
    </div>
  )
}

/** The card for somebody who is not — or is not any more. */
function PitchCard({ lapsed }: { lapsed: boolean }) {
  return (
    <div className="relative mt-5 overflow-hidden rounded-card border border-border p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-brand" aria-hidden="true" />
        <p className="text-sm font-semibold tracking-[0.06em] uppercase text-brand">
          24X7 Plus
        </p>
      </div>

      <p className="mt-3 text-2xl font-bold leading-snug text-ink">
        {lapsed
          ? 'Your membership has run out'
          : 'No visit fee. Ever. On anything.'}
      </p>
      <p className="mt-2 text-sm text-muted">
        {lapsed
          ? 'Buy it again and the visit fee goes back to nothing from your next booking.'
          : 'One membership on the account, every appliance in the house. The fee we charge to come out disappears, and 10% comes off every repair you approve.'}
      </p>
    </div>
  )
}

/**
 * Choosing how long for.
 *
 * Two lengths, with what the yearly one saves stated as a number rather than as
 * a badge saying "best value" — the customer can check a number.
 */
function Buy({ active, onBought }: { active: boolean; onBought: () => void }) {
  const [chosen, setChosen] = useState<MembershipOptionId>('plus-yearly')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const option =
    MEMBERSHIP_OPTIONS.find((each) => each.id === chosen) ?? MEMBERSHIP_OPTIONS[0]

  async function pay(): Promise<void> {
    if (busy) return
    setBusy(true)
    try {
      const outcome = await buy({ kind: 'membership', optionId: chosen })
      if (outcome.kind === 'bought') {
        toast.show(
          active ? 'Membership extended.' : 'You are a 24X7 Plus member.',
          { tone: 'success' }
        )
        onBought()
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
    <section>
      <h2 className="text-lg font-bold text-ink">
        {active ? 'Add more time' : 'Become a member'}
      </h2>
      {active ? (
        <p className="mt-1 text-sm text-muted">
          Buying now adds to what is left rather than starting again.
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-3">
        {MEMBERSHIP_OPTIONS.map((each) => {
          const selected = each.id === chosen
          const saving =
            'compareAt' in each && each.compareAt
              ? each.compareAt - each.price
              : 0
          return (
            <button
              key={each.id}
              type="button"
              onClick={() => setChosen(each.id)}
              aria-pressed={selected}
              className={cn(
                'min-w-0 rounded-card border p-4 text-left',
                'transition-colors duration-[var(--duration-fast)]',
                selected
                  ? 'border-brand bg-brand-soft'
                  : 'border-border hover:border-brand'
              )}
            >
              <p className="text-sm font-semibold text-ink">{each.label}</p>
              <p className="mt-1 text-xl font-bold text-ink tabular-nums">
                {formatPaise(each.price)}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {saving > 0
                  ? `Saves ${formatPaise(saving)} a year`
                  : `${each.durationDays} days`}
              </p>
            </button>
          )
        })}
      </div>

      <Button
        className="mt-4"
        fullWidth
        loading={busy}
        onClick={() => void pay()}
      >
        {active ? 'Extend for' : 'Join for'} {formatPaise(option?.price ?? 0)}
      </Button>
    </section>
  )
}
