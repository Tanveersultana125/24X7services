import { View } from 'react-native'
import type { PriceBreakdown } from '@app/shared'
import { Text } from '@/components/ui/Text'
import { formatPaise } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * The money, itemised. Every figure comes from `booking.price`, which the
 * server computed — nothing here adds anything up, because a total the client
 * calculated is a total that can disagree with the one being charged.
 *
 * GST is shown carved out of the total rather than added on top, which is what
 * "no hidden charges" has to mean in practice: the number at the bottom is the
 * number that leaves the customer's account.
 */

export interface PriceSummaryProps {
  price: PriceBreakdown
  /** Shown on the review step, before anything has been charged. */
  showDue?: boolean
  className?: string
}

export function PriceSummary({ price, showDue = true, className }: PriceSummaryProps) {
  const hasTax = price.cgst + price.sgst + price.igst > 0

  return (
    <View className={cn('rounded-card border border-border bg-bg p-4', className)}>
      <View className="gap-2.5">
        <Row label="Visit & inspection" value={price.visitFee} />

        {price.additional > 0 ? <Row label="Approved repairs" value={price.additional} /> : null}

        {price.discount > 0 ? <Row label="Discount" value={-price.discount} /> : null}

        {hasTax ? (
          <>
            <Row label="Taxable value" value={price.taxable} muted />
            {price.igst > 0 ? (
              <Row label="IGST" value={price.igst} muted />
            ) : (
              <>
                <Row label="CGST" value={price.cgst} muted />
                <Row label="SGST" value={price.sgst} muted />
              </>
            )}
          </>
        ) : null}

        <View className="mt-1 flex-row items-baseline justify-between border-t border-border pt-3">
          <Text className="text-base font-semibold text-ink">Total</Text>
          <Text className="text-xl font-bold text-ink">{formatPaise(price.total)}</Text>
        </View>

        {showDue && price.paid > 0 ? (
          <>
            <Row label="Paid" value={price.paid} />
            <View className="flex-row items-baseline justify-between">
              <Text className="text-sm font-semibold text-ink">Due</Text>
              <Text className="text-base font-bold text-ink">{formatPaise(price.due)}</Text>
            </View>
          </>
        ) : null}
      </View>

      {hasTax ? (
        <Text className="mt-3 text-xs text-muted">
          All taxes included. A GST invoice is issued when the job is complete.
        </Text>
      ) : null}
    </View>
  )
}

function Row({ label, value, muted = false }: { label: string; value: number; muted?: boolean }) {
  return (
    <View className="flex-row items-baseline justify-between gap-4">
      <Text className={cn('text-sm', muted ? 'text-muted' : 'text-ink')}>{label}</Text>
      <Text className={cn('text-sm tabular-nums', muted ? 'text-muted' : 'font-medium text-ink')}>
        {value < 0 ? `− ${formatPaise(-value)}` : formatPaise(value)}
      </Text>
    </View>
  )
}
