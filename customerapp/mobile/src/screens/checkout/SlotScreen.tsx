import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { router } from 'expo-router'

import { Chip } from '@/components/ui/Chip'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { setCheckoutSlot, useCheckoutDraft, useSlots, type SlotOption } from '@/lib/data/booking'
import { cn } from '@/lib/cn'
import { StepFrame, StepHeading } from './StepFrame'
import { dayOfMonth, partOfDay, time12, weekday } from './when'

/**
 * Step 3: when. A week of days across the top, then that day's start times
 * by part of the day. Times that are taken, or too soon for anyone to get
 * there, stay on screen greyed out, so a full morning reads as full rather
 * than as missing.
 */
export function SlotScreen() {
  const slots = useSlots()
  const draft = useCheckoutDraft()
  const days = slots.data ?? []

  const [date, setDate] = useState<string | null>(draft.slot?.date ?? null)
  const [start, setStart] = useState<string | null>(draft.slot?.start ?? null)

  // The first day with anything open, until the customer picks one.
  const activeDate = date ?? days.find((d) => d.slots.some((s) => s.available))?.date ?? null
  const day = days.find((d) => d.date === activeDate)
  const chosenStart = start && day?.slots.some((s) => s.start === start && s.available) ? start : null

  function next(): void {
    if (!activeDate || !chosenStart) return
    setCheckoutSlot({ date: activeDate, start: chosenStart })
    router.push('/checkout/pay')
  }

  const groups = (['Morning', 'Afternoon', 'Evening'] as const)
    .map((part) => ({ part, slots: (day?.slots ?? []).filter((s) => partOfDay(s.start) === part) }))
    .filter((g) => g.slots.length > 0)

  return (
    <StepFrame
      step={3}
      title="When should we come?"
      action={{ label: chosenStart ? 'Continue' : 'Pick a time', onPress: next, disabled: !chosenStart }}
    >
      {slots.status === 'loading' ? (
        <SkeletonGroup label="Loading slots" className="gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-40" />
        </SkeletonGroup>
      ) : slots.status === 'error' ? (
        <ErrorState className="mt-10" onRetry={slots.reload} retrying={slots.refreshing} />
      ) : (
        <>
          <StepHeading>Day</StepHeading>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pb-1" className="-mx-4 px-4">
            {days.map((d) => {
              const on = d.date === activeDate
              const open = d.slots.some((s) => s.available)
              return (
                <Tappable
                  key={d.date}
                  onPress={() => {
                    setDate(d.date)
                    setStart(null)
                  }}
                  disabled={!open}
                  accessibilityState={{ selected: on, disabled: !open }}
                  className={cn(
                    'h-20 w-16 items-center justify-center rounded-card border',
                    on ? 'border-brand bg-brand-soft' : 'border-border',
                    !open && 'opacity-40'
                  )}
                >
                  <Text className={cn('text-xs', on ? 'font-semibold text-brand' : 'text-muted')}>{weekday(d.date)}</Text>
                  <Text className={cn('mt-1 text-xl font-bold', on ? 'text-brand' : 'text-ink')}>{dayOfMonth(d.date)}</Text>
                </Tappable>
              )
            })}
          </ScrollView>

          <View className="mt-6">
            <StepHeading hint="The professional arrives within 30 minutes of the start time.">Start time</StepHeading>
            {groups.map((group) => (
              <View key={group.part} className="mb-4">
                <Text className="mb-2 text-sm font-semibold text-muted">{group.part}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {group.slots.map((slot) => (
                    <TimeChip key={slot.start} slot={slot} selected={slot.start === chosenStart} onPress={() => setStart(slot.start)} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </StepFrame>
  )
}

function TimeChip({ slot, selected, onPress }: { slot: SlotOption; selected: boolean; onPress: () => void }) {
  return (
    <Chip
      selected={selected}
      disabled={!slot.available}
      onPress={onPress}
      accessibilityLabel={`${time12(slot.start)}${slot.available ? '' : ', not available'}`}
      className="min-w-[96px] justify-center"
    >
      {time12(slot.start)}
    </Chip>
  )
}
