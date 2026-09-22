'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { CalendarCheck, Check, ClipboardList } from 'lucide-react'
import {
  formatPaise,
  isPlanActive,
  planVisitsLeft,
  type CatalogPlan,
  type UserPlan,
} from '@app/shared'

import {
  ProfileShell,
  SignInPrompt,
  useSignInHref,
} from '@/components/ProfileShell'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Chip'
import { useToast } from '@/components/Toast'
import { fetchAppliances } from '@/lib/catalog'
import { fetchCatalogPlans, fetchMyPlans } from '@/lib/plans'
import { buy } from '@/lib/purchase'
import { daysUntil, formatDateTime } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * Annual plans: the ones this customer holds, and the ones on offer.
 *
 * A plan is a number of service visits on named appliances, for a year, paid
 * for up front. Two things are therefore always on screen for a plan somebody
 * owns — visits left and days left — because those are the two ways it ends,
 * and a customer who can only see one of them is being told half of what they
 * bought.
 *
 * Visits come off the plan when a job is *finished*, not when it is booked. A
 * booking that gets cancelled has cost nobody a visit, and a plan that debited
 * at booking time would have to give one back on every cancellation — which is
 * a refund path, written twice, for a thing that is not money.
 *
 * What a plan covers at checkout is the visit fee on the appliances it names.
 * It is not a discount on parts, and this screen never implies it is.
 */
export function PlansScreen() {
  return (
    <ProfileShell
      title="Plans"
      // What is on offer is public — it is a price list. Only the plans this
      // customer already holds need an account, so signing out takes away the
      // top of the screen and nothing else.
      signedOut={<PlansOnOffer />}
    >
      {(user) => <Plans uid={user.uid} />}
    </ProfileShell>
  )
}

/** The offer list on its own, for someone who has not signed in. */
function PlansOnOffer() {
  const load = useCallback(async () => {
    const [offered, appliances] = await Promise.all([
      fetchCatalogPlans(),
      fetchAppliances(),
    ])
    return { offered, appliances }
  }, [])

  const data = useAsync(load)
  const names = new Map(
    (data.data?.appliances ?? []).map((each) => [each.id, each.name])
  )

  return (
    <>
      <SignInPrompt
        className="py-10"
        icon={ClipboardList}
        title="Plans you hold"
        description="A plan covers a set number of services on your appliances for a year. Sign in to see the ones you are on."
      />

      <div aria-hidden="true" className="-mx-4 my-2 h-2 bg-surface" />

      <Offers
        offered={data.data?.offered ?? []}
        names={names}
        loading={data.status === 'loading'}
        failed={data.status === 'error'}
        onRetry={data.reload}
      />
    </>
  )
}

function Plans({ uid }: { uid: string }) {
  const load = useCallback(async () => {
    const [mine, offered, appliances] = await Promise.all([
      fetchMyPlans(uid),
      fetchCatalogPlans(),
      fetchAppliances(),
    ])
    return { mine, offered, appliances }
  }, [uid])

  const data = useAsync(load)

  if (data.status === 'loading') {
    return (
      <SkeletonGroup label="Loading your plans" className="mt-6 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </SkeletonGroup>
    )
  }

  if (data.status === 'error' || !data.data) {
    return <ErrorState className="py-16" onRetry={data.reload} retrying={data.refreshing} />
  }

  const { mine, offered, appliances } = data.data
  const names = new Map(appliances.map((each) => [each.id, each.name]))
  const live = mine.filter((plan) => isPlanActive(plan))
  const done = mine.filter((plan) => !isPlanActive(plan))

  return (
    <>
      {live.length > 0 ? (
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-muted">Running now</h2>
          <ul className="flex flex-col gap-3">
            {live.map((plan) => (
              <li key={plan.id}>
                <MyPlanCard plan={plan} names={names} />
              </li>
            ))}
          </ul>
        </section>
      ) : mine.length === 0 ? (
        <EmptyState
          className="py-12"
          icon={ClipboardList}
          title="No plans yet"
          description="A plan covers a set number of services on one appliance for a year, with nothing to pay for the visit. Pick one below."
        />
      ) : null}

      {done.length > 0 ? (
        <section className="mt-7">
          <h2 className="mb-2 text-sm font-semibold text-muted">Finished</h2>
          <ul className="flex flex-col gap-3">
            {done.map((plan) => (
              <li key={plan.id}>
                <MyPlanCard plan={plan} names={names} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div aria-hidden="true" className="-mx-4 my-6 h-2 bg-surface" />

      <Offers offered={offered} names={names} onBought={data.reload} />
    </>
  )
}

/**
 * Everything on offer.
 *
 * One component for both states. Signed out there is nothing to buy with, so
 * each card's button becomes the way in rather than disappearing — a price
 * list that hides its own buttons until you sign in is a price list you cannot
 * tell is a shop.
 */
function Offers({
  offered,
  names,
  loading = false,
  failed = false,
  onRetry,
  onBought,
}: {
  offered: readonly CatalogPlan[]
  names: Map<string, string>
  loading?: boolean
  /** A read that failed is not an empty shop, and must not read like one. */
  failed?: boolean
  onRetry?: () => void
  /** Absent when nobody is signed in — see above. */
  onBought?: () => void
}) {
  return (
    <section className="pb-6">
      <h2 className="text-lg font-bold text-ink">Plans you can buy</h2>
      <p className="mt-1 text-sm text-muted">
        Each one covers the visit fee on the appliances it names, for a year.
        Repairs are quoted as usual and you approve them before any work starts.
      </p>

      {loading ? (
        <SkeletonGroup label="Loading plans" className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </SkeletonGroup>
      ) : failed ? (
        <ErrorState
          className="py-10"
          description="We could not load the plans on offer. Please try again."
          onRetry={onRetry}
        />
      ) : offered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          No plans are on offer right now.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {offered.map((plan) => (
            <li key={plan.id}>
              <OfferCard plan={plan} names={names} onBought={onBought} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------

/** A plan this customer owns. Visits left and days left, both, always. */
function MyPlanCard({
  plan,
  names,
}: {
  plan: UserPlan
  names: Map<string, string>
}) {
  const left = planVisitsLeft(plan)
  const days = daysUntil(plan.expiresAt)
  const live = isPlanActive(plan)

  return (
    <div
      className={cn(
        'rounded-card border p-4',
        live ? 'border-border' : 'border-border bg-surface'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold text-ink">{plan.name}</p>
          <p className="mt-0.5 text-xs text-muted">
            {plan.applianceIds
              .map((id) => names.get(id) ?? id)
              .join(', ')}
          </p>
        </div>
        <Tag
          className={
            live ? 'border-success/30 bg-success-soft text-success' : undefined
          }
        >
          {live ? 'Active' : days <= 0 ? 'Expired' : 'All visits used'}
        </Tag>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-card bg-surface p-3">
          <dt className="text-xs text-muted">Visits left</dt>
          <dd className="mt-0.5 text-lg font-bold text-ink tabular-nums">
            {left} of {plan.visitsIncluded}
          </dd>
        </div>
        <div className="rounded-card bg-surface p-3">
          <dt className="text-xs text-muted">
            {days > 0 ? 'Days left' : 'Ended'}
          </dt>
          <dd className="mt-0.5 text-lg font-bold text-ink tabular-nums">
            {days > 0 ? days : formatDateTime(plan.expiresAt).split(',')[0]}
          </dd>
        </div>
      </dl>

      {live ? (
        <p className="mt-3 text-xs text-muted">
          Book as usual — we take the visit fee off when the appliance is one
          this plan covers.
        </p>
      ) : null}
    </div>
  )
}

/** A plan on offer, with the one button that buys it. */
function OfferCard({
  plan,
  names,
  onBought,
}: {
  plan: CatalogPlan
  names: Map<string, string>
  /** Absent when nobody is signed in; the button becomes the way in. */
  onBought?: () => void
}) {
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const signIn = useSignInHref()

  async function pay(): Promise<void> {
    if (busy) return
    setBusy(true)
    try {
      const outcome = await buy({ kind: 'plan', planId: plan.id })
      if (outcome.kind === 'bought') {
        toast.show(`${plan.name} is running. It covers your next visit.`, {
          tone: 'success',
        })
        onBought?.()
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
    <div className="rounded-card border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold text-ink">{plan.name}</p>
          <p className="mt-0.5 text-sm text-muted">{plan.tagline}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold text-ink tabular-nums">
            {formatPaise(plan.price)}
          </p>
          {plan.compareAt && plan.compareAt > plan.price ? (
            <p className="text-xs text-muted line-through tabular-nums">
              {formatPaise(plan.compareAt)}
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand">
        <CalendarCheck className="size-3.5" aria-hidden="true" />
        {plan.visitsIncluded} visits · {plan.durationDays} days ·{' '}
        {plan.applianceIds.map((id) => names.get(id) ?? id).join(', ')}
      </p>

      <ul className="mt-3 flex flex-col gap-2">
        {plan.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2">
            <Check
              className="mt-0.5 size-4 shrink-0 text-success"
              aria-hidden="true"
            />
            <span className="text-sm text-ink">{benefit}</span>
          </li>
        ))}
      </ul>

      {onBought ? (
        <Button
          className="mt-4"
          fullWidth
          variant="secondary"
          loading={busy}
          onClick={() => void pay()}
        >
          Buy for {formatPaise(plan.price)}
        </Button>
      ) : (
        <Link
          href={signIn}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-pill border border-brand text-base font-semibold text-brand hover:bg-brand-soft"
        >
          Sign in to buy
        </Link>
      )}
    </div>
  )
}
