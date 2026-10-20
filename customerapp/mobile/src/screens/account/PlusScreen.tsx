import { useState } from 'react'
import { View } from 'react-native'
import { BadgePercent, CalendarClock, Crown, Headset, ReceiptText, ShieldCheck } from 'lucide-react-native'
import { formatPaise } from '@app/shared'

import { Header, Screen, StickyCTA } from '@/components/Screen'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { ConfirmModal } from '@/components/ui/Overlay'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { brand } from '@/config/brand'
import { useAuth } from '@/lib/auth'
import { buyPlus, usePlus, type Membership, type PlusPlan } from '@/lib/data/profile'
import { cn } from '@/lib/cn'

/**
 * Plus, the way UC sells it: what it gets you, what it costs, one button.
 * The annual cover plans live here too — Plans was merged into Plus, so a
 * customer looking for "pay once a year" finds both on the same page.
 *
 * A member is not sold to: the page says until when they are covered, and
 * the plans stay below as a price list. Signed out, everything is readable
 * and the button becomes the way in, because a price list behind a login is
 * a shop with the shutters down.
 */

const BENEFITS = [
  { icon: BadgePercent, title: '15% off every booking', detail: 'Taken off the bill before you pay, on every service.' },
  { icon: ReceiptText, title: 'No booking fee', detail: 'The visit fee is waived for as long as you are a member.' },
  { icon: CalendarClock, title: 'Priority slots', detail: 'First pick of the busy evening and weekend times.' },
  { icon: Headset, title: 'Faster support', detail: 'Your calls and chats go to the front of the queue.' },
] as const

const SIGN_IN_HREF = '/login?next=%2Fprofile%2Fmembership'

export function PlusScreen() {
  const { user } = useAuth()
  const toast = useToast()
  const plus = usePlus()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [paying, setPaying] = useState(false)

  const plans = plus.data?.plans ?? []
  const membership = user ? (plus.data?.membership ?? null) : null
  const memberships = plans.filter((p) => p.kind === 'membership')
  const covers = plans.filter((p) => p.kind === 'cover')
  const selected = plans.find((p) => p.id === selectedId) ?? memberships[0] ?? covers[0] ?? null

  async function pay(): Promise<void> {
    if (!selected) return
    setPaying(true)
    try {
      await buyPlus(selected)
      setConfirming(false)
      toast.show(selected.kind === 'cover' ? `${selected.name} is active` : `Welcome to ${brand.name} Plus`, { tone: 'success' })
      plus.reload()
    } catch {
      toast.show('The payment did not go through. You have not been charged.', { tone: 'error' })
    } finally {
      setPaying(false)
    }
  }

  const footer =
    !plus.data || membership || !selected ? null : (
      <StickyCTA
        detail={
          <>
            <Text className="text-lg font-bold text-ink tabular-nums">{formatPaise(selected.price)}</Text>
            <Text numberOfLines={1} className="text-xs text-muted">
              {selected.name}
            </Text>
          </>
        }
      >
        {user ? (
          <Button size="lg" onPress={() => setConfirming(true)} className="px-8">
            {selected.kind === 'cover' ? 'Buy cover' : 'Join Plus'}
          </Button>
        ) : (
          <Button size="lg" href={SIGN_IN_HREF} className="px-6">
            Log in to join
          </Button>
        )}
      </StickyCTA>
    )

  return (
    <Screen
      header={<Header title={`${brand.name} Plus`} showBack backFallback="/profile" />}
      footer={footer}
      onRefresh={plus.reload}
      refreshing={plus.refreshing}
    >
      <Hero />

      {plus.status === 'loading' && !plus.data ? (
        <SkeletonGroup label="Loading plans" className="mt-6 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </SkeletonGroup>
      ) : plus.status === 'error' && !plus.data ? (
        <ErrorState className="mt-10" onRetry={plus.reload} retrying={plus.refreshing} />
      ) : plans.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={Crown}
          title="No plans on sale right now"
          description="Plus opens again soon. Your bookings are not affected."
        />
      ) : (
        <>
          {membership ? <MemberCard membership={membership} plan={plans.find((p) => p.id === membership.planId)} /> : null}

          <Heading title="What you get" />
          <View className="rounded-card border border-border px-4">
            {BENEFITS.map((benefit, index) => (
              <View key={benefit.title} className={cn('flex-row items-start gap-3 py-3.5', index < BENEFITS.length - 1 && 'border-b border-border')}>
                <View className="size-9 items-center justify-center rounded-full bg-brand-soft">
                  <Icon as={benefit.icon} className="size-4 text-brand" />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-ink">{benefit.title}</Text>
                  <Text className="mt-0.5 text-sm text-muted">{benefit.detail}</Text>
                </View>
              </View>
            ))}
          </View>

          {memberships.length ? (
            <PlanGroup title="Membership plans" plans={memberships} selectedId={membership ? null : selected?.id} onSelect={setSelectedId} />
          ) : null}
          {covers.length ? (
            <PlanGroup
              title="Annual cover plans"
              subtitle="Pay once for the year's servicing on one part of your home."
              plans={covers}
              selectedId={membership ? null : selected?.id}
              onSelect={setSelectedId}
            />
          ) : null}

          <Text className="mt-6 text-xs leading-[18px] text-muted">
            Plans do not renew on their own. When one runs out you can buy it again; nothing is charged without you.
          </Text>
        </>
      )}

      <ConfirmModal
        open={confirming && Boolean(selected)}
        onClose={() => (paying ? undefined : setConfirming(false))}
        onConfirm={() => void pay()}
        title={selected ? `Pay ${formatPaise(selected.price)}` : 'Pay'}
        description={selected ? `${selected.name}, for ${selected.days} days from today.` : undefined}
        confirmLabel={selected ? `Pay ${formatPaise(selected.price)}` : 'Pay'}
        loading={paying}
      />
    </Screen>
  )
}

function Hero() {
  return (
    <View className="mt-4 overflow-hidden rounded-card bg-night p-5">
      <View className="size-11 items-center justify-center rounded-full bg-white/15">
        <Icon as={Crown} filled className="size-5 text-art-gold" />
      </View>
      <Text accessibilityRole="header" className="mt-3 text-2xl font-bold text-white">
        {`${brand.name} Plus`}
      </Text>
      <Text className="mt-1 text-sm leading-[20px] text-white/80">
        Save on every booking, skip the booking fee and get the slots everyone wants.
      </Text>
    </View>
  )
}

function MemberCard({ membership, plan }: { membership: Membership; plan: PlusPlan | undefined }) {
  return (
    <View className="mt-4 flex-row items-start gap-3 rounded-card border border-success/20 bg-success-soft p-4">
      <Icon as={ShieldCheck} className="mt-0.5 size-5 text-success" />
      <View className="min-w-0 flex-1">
        <Text className="text-base font-semibold text-ink">{`You are a member until ${longDate(membership.until)}`}</Text>
        <Text className="mt-0.5 text-sm text-muted">
          {plan ? `${plan.name}. Your benefits apply at checkout on their own.` : 'Your benefits apply at checkout on their own.'}
        </Text>
      </View>
    </View>
  )
}

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-3 mt-8">
      <Text accessibilityRole="header" className="text-xl font-bold text-ink">
        {title}
      </Text>
      {subtitle ? <Text className="mt-1 text-sm text-muted">{subtitle}</Text> : null}
    </View>
  )
}

function PlanGroup({
  title,
  subtitle,
  plans,
  selectedId,
  onSelect,
}: {
  title: string
  subtitle?: string
  plans: PlusPlan[]
  /** Null when nothing can be bought (already a member): the cards are a price list. */
  selectedId: string | null | undefined
  onSelect: (id: string) => void
}) {
  const buyable = selectedId !== null
  return (
    <View>
      <Heading title={title} subtitle={subtitle} />
      <View className="gap-3" accessibilityRole={buyable ? 'radiogroup' : undefined}>
        {plans.map((plan) => {
          const on = plan.id === selectedId
          return (
            <Tappable
              key={plan.id}
              onPress={() => onSelect(plan.id)}
              disabled={!buyable}
              accessibilityRole={buyable ? 'radio' : undefined}
              accessibilityState={buyable ? { selected: on } : undefined}
              className={cn('rounded-card border p-4', on ? 'border-brand bg-brand-soft' : 'border-border')}
            >
              <View className="flex-row items-start gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="text-base font-semibold text-ink">{plan.name}</Text>
                  <Text className="mt-0.5 text-xs text-muted">{`${plan.days} days`}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-base font-bold text-ink tabular-nums">{formatPaise(plan.price)}</Text>
                  {plan.compareAt ? (
                    <Text className="text-xs text-muted line-through tabular-nums">{formatPaise(plan.compareAt)}</Text>
                  ) : null}
                </View>
                {buyable ? (
                  <View className={cn('mt-0.5 size-5 items-center justify-center rounded-full border-2', on ? 'border-brand' : 'border-border')}>
                    {on ? <View className="size-2.5 rounded-full bg-brand" /> : null}
                  </View>
                ) : null}
              </View>
              <View className="mt-3 gap-1">
                {plan.benefits.map((benefit) => (
                  <Text key={benefit} className="text-sm text-muted">{`· ${benefit}`}</Text>
                ))}
              </View>
            </Tappable>
          )
        })}
      </View>
    </View>
  )
}

/** "20 Oct 2027" from a YYYY-MM-DD key. */
function longDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
