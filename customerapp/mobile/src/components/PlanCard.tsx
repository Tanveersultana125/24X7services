import { View } from 'react-native'
import type { Href } from 'expo-router'
import { CalendarClock, Check, Sparkles, Ticket } from 'lucide-react-native'
import {
  formatPaise,
  isPlanActive,
  planVisitsLeft,
  type CatalogPlan,
  type UserPlan,
} from '@app/shared'

import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Chip'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
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
function coverage(applianceIds: readonly string[], names: Map<string, string>): string {
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
    <View
      className={cn(
        'overflow-hidden rounded-card border border-border',
        live ? 'bg-bg' : 'bg-surface',
        className
      )}
    >
      <View className="flex-row items-start justify-between gap-3 p-4 pb-3">
        <View className="min-w-0 flex-1">
          <Text accessibilityRole="header" className="text-base font-bold text-ink">
            {plan.name}
          </Text>
          <Text className="mt-0.5 text-xs text-muted">
            {coverage(plan.applianceIds, applianceNames)}
          </Text>
        </View>
        <Tag className={live ? 'border-success/30 bg-success-soft' : undefined}>
          <Text className={cn('text-xs font-medium', live ? 'text-success' : 'text-ink')}>
            {live ? 'Active' : days <= 0 ? 'Expired' : 'All visits used'}
          </Text>
        </Tag>
      </View>

      <View className="px-4">
        <View className="flex-row items-end justify-between gap-3">
          <Text className="text-sm text-muted">
            <Text className="text-2xl font-bold text-ink tabular-nums">{left}</Text>
            <Text className="text-sm text-ink"> of {plan.visitsIncluded}</Text> visits left
          </Text>
          <Text className="shrink-0 text-xs text-muted tabular-nums">
            {days > 0 ? `${days} ${days === 1 ? 'day' : 'days'} left` : 'Ended'}
          </Text>
        </View>

        {/* The count, drawn. Hidden from the screen reader because the
            sentence above already says it. */}
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="mt-2 h-1.5 overflow-hidden rounded-pill bg-surface"
        >
          <View
            className={cn('h-full rounded-pill', live ? 'bg-brand' : 'bg-muted')}
            style={{ width: `${Math.min(100, Math.max(0, spent))}%` }}
          />
        </View>
      </View>

      <View className="flex-row items-center gap-1.5 px-4 py-3">
        <Icon as={CalendarClock} className="size-3.5 text-muted" />
        <Text className="flex-1 text-xs text-muted">
          {days > 0
            ? `Runs until ${formatDateTime(plan.expiresAt).split(',')[0]}`
            : `Ended ${formatDateTime(plan.expiresAt).split(',')[0]}`}
        </Text>
      </View>

      {live ? (
        <View className="border-t border-border bg-surface px-4 py-3">
          <Text className="text-xs text-muted">
            Book as usual — we take the visit fee off when the appliance is one this plan covers.
          </Text>
        </View>
      ) : null}
    </View>
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
  signInHref?: Href
  highlight?: boolean
  className?: string
}) {
  const saving = plan.compareAt && plan.compareAt > plan.price ? plan.compareAt - plan.price : 0

  return (
    <View
      className={cn(
        'relative overflow-hidden rounded-card border bg-bg',
        highlight ? 'border-brand shadow-sm' : 'border-border',
        className
      )}
    >
      {highlight ? (
        <View className="flex-row items-center gap-1.5 bg-brand px-4 py-1.5">
          <Icon as={Sparkles} className="size-3.5 text-white" />
          <Text className="text-xs font-bold uppercase tracking-[0.72px] text-white">Best value</Text>
        </View>
      ) : null}

      <View className="p-4">
        <View className="flex-row items-start justify-between gap-4">
          <View className="min-w-0 flex-1">
            <Text accessibilityRole="header" className="text-base font-bold text-ink">
              {plan.name}
            </Text>
            <Text className="mt-0.5 text-sm text-muted">{plan.tagline}</Text>
          </View>

          <View className="shrink-0 items-end">
            <Text className="text-xl font-bold text-ink tabular-nums">{formatPaise(plan.price)}</Text>
            {saving > 0 ? (
              <Text className="text-xs text-muted line-through tabular-nums">
                {formatPaise(plan.compareAt ?? 0)}
              </Text>
            ) : null}
          </View>
        </View>

        {/* What the plan is, before what it costs: visits, length, cover. */}
        <View className="mt-4 flex-row gap-2">
          <Figure
            term="Visits included"
            value={`${plan.visitsIncluded}`}
            hint={plan.visitsIncluded === 1 ? 'service' : 'services'}
          />
          <Figure term="Runs for" value={`${Math.round(plan.durationDays / 30)}`} hint="months" />
        </View>

        <Text className="mt-3 text-xs text-muted">
          Covers {coverage(plan.applianceIds, applianceNames)}
        </Text>

        <View className="mt-4 gap-2 border-t border-border pt-4">
          {plan.benefits.map((benefit) => (
            <View key={benefit} className="flex-row items-start gap-2">
              <Icon as={Check} className="mt-0.5 size-4 text-success" />
              <Text className="min-w-0 flex-1 text-sm text-ink">{benefit}</Text>
            </View>
          ))}
        </View>

        {saving > 0 ? (
          <View className="mt-4 flex-row items-center gap-1.5 rounded-card bg-success-soft px-3 py-2">
            <Icon as={Ticket} className="size-3.5 text-success" />
            <Text className="min-w-0 flex-1 text-xs font-semibold text-success">
              Saves {formatPaise(saving)} against booking the same visits one by one
            </Text>
          </View>
        ) : null}

        {onBuy ? (
          <Button
            className="mt-4"
            fullWidth
            variant={highlight ? 'primary' : 'secondary'}
            loading={busy}
            onPress={onBuy}
          >
            {`Buy for ${formatPaise(plan.price)}`}
          </Button>
        ) : signInHref ? (
          <Tappable
            href={signInHref}
            className={cn(
              'mt-4 h-12 w-full items-center justify-center rounded-pill active:opacity-100',
              highlight
                ? 'bg-brand active:bg-brand-deep'
                : 'border border-brand active:bg-brand-soft'
            )}
          >
            <Text className={cn('text-base font-semibold', highlight ? 'text-white' : 'text-brand')}>
              Sign in to buy
            </Text>
          </Tappable>
        ) : null}
      </View>
    </View>
  )
}

/** One of the two figures that say what a plan is before what it costs. */
function Figure({ term, value, hint }: { term: string; value: string; hint: string }) {
  return (
    <View className="min-w-0 flex-1 rounded-card bg-surface p-3">
      <Text className="text-xs text-muted">{term}</Text>
      <Text className="mt-0.5 text-lg font-bold text-ink">
        <Text className="text-lg font-bold text-ink tabular-nums">{value}</Text>{' '}
        <Text className="text-sm font-medium text-muted">{hint}</Text>
      </Text>
    </View>
  )
}
