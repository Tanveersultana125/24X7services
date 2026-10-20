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
import { useLocation } from '@/lib/useLocation'

/**
 * A new address, in a sheet over the address step. The pincode and city
 * start from the location the customer already chose, since that is almost
 * always where the work is. Checked against the same schema the backend
 * uses, field by field.
 */

const LABELS: { value: AddressLabel; text: string }[] = [
  { value: 'home', text: 'Home' },
  { value: 'work', text: 'Work' },
  { value: 'other', text: 'Other' },
]

type Errors = Partial<Record<'line1' | 'city' | 'pincode', string>>

export function AddressSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (address: Address) => void }) {
  const { location } = useLocation()
  const toast = useToast()
  const [label, setLabel] = useState<AddressLabel>('home')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState(location?.city ?? '')
  const [pincode, setPincode] = useState(location?.pincode ?? '')
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
      const saved = await addAddress(parsed.data)
      onSaved(saved)
      setLine1('')
      setLine2('')
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
      title="Add a new address"
      footer={
        <Button fullWidth size="lg" onPress={() => void save()} loading={saving}>
          Save and use this address
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
