import { FlatList, View } from 'react-native'
import { Copy, Gift, Share2, Users } from 'lucide-react-native'
import { formatPaise } from '@app/shared'

import { SignInPrompt } from '@/components/ProfileShell'
import { Header, Screen } from '@/components/Screen'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState, ToneBadge } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { brand } from '@/config/brand'
import { useAuth } from '@/lib/auth'
import { useReferral, type Referral } from '@/lib/data/profile'
import { copyText, shareText } from '@/lib/share'
import { cn } from '@/lib/cn'

/**
 * Refer and earn: what a friend is worth, your code, and who has used it.
 *
 * The promise is worded the way the reward actually pays — once the friend's
 * first booking is finished, not when they sign up — so the headline and the
 * wallet entry that follows it never disagree. One Share button hands the
 * message to the system sheet; Copy is beside the code for everyone who would
 * rather paste it into the one chat they had in mind.
 */

type Invite = Referral['invited'][number]

export function ReferScreen() {
  const { user, ready } = useAuth()
  return (
    <Screen scroll={false} header={<Header title="Refer and earn" showBack backFallback="/profile" />}>
      {!ready ? null : user ? (
        <ReferBody />
      ) : (
        <View className="px-4">
          <SignInPrompt
            icon={Gift}
            title="Your referral code"
            description="Refer a friend and you both get credits once their first booking is finished. Log in for your code."
          />
        </View>
      )}
    </Screen>
  )
}

function ReferBody() {
  const referral = useReferral()

  if (referral.status === 'loading' && !referral.data) {
    return (
      <SkeletonGroup label="Loading your referral code" className="gap-3 px-4 pt-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-16" />
      </SkeletonGroup>
    )
  }
  if (referral.status === 'error' || !referral.data) {
    return <ErrorState className="mt-10 px-4" onRetry={referral.reload} retrying={referral.refreshing} />
  }

  const data = referral.data
  return (
    <FlatList
      data={data.invited}
      keyExtractor={(invite) => `${invite.name}:${invite.at}`}
      contentContainerClassName="px-4 pb-10 pt-4"
      ListHeaderComponent={<ReferHeader referral={data} />}
      renderItem={({ item, index }) => <InviteRow invite={item} last={index === data.invited.length - 1} />}
      ListEmptyComponent={
        <EmptyState
          className="mt-2"
          icon={Users}
          title="No invites yet"
          description="Friends who use your code show here, and so does the reward when their first job is done."
        />
      }
    />
  )
}

function ReferHeader({ referral }: { referral: Referral }) {
  const toast = useToast()
  const reward = formatPaise(referral.reward)

  async function copy(): Promise<void> {
    const outcome = await copyText(referral.code)
    toast.show(outcome === 'copied' ? 'Copied' : 'Could not copy the code.', { tone: outcome === 'copied' ? 'success' : 'error' })
  }

  async function share(): Promise<void> {
    const message = `Book home services on ${brand.name} with my code ${referral.code} and get ${reward} off your first booking.`
    const outcome = await shareText(message, `Join me on ${brand.name}`, brand.appUrl)
    if (outcome === 'copied') toast.show('Invite copied. Paste it anywhere.', { tone: 'success' })
    else if (outcome === 'failed') toast.show('Could not open sharing. Copy the code instead.', { tone: 'error' })
  }

  const steps = [
    { title: 'Share your code', detail: 'Send it to friends who have not booked with us yet.' },
    { title: 'They book a service', detail: `They get ${reward} off their first booking with your code.` },
    { title: 'You both get rewarded', detail: `When their job is finished, ${reward} lands in your wallet.` },
  ]

  return (
    <View>
      <View className="items-center rounded-card bg-brand-soft px-5 py-6">
        <View className="size-14 items-center justify-center rounded-full bg-bg">
          <Icon as={Gift} className="size-6 text-brand" />
        </View>
        <Text accessibilityRole="header" className="mt-3 text-center text-2xl font-bold text-ink">
          {`Get ${reward} for every friend`}
        </Text>
        <Text className="mt-1 text-center text-sm text-muted">Paid to your wallet once their first booking is finished.</Text>

        <View className="mt-5 w-full flex-row items-center gap-2 rounded-card border border-dashed border-brand bg-bg py-1 pl-4 pr-1">
          <Text accessibilityLabel={`Your code ${referral.code}`} className="min-w-0 flex-1 text-lg font-bold tracking-[2px] text-ink">
            {referral.code}
          </Text>
          <Tappable
            onPress={() => void copy()}
            accessibilityLabel="Copy your code"
            className="min-h-11 flex-row items-center gap-1.5 rounded-pill px-3 active:bg-surface"
          >
            <Icon as={Copy} className="size-4 text-brand" />
            <Text className="text-sm font-bold text-brand">Copy</Text>
          </Tappable>
        </View>
        <Button fullWidth size="lg" onPress={() => void share()} iconLeft={<Icon as={Share2} className="size-5 text-white" />} className="mt-3">
          Share invite
        </Button>
      </View>

      <Text accessibilityRole="header" className="mb-3 mt-8 text-xl font-bold text-ink">
        How it works
      </Text>
      <View className="gap-4">
        {steps.map((step, index) => (
          <View key={step.title} className="flex-row items-start gap-3">
            <View className="size-8 items-center justify-center rounded-full bg-brand">
              <Text className="text-sm font-bold text-white">{String(index + 1)}</Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-semibold text-ink">{step.title}</Text>
              <Text className="mt-0.5 text-sm text-muted">{step.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text accessibilityRole="header" className="mb-1 mt-8 text-xl font-bold text-ink">
        Your invites
      </Text>
    </View>
  )
}

function InviteRow({ invite, last }: { invite: Invite; last: boolean }) {
  const rewarded = invite.status === 'rewarded'
  return (
    <View className={cn('min-h-14 flex-row items-center gap-3 py-3', !last && 'border-b border-border')}>
      <View className="size-10 items-center justify-center rounded-full bg-surface">
        <Text className="text-sm font-bold text-ink">{invite.name.slice(0, 1)}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-sm font-semibold text-ink">
          {invite.name}
        </Text>
        <Text className="mt-0.5 text-xs text-muted">{`Joined ${shortDate(invite.at)}`}</Text>
      </View>
      <ToneBadge tone={rewarded ? 'success' : 'warning'} label={rewarded ? 'Rewarded' : 'Joined'} />
    </View>
  )
}

/** "16 Oct" from a YYYY-MM-DD key. */
function shortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
