'use client'

import { useCallback, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { isPlanActive, type CatalogPlan, type UserPlan } from '@app/shared'

import {
  ProfileShell,
  SignInPrompt,
  useSignInHref,
} from '@/components/ProfileShell'
import { PlanCard, PlanOfferCard } from '@/components/PlanCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { useToast } from '@/components/Toast'
import { fetchAppliances } from '@/lib/catalog'
import { fetchCatalogPlans, fetchMyPlans } from '@/lib/plans'
import { buy } from '@/lib/purchase'
import { useAsync } from '@/lib/useAsync'

/**
 * Annual plans: the ones this customer holds, and the ones on offer.
 *
 * A plan is a number of service visits on named appliances, for a year, paid
 * for up front. Visits come off it when a job is *finished*, not when it is
 * booked — a booking that gets cancelled has cost nobody a visit, and a plan
 * that debited at booking time would have to give one back on every
 * cancellation, which is a refund path written twice for a thing that is not
 * money.
 *
 * What a plan covers at checkout is the visit fee on the appliances it names.
 * It is not a discount on parts, and nothing on this screen implies it is.
 *
 * The offer list is public. It is a price list, and a price list you have to
 * sign in to read is a shop with the shutters down.
 */
export function PlansScreen() {
  return (
    <ProfileShell title="Plans" signedOut={<PlansOnOffer />}>
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

  return (
    <>
      <SignInPrompt
        className="py-10"
        icon={ClipboardList}
        title="Plans you hold"
        description="A plan covers a set number of services on your appliances for a year. Log in to see the ones you are on."
      />

      <Band />

      <Offers
        offered={data.data?.offered ?? []}
        names={nameMap(data.data?.appliances)}
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
          <Skeleton key={i} className="h-40" />
        ))}
      </SkeletonGroup>
    )
  }

  if (data.status === 'error' || !data.data) {
    return (
      <ErrorState
        className="py-16"
        onRetry={data.reload}
        retrying={data.refreshing}
      />
    )
  }

  const { mine, offered, appliances } = data.data
  const names = nameMap(appliances)
  const live = mine.filter((plan) => isPlanActive(plan))
  const done = mine.filter((plan) => !isPlanActive(plan))

  return (
    <>
      <h1 className="mt-6 text-2xl font-bold leading-tight text-ink">
        Your plans
      </h1>

      {live.length > 0 ? (
        <Held title="Running now" plans={live} names={names} />
      ) : mine.length === 0 ? (
        <EmptyState
          className="py-12"
          icon={ClipboardList}
          title="No plans yet"
          description="A plan covers a set number of services on one appliance for a year, with nothing to pay for the visit. Pick one below."
        />
      ) : null}

      {done.length > 0 ? (
        <Held title="Finished" plans={done} names={names} className="mt-7" />
      ) : null}

      <Band />

      <Offers offered={offered} names={names} onBought={data.reload} />
    </>
  )
}

function Held({
  title,
  plans,
  names,
  className,
}: {
  title: string
  plans: readonly UserPlan[]
  names: Map<string, string>
  className?: string
}) {
  return (
    <section className={className ?? 'mt-5'}>
      <h2 className="mb-2 text-sm font-semibold text-muted">{title}</h2>
      <ul className="flex flex-col gap-3">
        {plans.map((plan) => (
          <li key={plan.id}>
            <PlanCard plan={plan} applianceNames={names} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Everything on offer.
 *
 * One component for both states. Signed out there is nothing to buy with, so
 * each card's button becomes the way in rather than disappearing — a price
 * list that hides its own buttons until you sign in is a price list you cannot
 * tell is a shop.
 *
 * The plan with the largest checkable saving leads. Not one somebody picked as
 * "recommended": the ribbon goes on whichever the subtraction says it is, so
 * it cannot drift from the prices printed under it.
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
  const best = bestValue(offered)

  return (
    <section className="pb-6">
      <h2 className="text-xl font-bold text-ink">Plans you can buy</h2>
      <p className="mt-1 text-sm text-muted">
        Each one covers the visit fee on the appliances it names, for a year.
        Repairs are quoted as usual and you approve them before any work starts.
      </p>

      {loading ? (
        <SkeletonGroup label="Loading plans" className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
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
              <Offer
                plan={plan}
                names={names}
                highlight={plan.id === best}
                onBought={onBought}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** The id of the plan that saves the most, or null when none says. */
function bestValue(plans: readonly CatalogPlan[]): string | null {
  let best: { id: string; saving: number } | null = null
  for (const plan of plans) {
    const saving = plan.compareAt ? plan.compareAt - plan.price : 0
    if (saving > 0 && (!best || saving > best.saving)) {
      best = { id: plan.id, saving }
    }
  }
  return best?.id ?? null
}

/** One offer card, and the payment it opens. */
function Offer({
  plan,
  names,
  highlight,
  onBought,
}: {
  plan: CatalogPlan
  names: Map<string, string>
  highlight: boolean
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
    <PlanOfferCard
      plan={plan}
      applianceNames={names}
      highlight={highlight}
      busy={busy}
      {...(onBought ? { onBuy: () => void pay() } : { signInHref: signIn })}
    />
  )
}

function nameMap(
  appliances: ReadonlyArray<{ id: string; name: string }> | undefined
): Map<string, string> {
  return new Map((appliances ?? []).map((each) => [each.id, each.name]))
}

function Band() {
  return <div aria-hidden="true" className="-mx-4 my-6 h-2 bg-surface" />
}
