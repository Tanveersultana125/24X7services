import { View } from 'react-native'
import { formatPaise } from '@app/shared'
import type { Service, ServiceVariant } from '@app/shared/catalog-v2'

import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/Overlay'
import { Text } from '@/components/ui/Text'
import { qtyOf, type CartState } from '@/lib/data/cart'
import { cn } from '@/lib/cn'
import { AddControl } from './cartActions'

/**
 * A service's options in a sheet: "1 AC / 2 ACs / 3 ACs", "Honey / Rica".
 * Each option has its own stepper, so two bathrooms and a sofa can go in from
 * one sheet, and the footer keeps the running total for this service.
 */
export function OptionsSheet({
  service,
  cart,
  onChange,
  onClose,
}: {
  service: Service | null
  cart: CartState
  onChange: (service: Service, variant: ServiceVariant, qty: number) => void
  onClose: () => void
}) {
  const variants = service?.variants ?? []
  const total = service
    ? variants.reduce((sum, v) => sum + v.price * qtyOf(cart.items, service.id, v.id), 0)
    : 0

  return (
    <BottomSheet
      open={service !== null}
      onClose={onClose}
      title={service?.name ?? ''}
      description="Choose an option"
      footer={
        <Button fullWidth size="lg" onPress={onClose}>
          {total > 0 ? `Done · ${formatPaise(total)}` : 'Done'}
        </Button>
      }
    >
      {service
        ? variants.map((variant, index) => {
            const qty = qtyOf(cart.items, service.id, variant.id)
            return (
              <View
                key={variant.id}
                className={cn('flex-row items-center gap-3 py-4', index < variants.length - 1 && 'border-b border-border')}
              >
                <View className="min-w-0 flex-1">
                  <Text className="text-base font-semibold text-ink">{variant.label}</Text>
                  <View className="mt-0.5 flex-row flex-wrap items-baseline gap-x-2">
                    <Text className="text-sm font-medium text-ink tabular-nums">{formatPaise(variant.price)}</Text>
                    {variant.compareAt ? (
                      <Text className="text-xs text-muted line-through tabular-nums">{formatPaise(variant.compareAt)}</Text>
                    ) : null}
                    {variant.durationMinutes ? (
                      <Text className="text-xs text-muted">{`· ${variant.durationMinutes} mins`}</Text>
                    ) : null}
                  </View>
                </View>
                <AddControl
                  qty={qty}
                  label={`${service.name}, ${variant.label}`}
                  onAdd={() => onChange(service, variant, 1)}
                  onIncrease={() => onChange(service, variant, qty + 1)}
                  onDecrease={() => onChange(service, variant, qty - 1)}
                />
              </View>
            )
          })
        : null}
    </BottomSheet>
  )
}
