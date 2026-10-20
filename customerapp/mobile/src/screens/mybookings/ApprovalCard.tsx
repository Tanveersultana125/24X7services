import { useState } from 'react'
import { View } from 'react-native'
import { Wrench } from 'lucide-react-native'
import { formatPaise } from '@app/shared'

import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { Text } from '@/components/ui/Text'
import { respondToApproval, useApproval } from '@/lib/data/bookingActions'

/**
 * Extra work the professional found, waiting on the customer. Each part and
 * its price, the total it adds, and the two answers. Nothing is fitted
 * without an Approve; Not now still pays the visit and nothing more.
 */
export function ApprovalCard({ bookingId, onAnswered }: { bookingId: string; onAnswered: () => void }) {
  const approval = useApproval(bookingId)
  const toast = useToast()
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)

  if (approval.status === 'loading') return <Skeleton className="mt-4 h-40" />
  const data = approval.data
  if (!data || data.answer) return null
  const extra = data.items.reduce((sum, item) => sum + item.price, 0)

  async function answer(approve: boolean): Promise<void> {
    setBusy(approve ? 'approve' : 'reject')
    try {
      await respondToApproval(bookingId, approve)
      toast.show(approve ? 'Approved. Your professional will carry on.' : 'Declined. Only the visit is billed.', { tone: 'success' })
      onAnswered()
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'That did not go through. Please try again.', { tone: 'error' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <View className="mt-4 rounded-card border border-warning bg-warning-soft p-4">
      <View className="flex-row items-center gap-2">
        <Icon as={Wrench} className="size-5 text-warning" />
        <Text accessibilityRole="header" className="text-base font-bold text-ink">
          Extra work needs your OK
        </Text>
      </View>
      <Text className="mt-2 text-sm text-ink">{data.note}</Text>
      <View className="mt-3 rounded-card bg-bg p-3">
        {data.items.map((item) => (
          <View key={item.name} className="flex-row justify-between gap-3 py-1">
            <Text className="flex-1 text-sm text-ink">{item.name}</Text>
            <Text className="text-sm text-ink tabular-nums">{formatPaise(item.price)}</Text>
          </View>
        ))}
        <View className="mt-2 flex-row justify-between border-t border-border pt-2">
          <Text className="text-sm font-bold text-ink">Adds to your bill</Text>
          <Text className="text-sm font-bold text-ink tabular-nums">{formatPaise(extra)}</Text>
        </View>
      </View>
      <View className="mt-4 flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={() => void answer(false)} loading={busy === 'reject'} disabled={busy !== null}>
          Not now
        </Button>
        <Button className="flex-1" onPress={() => void answer(true)} loading={busy === 'approve'} disabled={busy !== null}>
          Approve
        </Button>
      </View>
    </View>
  )
}
