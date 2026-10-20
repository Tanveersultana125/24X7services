import { FlatList, View } from 'react-native'
import { ArrowDownLeft, ArrowUpRight, Sparkles, Wallet as WalletIcon } from 'lucide-react-native'
import { formatPaise } from '@app/shared'

import { SignInPrompt } from '@/components/ProfileShell'
import { Header, Screen } from '@/components/Screen'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Text } from '@/components/ui/Text'
import { useAuth } from '@/lib/auth'
import { useWallet, type Wallet, type WalletEntry } from '@/lib/data/profile'
import { cn } from '@/lib/cn'

/**
 * The wallet: what is in it, and every rupee that came in or went out. There
 * is nothing to do here — credits come off the next booking on their own —
 * so the screen is a balance and a statement, and says as much rather than
 * offering a button that would only explain the same thing.
 */
export function WalletScreen() {
  const { user, ready } = useAuth()
  return (
    <Screen scroll={false} header={<Header title="Wallet" showBack backFallback="/profile" />}>
      {!ready ? null : user ? (
        <WalletBody />
      ) : (
        <View className="px-4">
          <SignInPrompt
            icon={WalletIcon}
            title="Your wallet"
            description="Refunds, cashback and referral rewards land here and come off your next booking. Log in to see yours."
          />
        </View>
      )}
    </Screen>
  )
}

function WalletBody() {
  const wallet = useWallet()

  if (wallet.status === 'loading' && !wallet.data) {
    return (
      <SkeletonGroup label="Loading your wallet" className="gap-3 px-4 pt-4">
        <Skeleton className="h-36" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </SkeletonGroup>
    )
  }
  if (wallet.status === 'error' && !wallet.data) {
    return <ErrorState className="mt-10 px-4" onRetry={wallet.reload} retrying={wallet.refreshing} />
  }

  const data = wallet.data ?? { balance: 0, entries: [] }
  return (
    <FlatList
      data={data.entries}
      keyExtractor={(entry) => entry.id}
      contentContainerClassName="px-4 pb-10 pt-4"
      ListHeaderComponent={<BalanceCard wallet={data} />}
      renderItem={({ item, index }) => <EntryRow entry={item} last={index === data.entries.length - 1} />}
      ListEmptyComponent={
        <EmptyState
          className="mt-6"
          icon={WalletIcon}
          title="No payments yet"
          description="Refunds, cashback and referral rewards will show here as they come in."
          action={{ label: 'Refer a friend', href: '/profile/refer' }}
        />
      }
    />
  )
}

function BalanceCard({ wallet }: { wallet: Wallet }) {
  return (
    <View>
      <View className="rounded-card bg-brand p-5">
        <Text className="text-sm font-medium text-white/80">Wallet balance</Text>
        <Text className="mt-1 text-4xl font-bold text-white tabular-nums">{formatPaise(wallet.balance)}</Text>
        <View className="mt-4 flex-row items-start gap-2 rounded-card bg-white/15 px-3 py-2.5">
          <Icon as={Sparkles} className="mt-0.5 size-4 text-white" />
          <Text className="flex-1 text-xs leading-[18px] text-white">
            Credits apply automatically at checkout and never expire.
          </Text>
        </View>
      </View>
      {wallet.entries.length ? (
        <Text accessibilityRole="header" className="mb-1 mt-8 text-xl font-bold text-ink">
          Payment history
        </Text>
      ) : null}
    </View>
  )
}

function EntryRow({ entry, last }: { entry: WalletEntry; last: boolean }) {
  const credit = entry.amount > 0
  return (
    <View
      className={cn('flex-row items-center gap-3 py-3.5', !last && 'border-b border-border')}
      accessible
      accessibilityLabel={`${entry.title}, ${credit ? 'added' : 'spent'} ${formatPaise(Math.abs(entry.amount))}, ${shortDate(entry.at)}`}
    >
      <View className={cn('size-10 items-center justify-center rounded-full', credit ? 'bg-success-soft' : 'bg-surface')}>
        <Icon as={credit ? ArrowDownLeft : ArrowUpRight} className={cn('size-4', credit ? 'text-success' : 'text-muted')} />
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-sm font-semibold text-ink">
          {entry.title}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 text-xs text-muted">
          {`${entry.detail} · ${shortDate(entry.at)}`}
        </Text>
      </View>
      <Text className={cn('text-sm font-bold tabular-nums', credit ? 'text-success' : 'text-ink')}>
        {`${credit ? '+' : '−'}${formatPaise(Math.abs(entry.amount))}`}
      </Text>
    </View>
  )
}

/** "12 Oct 2026" */
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
