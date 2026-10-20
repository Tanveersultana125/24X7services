import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { Briefcase, Home, MapPin, Plus } from 'lucide-react-native'
import type { Address } from '@app/shared/catalog-v2'

import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useAddresses } from '@/lib/data/account'
import { setCheckoutAddress, useCheckoutDraft } from '@/lib/data/booking'
import { cn } from '@/lib/cn'
import { AddressSheet } from './AddressSheet'
import { StepFrame, StepHeading } from './StepFrame'

/**
 * Step 2: where the work happens. Saved addresses to pick from, the default
 * picked already, and a new one added in a sheet without leaving the step.
 */
export function AddressScreen() {
  const addresses = useAddresses()
  const draft = useCheckoutDraft()
  const [adding, setAdding] = useState(false)

  const list = addresses.data ?? []
  // The default is chosen for them until they choose otherwise.
  const selected = draft.address ?? list.find((a) => a.isDefault) ?? null

  function next(): void {
    if (!selected) return
    setCheckoutAddress(selected)
    router.push('/checkout/slot')
  }

  return (
    <StepFrame
      step={2}
      title="Where should we come?"
      action={{ label: selected ? 'Continue' : 'Choose an address', onPress: next, disabled: !selected }}
    >
      <StepHeading>Saved addresses</StepHeading>
      {addresses.status === 'loading' ? (
        <SkeletonGroup label="Loading addresses" className="gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </SkeletonGroup>
      ) : addresses.status === 'error' ? (
        <ErrorState onRetry={addresses.reload} retrying={addresses.refreshing} />
      ) : (
        <View className="gap-3" accessibilityRole="radiogroup">
          {list.length === 0 ? <Text className="text-sm text-muted">No saved addresses yet. Add one below.</Text> : null}
          {list.map((address) => (
            <AddressOption
              key={address.id}
              address={address}
              selected={selected?.id === address.id}
              onPress={() => setCheckoutAddress(address)}
            />
          ))}
        </View>
      )}

      <Tappable
        onPress={() => setAdding(true)}
        className="mt-4 min-h-14 flex-row items-center gap-3 rounded-card border border-dashed border-brand px-4 active:bg-brand-soft active:opacity-100"
      >
        <Icon as={Plus} className="size-5 text-brand" />
        <Text className="text-base font-semibold text-brand">Add a new address</Text>
      </Tappable>

      <AddressSheet
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={(address) => {
          setCheckoutAddress(address)
          setAdding(false)
          addresses.reload()
        }}
      />
    </StepFrame>
  )
}

function AddressOption({ address, selected, onPress }: { address: Address; selected: boolean; onPress: () => void }) {
  const icon = address.label === 'home' ? Home : address.label === 'work' ? Briefcase : MapPin
  return (
    <Tappable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className={cn(
        'flex-row items-start gap-3 rounded-card border p-4 active:opacity-90',
        selected ? 'border-brand bg-brand-soft' : 'border-border'
      )}
    >
      <Icon as={icon} className={cn('mt-0.5 size-5', selected ? 'text-brand' : 'text-muted')} />
      <View className="min-w-0 flex-1">
        <Text className="text-base font-semibold capitalize text-ink">{address.label}</Text>
        <Text className="mt-0.5 text-sm text-muted">
          {[address.line1, address.line2, `${address.city} ${address.pincode}`].filter(Boolean).join(', ')}
        </Text>
      </View>
      <View className={cn('mt-1 size-5 items-center justify-center rounded-full border-2', selected ? 'border-brand' : 'border-border')}>
        {selected ? <View className="size-2.5 rounded-full bg-brand" /> : null}
      </View>
    </Tappable>
  )
}
