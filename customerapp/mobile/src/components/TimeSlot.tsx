import type { SlotOption } from '@app/shared'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { formatSlotWindow } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * One bookable window. "Filling fast" is the honest reading of a window with
 * 20% or less of its capacity left — it is pressure the customer can act on,
 * not a number invented to create urgency, and an unavailable window says so
 * plainly instead of disappearing.
 */

export interface TimeSlotProps {
  slot: SlotOption
  selected?: boolean
  onSelect: (slot: SlotOption) => void
  className?: string
}

export function TimeSlot({ slot, selected = false, onSelect, className }: TimeSlotProps) {
  const unavailable = slot.availability === 'unavailable'
  const label = formatSlotWindow(slot.start, slot.end)
  const tone = unavailable ? 'text-muted' : selected ? 'text-white' : 'text-ink'

  return (
    <Tappable
      onPress={() => onSelect(slot)}
      disabled={unavailable}
      accessibilityState={{ selected, disabled: unavailable }}
      accessibilityLabel={
        unavailable ? `${label}, unavailable` : slot.availability === 'limited' ? `${label}, filling fast` : label
      }
      className={cn(
        'min-h-16 w-full items-center justify-center gap-0.5 rounded-card border px-3 py-2',
        unavailable
          ? 'border-border bg-surface'
          : selected
            ? 'border-brand bg-brand'
            : 'border-border bg-bg active:border-brand active:opacity-100',
        className
      )}
    >
      <Text className={cn('text-sm font-semibold', tone)}>{label}</Text>
      {unavailable ? (
        <Text className={cn('text-[11px] leading-[16px]', tone)}>Unavailable</Text>
      ) : slot.availability === 'limited' ? (
        <Text className={cn('text-[11px] font-medium leading-[16px]', selected ? 'text-white/80' : 'text-warning')}>
          Filling fast
        </Text>
      ) : null}
    </Tappable>
  )
}
