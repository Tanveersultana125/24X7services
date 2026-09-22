'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import {
  BadgeCheck,
  Check,
  ChevronRight,
  ClipboardCheck,
  Mail,
  Sparkles,
  Ticket,
  type LucideIcon,
} from 'lucide-react'
import {
  MEMBERSHIP_BENEFITS,
  MEMBERSHIP_OPTIONS,
  formatPaise,
  isMembershipActive,
  type CatalogAppliance,
  type CatalogPlan,
  type Membership,
  type MembershipOptionId,
} from '@app/shared'

import { AppShell, Section } from '@/components/AppShell'
import { Header } from '@/components/Header'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/Toast'
import { useSignInHref } from '@/components/ProfileShell'
import { useAuth } from '@/lib/auth'
import { fetchAppliances } from '@/lib/catalog'
import { fetchCatalogPlans, fetchMembership } from '@/lib/plans'
import { buy } from '@/lib/purchase'
import { useAsync } from '@/lib/useAsync'
import { brand } from '@/config/brand'
import { cn } from '@/lib/cn'

/**
 * Care: everything you can buy here that is not a single repair.
 *
 * The rest of the app sells one visit at a time. What it never had was a
 * shopfront for the two things that cover a year — the annual plans and the
 * membership — and both were filed under Profile, behind an account, where a
 * price list cannot do the one job a price list has. This screen is that
 * shopfront, and it is public: signed out, every number is readable and only
 * the buttons change to a way in.
 *
 * It is laid out the way a marketplace lays out a product page, because that
 * shape is one a customer already knows how to read: what the range is, the
 * things in it priced side by side, what the money actually buys, what is
 * true of every visit underneath it, and a way to talk to somebody about
 * buying at a scale the buttons do not cover.
 *
 * Two rules it does not break. Nothing here is a number the app cannot honour
 * — every benefit listed is one the checkout applies or a person answers the
 * phone about — and no plan carries a rating, because no plan has been rated
 * and a star with an invented figure beside it is the one thing on a page like
 * this that cannot be taken back.
 */

interface CareData {
  plans: CatalogPlan[]
  appliances: CatalogAppliance[]
  membership: Membership | null
}

/** The drawing that stands for a plan: the appliance it covers. */
const APPLIANCE_ART: Record<string, string> = {
  'air-conditioner': '/appliances/air-conditioner.svg',
  refrigerator: '/appliances/refrigerator.svg',
  'washing-machine': '/appliances/washing-machine.svg',
  microwave: '/appliances/microwave.svg',
  geyser: '/appliances/geyser.svg',
}

export function CareScreen() {
  const { user } = useAuth()
  const signIn = useSignInHref('/care')

  const load = useCallback(async (): Promise<CareData> => {
    const [plans, appliances, membership] = await Promise.all([
      fetchCatalogPlans(),
      fetchAppliances(),
      // Nobody signed in is not an error and not a membership — it is simply
      // nothing to fetch.
      user ? fetchMembership(user.uid) : Promise.resolve(null),
    ])
    return { plans, appliances, membership }
  }, [user])

  const data = useAsync(load)
  const plans = data.data?.plans ?? []
  const names = new Map(
    (data.data?.appliances ?? []).map((each) => [each.id, each.name])
  )
  const member = isMembershipActive(data.data?.membership ?? null)

  // The largest saving anybody can check on this page, in rupees. It is a
  // subtraction over the prices printed below it, so it cannot drift from
  // them the way a hand-written "save up to" eventually does.
  const bestSaving = plans.reduce(
    (most, plan) =>
      Math.max(most, plan.compareAt ? plan.compareAt - plan.price : 0),
    0
  )

  return (
    <AppShell mobileHeader={<Header title="Care" showBack backFallback="/home" />}>
      {/* ---------------------------------------------------------------
          What the range is
          --------------------------------------------------------------- */}
      <section className="mt-6">
        <h1 className="text-2xl font-bold leading-tight text-ink">
          Care from {brand.name}
        </h1>
        <p className="mt-1.5 text-base leading-relaxed text-muted">
          Cover for the appliances you already own. Bought once, used all year.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <RangeTile
            href="#plans"
            label="Annual plans"
            note="From one appliance up"
            badge="No visit fee"
            art="/appliances/washing-machine.svg"
          />
          <RangeTile
            href="#plus"
            label={`${brand.name} Plus`}
            note="Every booking, all year"
            art="/banners/shield.svg"
          />
        </div>
      </section>

      {/* ---------------------------------------------------------------
          The plans, priced side by side
          --------------------------------------------------------------- */}
      {/* The anchor sits outside the section rather than in it: `scroll-mt`
          on an element the jump actually lands on is what keeps the heading
          clear of the sticky header. */}
      <span id="plans" aria-hidden="true" className="block scroll-mt-20" />

      <Section
        className="mt-8"
        title="Annual plans"
        subtitle="A set number of services on the appliances a plan names, for a year, with nothing to pay for the visit."
      >
        {data.status === 'loading' ? (
          <SkeletonGroup label="Loading plans" className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </SkeletonGroup>
        ) : data.status === 'error' ? (
          <ErrorState
            className="py-10"
            description="We could not load the plans on offer. Please try again."
            onRetry={data.reload}
            retrying={data.refreshing}
          />
        ) : plans.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No plans are on offer right now.
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-6">
              {plans.map((plan) => (
                <li key={plan.id}>
                  <PlanTile
                    plan={plan}
                    names={names}
                    signInHref={user ? undefined : signIn}
                    onBought={data.reload}
                  />
                </li>
              ))}
            </ul>

            {/* The tile is a price and a promise in four lines. What each
                plan covers visit by visit is a longer read, and it already
                has a screen. */}
            <Link
              href={'/profile/plans' as Route}
              className="mt-6 flex min-h-11 items-center gap-3 border-t border-border pt-4 text-sm font-semibold text-ink hover:text-brand"
            >
              <ClipboardCheck className="size-5 text-brand" aria-hidden="true" />
              <span className="flex-1">See every plan in full</span>
              <ChevronRight className="size-4 text-muted" aria-hidden="true" />
            </Link>
          </>
        )}
      </Section>

      <Band />

      {/* ---------------------------------------------------------------
          The membership
          --------------------------------------------------------------- */}
      <span id="plus" aria-hidden="true" className="block scroll-mt-20" />

      <Section
        title={`${brand.name} Plus`}
        subtitle="Not visits of its own — it changes the price of everything else for as long as it runs."
      >
        <PlusBlock
          member={member}
          signInHref={user ? undefined : signIn}
          onBought={data.reload}
        />
      </Section>

      <Band />

      {/* ---------------------------------------------------------------
          Why buy it here rather than ring somebody
          --------------------------------------------------------------- */}
      <Section
        title="Only in the app"
        subtitle="Two things a phone call cannot give you."
      >
        <div className="grid grid-cols-2 gap-3">
          <OfferCard
            icon={Ticket}
            title={
              bestSaving > 0
                ? `Save up to ${formatPaise(bestSaving)}`
                : 'Priced against the visits'
            }
            detail="Against booking the same visits one by one — the subtraction is printed on every plan above."
          />
          <OfferCard
            icon={BadgeCheck}
            title="No auto-renewal"
            detail="Nothing sits on your card. When the visits or the year run out, the plan ends and you decide again."
          />
        </div>
      </Section>

      {/* ---------------------------------------------------------------
          What is true of every visit, plan or no plan
          --------------------------------------------------------------- */}
      <Section
        title="What every visit carries"
        subtitle="A plan changes what a visit costs. It does not change how one is done."
      >
        <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 lg:mx-0 lg:px-0">
          {VISIT_POINTS.map((point) => (
            <li key={point.key} className="w-56 shrink-0 snap-start">
              <Card className="flex h-full flex-col overflow-hidden">
                <div className="p-4">
                  <h3 className="text-base font-bold leading-snug text-ink">
                    {point.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {point.detail}
                  </p>
                </div>
                <span className="relative mt-auto block h-24 bg-surface">
                  <Image
                    src={point.art}
                    alt=""
                    fill
                    sizes="224px"
                    className="object-contain p-4"
                  />
                </span>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Band />

      {/* ---------------------------------------------------------------
          Buying at a scale the buttons do not cover
          --------------------------------------------------------------- */}
      <Section title="For societies and offices">
        <p className="text-base leading-relaxed text-muted">
          Covering a whole building, or a floor of appliances rather than one
          kitchen? Write to us and we will price it against what is actually
          installed.
        </p>
        <a
          href={`mailto:${brand.supportEmail}`}
          className="mt-3 inline-flex min-h-11 items-center gap-2 text-base font-semibold break-all text-brand hover:underline"
        >
          <Mail className="size-4 shrink-0" aria-hidden="true" />
          {brand.supportEmail}
        </a>
      </Section>

      {/* ---------------------------------------------------------------
          What the whole page amounts to
          --------------------------------------------------------------- */}
      <section className="-mx-4 mt-8 bg-ink px-4 py-10 text-bg lg:mx-0 lg:rounded-card lg:px-8">
        <h2 className="text-2xl leading-tight font-bold">
          Cover you can count.
        </h2>
        <div className="mt-4 flex flex-col gap-4 text-base leading-relaxed text-bg/70">
          <p>
            An annual plan here is a fixed number of services on an appliance
            you name, for a year, at a price you pay once. Not a warranty, not
            a discount on parts, and not a contract that quietly becomes next
            year&apos;s.
          </p>
          <p>
            When the visits are gone or the year ends, it ends. There is no
            mandate on your card and no renewal you have to remember to stop.
            If it was worth having, you buy it again.
          </p>
          <p>
            Everything else works the way it always does: the fault is named
            before it is fixed, the repair is quoted before it is started, and
            nothing beyond the visit begins until you have said yes.
          </p>
        </div>

        {/* The range it all applies to, as the things themselves. Each on a
            light plate: the drawings are coloured line art on a pale disc and
            would sit on this black looking like a mistake rather than a set. */}
        <ul className="mt-8 flex items-center justify-between gap-2">
          {Object.entries(APPLIANCE_ART).map(([id, art]) => (
            <li
              key={id}
              className="relative size-12 shrink-0 overflow-hidden rounded-card bg-bg sm:size-14"
            >
              <Image
                src={art}
                alt=""
                fill
                sizes="56px"
                className="object-contain p-1.5"
              />
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  )
}

// ---------------------------------------------------------------------------
// The range, at the top
// ---------------------------------------------------------------------------

/**
 * One of the two things on sale here, as a tile that jumps to it.
 *
 * A jump rather than a route. Both sections are on this screen and both are a
 * thumb-flick away; sending somebody to another page to read two paragraphs
 * costs them their place for nothing.
 */
function RangeTile({
  href,
  label,
  note,
  badge,
  art,
}: {
  href: string
  label: string
  note: string
  badge?: string
  art: string
}) {
  return (
    <a
      href={href}
      className="group flex flex-col overflow-hidden rounded-card bg-surface p-3 transition-colors duration-[var(--duration-fast)] hover:bg-border"
    >
      <span className="relative block h-24">
        {badge ? (
          <span className="absolute top-0 left-0 z-10 inline-flex items-center gap-1 rounded-card bg-success px-2 py-1 text-[11px] leading-none font-bold text-bg">
            <Sparkles className="size-3" aria-hidden="true" />
            {badge}
          </span>
        ) : null}
        <Image
          src={art}
          alt=""
          fill
          sizes="180px"
          className="object-contain p-2"
        />
      </span>
      <span className="mt-2 block text-base font-bold text-ink">{label}</span>
      <span className="mt-0.5 block text-xs text-muted">{note}</span>
    </a>
  )
}

// ---------------------------------------------------------------------------
// A plan, as a tile
// ---------------------------------------------------------------------------

/**
 * One plan in the grid: what it covers, what it costs, and the button.
 *
 * Two lines carry the whole shape of the product before the price — the visit
 * count and the length — because a plan bought without understanding the count
 * is a refund request in about six weeks. The price says "starts at" only when
 * it is honest to: what a plan costs here is what it costs.
 */
function PlanTile({
  plan,
  names,
  signInHref,
  onBought,
}: {
  plan: CatalogPlan
  names: Map<string, string>
  /** Set when nobody is signed in — the button becomes the way in. */
  signInHref?: Route
  onBought: () => void
}) {
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const saving =
    plan.compareAt && plan.compareAt > plan.price
      ? plan.compareAt - plan.price
      : 0
  const months = Math.round(plan.durationDays / 30)
  const art = APPLIANCE_ART[plan.applianceIds[0] ?? ''] ?? '/banners/shield.svg'
  const covers = plan.applianceIds
    .map((id) => names.get(id) ?? id)
    .join(', ')

  async function pay(): Promise<void> {
    if (busy) return
    setBusy(true)
    try {
      const outcome = await buy({ kind: 'plan', planId: plan.id })
      if (outcome.kind === 'bought') {
        toast.show(`${plan.name} is running. It covers your next visit.`, {
          tone: 'success',
        })
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
    <article className="flex h-full flex-col">
      <span className="relative block aspect-square overflow-hidden rounded-card bg-surface">
        {saving > 0 ? (
          <span className="absolute top-0 left-0 z-10 rounded-card bg-success px-2 py-1 text-[11px] leading-none font-bold text-bg">
            {formatPaise(saving)} off
          </span>
        ) : null}
        <Image
          src={art}
          alt=""
          fill
          sizes="(min-width: 640px) 240px, 45vw"
          className="object-contain p-6"
        />
      </span>

      <h3 className="mt-3 text-base leading-snug font-bold text-ink">
        {plan.name}
      </h3>
      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted">
        {covers}
      </p>

      <div className="mt-auto flex items-end justify-between gap-2 pt-3">
        <span className="min-w-0">
          <span className="block text-xs text-muted">Pay once</span>
          <span className="block text-base font-bold tabular-nums text-ink">
            {formatPaise(plan.price)}
          </span>
          {saving > 0 ? (
            <span className="block text-xs text-muted line-through tabular-nums">
              {formatPaise(plan.compareAt ?? 0)}
            </span>
          ) : null}
        </span>

        {signInHref ? (
          <Link
            href={signInHref}
            className="flex shrink-0 flex-col items-center rounded-card border border-brand px-3 py-1.5 text-center text-sm font-bold text-brand transition-colors duration-[var(--duration-fast)] hover:bg-brand-soft"
          >
            Buy
            <span className="text-[11px] leading-tight font-medium text-muted">
              {plan.visitsIncluded} visits
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => void pay()}
            disabled={busy}
            className="flex shrink-0 flex-col items-center rounded-card border border-brand px-3 py-1.5 text-center text-sm font-bold text-brand transition-colors duration-[var(--duration-fast)] hover:bg-brand-soft disabled:opacity-60"
          >
            {busy ? 'Opening' : 'Buy'}
            <span className="text-[11px] leading-tight font-medium text-muted">
              {plan.visitsIncluded} visits · {months} mo
            </span>
          </button>
        )}
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// The membership
// ---------------------------------------------------------------------------

/**
 * What Plus gives, and the two lengths it is sold in.
 *
 * Somebody already on it is told so and sold nothing — a shopfront that keeps
 * pitching a thing you have bought is a shopfront that has not been read.
 */
function PlusBlock({
  member,
  signInHref,
  onBought,
}: {
  member: boolean
  signInHref?: Route
  onBought: () => void
}) {
  const [chosen, setChosen] = useState<MembershipOptionId>('plus-yearly')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const option =
    MEMBERSHIP_OPTIONS.find((each) => each.id === chosen) ??
    MEMBERSHIP_OPTIONS[0]
  const compareAt = 'compareAt' in option ? option.compareAt : undefined
  const saving = compareAt && compareAt > option.price ? compareAt - option.price : 0

  async function pay(): Promise<void> {
    if (busy) return
    setBusy(true)
    try {
      const outcome = await buy({ kind: 'membership', optionId: chosen })
      if (outcome.kind === 'bought') {
        toast.show('Plus is running. The visit fee is off your next booking.', {
          tone: 'success',
        })
        onBought()
      }
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
    <Card className="overflow-hidden">
      <ul className="flex flex-col gap-2.5 p-4">
        {MEMBERSHIP_BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2">
            <Check
              className="mt-0.5 size-4 shrink-0 text-success"
              aria-hidden="true"
            />
            <span className="text-sm text-ink">{benefit}</span>
          </li>
        ))}
      </ul>

      {member ? (
        <p className="flex items-center gap-2 border-t border-border bg-success-soft px-4 py-3 text-sm font-semibold text-success">
          <BadgeCheck className="size-4 shrink-0" aria-hidden="true" />
          You are on Plus. It is already coming off your bookings.
        </p>
      ) : (
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            {MEMBERSHIP_OPTIONS.map((each) => {
              const on = each.id === chosen
              return (
                <button
                  key={each.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setChosen(each.id)}
                  className={cn(
                    'min-h-11 flex-1 rounded-card border px-3 text-sm font-semibold',
                    'transition-colors duration-[var(--duration-fast)]',
                    on
                      ? 'border-brand bg-brand-soft text-brand'
                      : 'border-border text-ink hover:border-brand'
                  )}
                >
                  {each.label}
                  <span className="block text-xs font-medium tabular-nums text-muted">
                    {formatPaise(each.price)}
                  </span>
                </button>
              )
            })}
          </div>

          {saving > 0 ? (
            <p className="mt-3 flex items-center gap-1.5 rounded-card bg-success-soft px-3 py-2 text-xs font-semibold text-success">
              <Ticket className="size-3.5 shrink-0" aria-hidden="true" />
              Saves {formatPaise(saving)} against twelve months bought one at a
              time
            </p>
          ) : null}

          {signInHref ? (
            <Link
              href={signInHref}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-pill bg-brand text-base font-semibold text-bg hover:bg-brand-deep"
            >
              Sign in to buy
            </Link>
          ) : (
            <Button
              className="mt-4"
              fullWidth
              loading={busy}
              onClick={() => void pay()}
            >
              Buy Plus for {formatPaise(option.price)}
            </Button>
          )}

          <p className="mt-3 text-xs text-muted">
            It does not renew itself. When it runs out, it stops.
          </p>
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// The smaller blocks
// ---------------------------------------------------------------------------

function OfferCard({
  icon: Icon,
  title,
  detail,
}: {
  icon: LucideIcon
  title: string
  detail: string
}) {
  return (
    <div className="flex h-full flex-col rounded-card bg-surface p-4">
      <Icon className="size-5 text-brand" aria-hidden="true" />
      <h3 className="mt-3 text-base leading-snug font-bold text-ink">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{detail}</p>
    </div>
  )
}

/**
 * The three things a plan does not change.
 *
 * Every line is elsewhere in the app as a screen or a step, not a claim made
 * for this page: the quote before the work, the warranty, the invoice.
 */
const VISIT_POINTS: ReadonlyArray<{
  key: string
  title: string
  detail: string
  art: string
}> = [
  {
    key: 'quote',
    title: 'Quoted before it is started',
    detail:
      'The fault is named, the repair is priced in writing, and nothing begins until you approve it.',
    art: '/banners/estimate.svg',
  },
  {
    key: 'warranty',
    title: 'Covered after we leave',
    detail:
      'Every repair carries a service warranty, with what it covers and until when kept on the booking.',
    art: '/banners/shield.svg',
  },
  {
    key: 'support',
    title: 'Somebody to ask',
    detail:
      'Support is in the app at any hour, against the booking rather than a reference number you have to find.',
    art: '/banners/chat.svg',
  },
]

/** The grey rule the rest of the app uses between unrelated blocks. */
function Band() {
  return <div aria-hidden="true" className="-mx-4 my-8 h-2 bg-surface" />
}
