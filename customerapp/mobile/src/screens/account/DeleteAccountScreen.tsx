import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { CalendarX, Crown, MapPinOff, UserX, Wallet, type LucideIcon } from 'lucide-react-native'

import { ProfileShell, SignInPrompt } from '@/components/ProfileShell'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { ConfirmModal } from '@/components/ui/Overlay'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { deleteAccount, usePlus, useWallet } from '@/lib/data/profile'
import { cn } from '@/lib/cn'
import { formatPaise } from '@/lib/format'

/**
 * Leaving, said plainly. The screen lists what goes with the account using
 * the customer's own numbers — this balance, this membership — because
 * "your wallet balance" is easy to wave past and "₹325" is not. Then one
 * question, why, and one more chance to stop before it happens.
 *
 * Nothing here is styled to talk anyone out of it. The button is red because
 * the act cannot be undone, not to make it look hard.
 */

const REASONS = [
  'I do not need home services any more',
  'I have a second account',
  'The prices are too high',
  'I had a bad experience with a booking',
  'I am worried about my privacy',
  'Something else',
]

export function DeleteAccountScreen() {
  return (
    <ProfileShell
      title="Delete account"
      signedOut={
        <SignInPrompt
          icon={UserX}
          title="Delete your account"
          description="Log in to the account you want to delete, and we will show you what goes with it."
        />
      }
    >
      {() => <DeleteFlow />}
    </ProfileShell>
  )
}

function DeleteFlow() {
  const toast = useToast()
  const wallet = useWallet()
  const plus = usePlus()
  const [reason, setReason] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function confirm(): Promise<void> {
    if (!reason) return
    setDeleting(true)
    try {
      await deleteAccount(reason)
      setConfirming(false)
      toast.show('Your account has been deleted.', { tone: 'success' })
      router.replace('/login')
    } catch {
      toast.show('We could not delete your account. Please try again.', { tone: 'error' })
      setDeleting(false)
    }
  }

  if (wallet.status === 'loading' || plus.status === 'loading') {
    return (
      <SkeletonGroup label="Loading your account" className="mt-6 gap-3">
        <Skeleton className="h-56" />
        <Skeleton className="h-72" />
      </SkeletonGroup>
    )
  }

  if (wallet.status === 'error' || plus.status === 'error') {
    return (
      <ErrorState
        onRetry={() => {
          wallet.reload()
          plus.reload()
        }}
        retrying={wallet.refreshing || plus.refreshing}
      />
    )
  }

  const balance = wallet.data?.balance ?? 0
  const membership = plus.data?.membership ?? null
  const plan = membership ? plus.data?.plans.find((p) => p.id === membership.planId) : undefined

  const losses: { icon: LucideIcon; title: string; detail: string }[] = [
    { icon: CalendarX, title: 'Your booking history', detail: 'Past and upcoming bookings, invoices and reviews.' },
    { icon: MapPinOff, title: 'Your saved addresses', detail: 'You would type them in again on a new account.' },
    {
      icon: Wallet,
      title: balance > 0 ? `${formatPaise(balance)} in your wallet` : 'Your wallet',
      detail: balance > 0 ? 'Forfeited. Wallet money cannot be paid out.' : 'Any cashback you earn later is lost too.',
    },
    {
      icon: Crown,
      title: plan ? plan.name : 'Plus membership',
      detail: membership ? `Ends now, not on ${membership.until}. No refund for the days left.` : 'Benefits and any plan you hold end with it.',
    },
  ]

  return (
    <View className="pt-4">
      <View className="rounded-card border border-error/30 bg-error-soft p-4">
        <Text accessibilityRole="header" className="text-base font-semibold text-ink">
          This cannot be undone
        </Text>
        <Text className="mt-1 text-sm text-muted">Deleting your account removes all of this for good:</Text>
        <View className="mt-3 gap-3">
          {losses.map((loss) => (
            <View key={loss.title} className="flex-row items-start gap-3">
              <View className="size-9 items-center justify-center rounded-full bg-bg">
                <Icon as={loss.icon} className="size-4 text-error" />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-semibold text-ink">{loss.title}</Text>
                <Text className="mt-0.5 text-sm text-muted">{loss.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Text accessibilityRole="header" className="mb-1 mt-6 text-base font-semibold text-ink">
        Why are you leaving?
      </Text>
      <Text className="mb-2 text-sm text-muted">One tap. It helps us fix what went wrong.</Text>
      <View accessibilityRole="radiogroup">
        {REASONS.map((r) => (
          <Tappable
            key={r}
            onPress={() => setReason(r)}
            accessibilityRole="radio"
            accessibilityState={{ selected: reason === r }}
            className="min-h-12 flex-row items-center gap-3 border-b border-border py-2"
          >
            <View className={cn('size-5 items-center justify-center rounded-full border-2', reason === r ? 'border-brand' : 'border-border')}>
              {reason === r ? <View className="size-2.5 rounded-full bg-brand" /> : null}
            </View>
            <Text className="flex-1 text-sm text-ink">{r}</Text>
          </Tappable>
        ))}
      </View>

      <Button variant="danger" fullWidth size="lg" className="mt-6" disabled={!reason} onPress={() => setConfirming(true)}>
        Delete my account
      </Button>
      <Button variant="ghost" fullWidth className="mt-2" onPress={() => router.back()}>
        Keep my account
      </Button>

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void confirm()}
        title="Delete your account?"
        description={
          balance > 0
            ? `Your bookings, addresses and ${formatPaise(balance)} wallet balance go for good. You will be logged out.`
            : 'Your bookings, addresses and membership go for good. You will be logged out.'
        }
        confirmLabel="Delete for good"
        cancelLabel="Keep it"
        destructive
        loading={deleting}
      />
    </View>
  )
}
