import { View } from 'react-native'
import { formatPaise } from '@app/shared'
import type { PriceBreakup as Breakup } from '@app/shared/catalog-v2'

import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'

/**
 * The bill, line by line: items, the coupon, the fee, and what is paid. Used
 * by the cart and again at checkout, so the two always show the same numbers
 * in the same order.
 */
export function PriceBreakup({ price, couponCode, className }: { price: Breakup; couponCode?: string | null; className?: string }) {
  return (
    <View className={cn('rounded-card border border-border p-4', className)}>
      <Text accessibilityRole="header" className="mb-3 text-lg font-bold text-ink">
        Payment summary
      </Text>
      <Row label="Item total" value={formatPaise(price.items)} />
      {price.discount > 0 ? (
        <Row label={couponCode ? `Coupon (${couponCode})` : 'Discount'} value={`−${formatPaise(price.discount)}`} tone="success" />
      ) : null}
      {price.fees > 0 ? <Row label="Taxes and fee" value={formatPaise(price.fees)} /> : null}
      <View className="my-3 h-px bg-border" />
      <Row label="Total" value={formatPaise(price.total)} strong />
      {price.discount > 0 ? (
        <View className="mt-3 rounded-card bg-success-soft px-3 py-2">
          <Text className="text-sm font-semibold text-success">{`You are saving ${formatPaise(price.discount)} on this booking`}</Text>
        </View>
      ) : null}
    </View>
  )
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'success' }) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-1">
      <Text className={cn('text-sm', strong ? 'font-bold text-ink' : 'text-muted')}>{label}</Text>
      <Text className={cn('text-sm tabular-nums', strong ? 'text-base font-bold text-ink' : 'text-ink', tone === 'success' && 'text-success')}>
        {value}
      </Text>
    </View>
  )
}
