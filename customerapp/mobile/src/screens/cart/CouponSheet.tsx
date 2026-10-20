import { useState } from 'react'
import { View } from 'react-native'
import { TicketPercent } from 'lucide-react-native'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { BottomSheet } from '@/components/ui/Overlay'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useCoupons, type Coupon } from '@/lib/data/account'
import { couponDiscount, couponProblem } from '@/lib/data/pricing'
import { formatPaise } from '@app/shared'
import { cn } from '@/lib/cn'

/**
 * Offers for this cart: a box for a code someone already has, then every
 * live coupon with what it would save. A coupon that does not fit stays in
 * the list, greyed, with the reason, so "why can't I use this" is answered
 * on the spot rather than by a failed tap.
 */
export function CouponSheet({
  open,
  onClose,
  itemsTotal,
  rootCategoryId,
  onApply,
}: {
  open: boolean
  onClose: () => void
  itemsTotal: number
  rootCategoryId: string | null
  onApply: (coupon: Coupon) => void
}) {
  const coupons = useCoupons()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | undefined>()

  function applyTyped(): void {
    const coupon = coupons.data?.find((c) => c.code === code.trim().toUpperCase())
    if (!coupon) return setError('That code is not valid, or has expired.')
    const problem = couponProblem(coupon, itemsTotal, rootCategoryId)
    if (problem) return setError(problem)
    onApply(coupon)
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Coupons and offers">
      <View className="flex-row items-end gap-2">
        <View className="flex-1">
          <Input
            label="Have a code?"
            value={code}
            onChangeText={(value) => {
              setCode(value.toUpperCase())
              setError(undefined)
            }}
            error={error}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={applyTyped}
            placeholder="Enter coupon code"
          />
        </View>
        <Button variant="secondary" onPress={applyTyped} className={cn('shrink-0', error && 'mb-7')}>
          Apply
        </Button>
      </View>

      <View className="mt-6 gap-3">
        {coupons.status === 'loading' ? (
          <Skeleton className="h-24" />
        ) : coupons.status === 'error' ? (
          <ErrorState onRetry={coupons.reload} retrying={coupons.refreshing} />
        ) : (
          (coupons.data ?? []).map((coupon) => {
            const problem = couponProblem(coupon, itemsTotal, rootCategoryId)
            return (
              <View key={coupon.code} className={cn('rounded-card border border-border p-4', problem && 'opacity-60')}>
                <View className="flex-row items-start gap-3">
                  <Icon as={TicketPercent} className="mt-0.5 size-5 text-brand" />
                  <View className="min-w-0 flex-1">
                    <Text className="text-base font-semibold text-ink">{coupon.title}</Text>
                    <Text className="mt-0.5 text-xs text-muted">{coupon.description}</Text>
                    <Text className="mt-2 self-start rounded-pill border border-dashed border-brand px-2 py-0.5 text-xs font-bold tracking-[0.7px] text-brand">
                      {coupon.code}
                    </Text>
                    <Text className={cn('mt-2 text-xs', problem ? 'text-muted' : 'font-semibold text-success')}>
                      {problem ?? `You save ${formatPaise(couponDiscount(coupon, itemsTotal))}`}
                    </Text>
                  </View>
                  <Tappable
                    onPress={() => onApply(coupon)}
                    disabled={Boolean(problem)}
                    accessibilityLabel={`Apply ${coupon.code}`}
                    className="min-h-11 justify-center px-2"
                  >
                    <Text className={cn('text-sm font-bold', problem ? 'text-muted' : 'text-brand')}>Apply</Text>
                  </Tappable>
                </View>
              </View>
            )
          })
        )}
      </View>
    </BottomSheet>
  )
}
