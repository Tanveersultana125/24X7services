import { View } from 'react-native'
import { Briefcase, Home, MapPin, Pencil, Trash2 } from 'lucide-react-native'
import type { Address } from '@app/shared'
import { Card, CardButton } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Chip'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'

/**
 * A saved address, either as something to pick during booking or as a row in
 * the address book.
 *
 * `serviceable` is passed in rather than worked out here: whether a pincode is
 * covered is a backend answer, and a card that guessed it would show a
 * different verdict from the one createBooking gives.
 */

const icons = {
  home: Home,
  office: Briefcase,
  other: MapPin,
} as const

export interface AddressCardProps {
  address: Address
  onSelect?: (address: Address) => void
  selected?: boolean
  onEdit?: (address: Address) => void
  onDelete?: (address: Address) => void
  isDefault?: boolean
  /** False greys the card and blocks selection, with a reason underneath. */
  serviceable?: boolean
  className?: string
}

export function AddressCard({
  address,
  onSelect,
  selected = false,
  onEdit,
  onDelete,
  isDefault = false,
  serviceable = true,
  className,
}: AddressCardProps) {
  const LabelIcon = icons[address.label]
  const name =
    address.label === 'other' ? (address.customLabel ?? 'Other') : address.label === 'home' ? 'Home' : 'Office'

  const body = (
    <View className="flex-row items-start gap-3 p-4">
      <Icon as={LabelIcon} className="mt-0.5 size-4 text-muted" />
      <View className="min-w-0 flex-1">
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="text-sm font-semibold text-ink">{name}</Text>
          {isDefault ? <Tag>Default</Tag> : null}
        </View>
        <Text className="mt-1 text-sm leading-[22px] text-muted">
          {address.flat}, {address.area}
          {address.landmark ? `, near ${address.landmark}` : ''}
          {'\n'}
          {address.city} {address.pincode}
        </Text>
        {!serviceable ? (
          <Text className="mt-2 text-xs font-medium text-warning">We do not service this pincode yet.</Text>
        ) : null}
      </View>
    </View>
  )

  if (onSelect) {
    return (
      <CardButton
        onPress={() => onSelect(address)}
        selected={selected}
        disabled={!serviceable}
        ariaLabel={`${name}, ${address.area}, ${address.pincode}`}
        {...(className ? { className } : {})}
      >
        {body}
      </CardButton>
    )
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {body}
      {onEdit || onDelete ? (
        <View className="flex-row gap-1 border-t border-border px-2 py-1">
          {onEdit ? (
            <Tappable
              onPress={() => onEdit(address)}
              className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-card active:bg-surface active:opacity-100"
            >
              <Icon as={Pencil} className="size-4 text-ink" />
              <Text className="text-sm font-medium text-ink">Edit</Text>
            </Tappable>
          ) : null}
          {onDelete ? (
            <Tappable
              onPress={() => onDelete(address)}
              className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-card active:bg-error-soft active:opacity-100"
            >
              <Icon as={Trash2} className="size-4 text-error" />
              <Text className="text-sm font-medium text-error">Delete</Text>
            </Tappable>
          ) : null}
        </View>
      ) : null}
    </Card>
  )
}
