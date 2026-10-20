import { useState } from 'react'
import { View } from 'react-native'
import { addressSchema, type Address, type AddressLabel } from '@app/shared/catalog-v2'

import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Input } from '@/components/ui/Field'
import { BottomSheet } from '@/components/ui/Overlay'
import { Text } from '@/components/ui/Text'
import { addAddress } from '@/lib/data/account'
import { updateAddress } from '@/lib/data/profile'
import { useLocation } from '@/lib/useLocation'

/**
 * One address, new or being corrected, in a sheet over the address book.
 * The same fields and the same schema as the checkout's AddressSheet, so an
 * address saved here is one checkout will take without a second look.
 *
 * Mount it with a `key` per address being edited: the fields start from
 * whatever it is given (a new one starts from the chosen location, as in
 * checkout) and are the customer's from then on.
 */

const LABELS: { value: AddressLabel; text: string }[] = [
  { value: 'home', text: 'Home' },
  { value: 'work', text: 'Work' },
  { value: 'other', text: 'Other' },
]

type Errors = Partial<Record<'line1' | 'city' | 'pincode', string>>

export function AddressFormSheet({
  open,
  address,
  onClose,
  onSaved,
}: {
  open: boolean
  /** The address being edited, or null for a new one. */
  address: Address | null
  onClose: () => void
  onSaved: () => void
}) {
  const { location } = useLocation()
  const toast = useToast()
  const [label, setLabel] = useState<AddressLabel>(address?.label ?? 'home')
  const [line1, setLine1] = useState(address?.line1 ?? '')
  const [line2, setLine2] = useState(address?.line2 ?? '')
  const [city, setCity] = useState(address?.city ?? location?.city ?? '')
  const [pincode, setPincode] = useState(address?.pincode ?? location?.pincode ?? '')
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  async function save(): Promise<void> {
    const draft = { label, line1: line1.trim(), line2: line2.trim() || undefined, city: city.trim(), pincode: pincode.trim() }
    const parsed = addressSchema.omit({ id: true, isDefault: true }).safeParse(draft)
    if (!parsed.success) {
      const next: Errors = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof Errors
        if (field === 'line1') next.line1 = 'Enter your house or flat number'
        if (field === 'city') next.city = 'Enter your city'
        if (field === 'pincode') next.pincode = issue.message
      }
      setErrors(next)
      return
    }
    setSaving(true)
    try {
      // An edit keeps its id, its default flag and any pin on the map.
      if (address) await updateAddress({ ...address, ...parsed.data })
      else await addAddress(parsed.data)
      toast.show(address ? 'Address updated.' : 'Address saved.', { tone: 'success' })
      onSaved()
    } catch {
      toast.show('We could not save the address. Please try again.', { tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      dismissable={!saving}
      title={address ? 'Edit address' : 'Add a new address'}
      footer={
        <Button fullWidth size="lg" onPress={() => void save()} loading={saving}>
          {address ? 'Save changes' : 'Save address'}
        </Button>
      }
    >
      <View className="gap-4">
        <Input
          label="House / flat number and building"
          required
          value={line1}
          onChangeText={(v) => {
            setLine1(v)
            setErrors((e) => ({ ...e, line1: undefined }))
          }}
          error={errors.line1}
          autoComplete="street-address"
          placeholder="Flat 302, Lotus Residency"
        />
        <Input label="Street, area, landmark" value={line2} onChangeText={setLine2} placeholder="Road No. 12, Banjara Hills" />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              label="City"
              required
              value={city}
              onChangeText={(v) => {
                setCity(v)
                setErrors((e) => ({ ...e, city: undefined }))
              }}
              error={errors.city}
            />
          </View>
          <View className="flex-1">
            <Input
              label="Pincode"
              required
              value={pincode}
              onChangeText={(v) => {
                setPincode(v.replace(/\D/g, '').slice(0, 6))
                setErrors((e) => ({ ...e, pincode: undefined }))
              }}
              error={errors.pincode}
              keyboardType="number-pad"
              autoComplete="postal-code"
            />
          </View>
        </View>
        <View>
          <Text className="mb-2 text-sm font-medium text-ink">Save as</Text>
          <View className="flex-row gap-2">
            {LABELS.map((option) => (
              <Chip key={option.value} selected={label === option.value} onPress={() => setLabel(option.value)}>
                {option.text}
              </Chip>
            ))}
          </View>
        </View>
      </View>
    </BottomSheet>
  )
}
