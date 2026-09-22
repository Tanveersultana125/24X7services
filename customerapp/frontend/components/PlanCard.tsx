'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { CalendarClock, Check, Sparkles, Ticket } from 'lucide-react'
import {
  formatPaise,
  isPlanActive,
  planVisitsLeft,
  type CatalogPlan,
  type UserPlan,
} from '@app/shared'

import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Chip'
import { daysUntil, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * The two faces of a plan: one somebody holds, and one on sale.
 *
 * They are in the same file because they have to stay recognisable as the same
 * object. A customer looks at the offer, buys it, and sees it again a screen
 * later — if the name, the visit count and the cover are laid out differently
 * in the two places, that is two products as far as they are concerned.
 *
 * Both lead with what a plan actually is: a number of visits, on named
 * appliances, for a length of time. The price is the second thing, not the
 * first, because a plan bought without understanding the count is a refund
 * request in about six weeks.
 */

/** How the appliances a plan covers are read out. */
function coverage(
  applianceIds: readonly string[],
  names: Map<string, string>
): string {
  return applianceIds.map((id) => names.get(id) ?? id).join(', ')
}

// ---------------------------------------------------------------------------
// A plan somebody holds
// ---------------------------------------------------------------------------

/**
 * Visits left and days left, both, always.
 *
 * Those are the two ways a plan ends, and a customer who can only see one of
 * them has been told half of what they bought. The bar under them is the same
 * fact drawn rather than counted — it is what makes "1 of 2" register as half
 * gone without anybody doing arithmetic.
 */
export function PlanCard({
  plan,
  applianceNames,
  className,
}: {
  plan: UserPlan
  applianceNames: Map<string, string>
  className?: string
}) {
  const left = planVisitsLeft(plan)
  const days = daysUntil(plan.expiresAt)
  const live = isPlanActive(plan)
  const used = plan.visitsIncluded - left
  const spent = Math.round((used / plan.visitsIncluded) * 100)

  return (
    <article
      className={cn(
        'overflow-hidden rounded-card border',
        live ? 'border-border bg-bg' : 'border-border bg-surface',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-ink">{plan.name}</h3>
          <p className="mt-0.5 text-xs text-muted">
            {coverage(plan.applianceIds, applianceNames)}
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

      <div className="px-4">
        <div className="flex items-end justify-between gap-3">
          <p className="text-sm text-muted">
            <span className="text-2xl font-bold text-ink tabular-nums">
              {left}
            </span>
            <span className="text-ink"> of {plan.visitsIncluded}</span> visits
            left
          </p>
          <p className="shrink-0 text-xs text-muted tabular-nums">
            {days > 0
              ? `${days} ${days === 1 ? 'day' : 'days'} left`
              : 'Ended'}
          </p>
        </div>

        {/* The count, drawn. aria-hidden because the sentence above already
            says it — a progress bar read out as well would say it twice. */}
        <div
          aria-hidden="true"
          className="mt-2 h-1.5 overflow-hidden rounded-pill bg-surface"
        >
          <div
            className={cn('h-full rounded-pill', live ? 'bg-brand' : 'bg-muted')}
            style={{ width: `${Math.min(100, Math.max(0, spent))}%` }}
          />
        </div>
      </div>

      <p className="flex items-center gap-1.5 px-4 py-3 text-xs text-muted">
        <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
        {days > 0
          ? `Runs until ${formatDateTime(plan.expiresAt).split(',')[0]}`
          : `Ended ${formatDateTime(plan.expiresAt).split(',')[0]}`}
      </p>

      {live ? (
        <p className="border-t border-border bg-surface px-4 py-3 text-xs text-muted">
          Book as usual — we take the visit fee off when the appliance is one
          this plan covers.
        </p>
      ) : null}
    </article>
  )
}

// ---------------------------------------------------------------------------
// A plan on offer
// ---------------------------------------------------------------------------

/**
 * One plan, priced, with the one button that buys it.
 *
 * The saving is a subtraction the customer can check — what the same cover
 * costs as separate visits, struck through, next to what it costs as a plan.
 * "Best value" as a badge with no number behind it is the thing everybody has
 * learned to ignore.
 *
 * `highlight` is for the one plan the screen wants to lead with. It changes
 * the border and adds a ribbon, and nothing else: a card that also got bigger
 * type and a different button would be a second design.
 */
export function PlanOfferCard({
  plan,
  applianceNames,
  onBuy,
  busy = false,
  signInHref,
  highlight = false,
  className,
}: {
  plan: CatalogPlan
  applianceNames: Map<string, string>
  /** Absent when nobody is signed in; `signInHref` takes over. */
  onBuy?: () => void
  busy?: boolean
  /** Where the button goes when there is nobody to buy on behalf of. */
  signInHref?: Route
  highlight?: boolean
  className?: string
}) {
  const saving =
    plan.compareAt && plan.compareAt > plan.price ? plan.compareAt - plan.price : 0

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-card border bg-bg',
        highlight ? 'border-brand shadow-sm' : 'border-border',
        className
      )}
    >
      {highlight ? (
        <p className="flex items-center gap-1.5 bg-brand px-4 py-1.5 text-xs font-bold tracking-[0.06em] text-bg uppercase">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Best value
        </p>
      ) : null}

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-ink">{plan.name}</h3>
            <p className="mt-0.5 text-sm text-muted">{plan.tagline}</p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-xl font-bold text-ink tabular-nums">
              {formatPaise(plan.price)}
            </p>
            {saving > 0 ? (
              <p className="text-xs text-muted line-through tabular-nums">
                {formatPaise(plan.compareAt ?? 0)}
              </p>
            ) : null}
          </div>
        </div>

        {/* What the plan is, before what it costs: visits, length, cover. */}
        <dl className="mt-4 grid grid-cols-2 gap-2">
          <Figure
            term="Visits included"
            value={`${plan.visitsIncluded}`}
            hint={plan.visitsIncluded === 1 ? 'service' : 'services'}
          />
          <Figure
            term="Runs for"
            value={`${Math.round(plan.durationDays / 30)}`}
            hint="months"
          />
        </dl>

        <p className="mt-3 text-xs text-muted">
          Covers {coverage(plan.applianceIds, applianceNames)}
        </p>

        <ul className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
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

        {saving > 0 ? (
          <p className="mt-4 flex items-center gap-1.5 rounded-card bg-success-soft px-3 py-2 text-xs font-semibold text-success">
            <Ticket className="size-3.5 shrink-0" aria-hidden="true" />
            Saves {formatPaise(saving)} against booking the same visits one by one
          </p>
        ) : null}

        {onBuy ? (
          <Button
            className="mt-4"
            fullWidth
            variant={highlight ? 'primary' : 'secondary'}
            loading={busy}
            onClick={onBuy}
          >
            Buy for {formatPaise(plan.price)}
          </Button>
        ) : signInHref ? (
          <Link
            href={signInHref}
            className={cn(
              'mt-4 flex h-12 w-full items-center justify-center rounded-pill text-base font-semibold',
              highlight
                ? 'bg-brand text-bg hover:bg-brand-deep'
                : 'border border-brand text-brand hover:bg-brand-soft'
            )}
          >
            Sign in to buy
          </Link>
        ) : null}
      </div>
    </article>
  )
}

/** One of the two figures that say what a plan is before what it costs. */
function Figure({
  term,
  value,
  hint,
}: {
  term: string
  value: string
  hint: string
}) {
  return (
    <div className="min-w-0 rounded-card bg-surface p-3">
      <dt className="text-xs text-muted">{term}</dt>
      <dd className="mt-0.5 text-lg font-bold text-ink">
        <span className="tabular-nums">{value}</span>{' '}
        <span className="text-sm font-medium text-muted">{hint}</span>
      </dd>
    </div>
  )
}
