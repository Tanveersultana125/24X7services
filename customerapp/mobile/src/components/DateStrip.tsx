import { useEffect, useRef, useState } from 'react'
import { ScrollView, useWindowDimensions } from 'react-native'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { dayOfMonth, relativeDateLabel, weekdayShort } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * The horizontal row of dates above the slot grid.
 *
 * It is a radio group rather than a list of buttons: exactly one date is
 * chosen at a time, and that is what the announcement should reflect.
 */

export interface DateStripDay {
  date: string
  /** False when every window that day is full, which greys the chip out. */
  hasAvailability: boolean
}

export interface DateStripProps {
  days: readonly DateStripDay[]
  value?: string
  onChange: (date: string) => void
  className?: string
}

/** w-16 plus the gap-2 between chips. */
const CHIP = 64
const GAP = 8

export function DateStrip({ days, value, onChange, className }: DateStripProps) {
  const railRef = useRef<ScrollView>(null)
  const [railWidth, setRailWidth] = useState(0)
  const { width: screenWidth } = useWindowDimensions()

  // A date chosen earlier in the flow can be a week along the rail: bring it
  // to the middle, the way scrollIntoView({ inline: 'center' }) did.
  useEffect(() => {
    if (!value) return
    const index = days.findIndex((d) => d.date === value)
    if (index < 0) return
    const visible = railWidth || screenWidth
    const x = Math.max(0, index * (CHIP + GAP) + CHIP / 2 - visible / 2)
    railRef.current?.scrollTo({ x, animated: false })
  }, [value, days, railWidth, screenWidth])

  return (
    <ScrollView
      ref={railRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      accessibilityLabel="Choose a date"
      onLayout={(event) => setRailWidth(event.nativeEvent.layout.width)}
      className={cn('-mt-1', className)}
      contentContainerClassName="gap-2 pb-1 pt-1"
    >
      {days.map((day) => {
        const selected = day.date === value
        const tone = !day.hasAvailability ? 'text-muted' : selected ? 'text-white' : 'text-ink'
        return (
          <Tappable
            key={day.date}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled: !day.hasAvailability }}
            disabled={!day.hasAvailability}
            onPress={() => onChange(day.date)}
            accessibilityLabel={
              day.hasAvailability ? relativeDateLabel(day.date) : `${relativeDateLabel(day.date)}, fully booked`
            }
            className={cn(
              'min-h-16 w-16 shrink-0 items-center justify-center gap-0.5 rounded-card border',
              !day.hasAvailability
                ? 'border-border bg-surface'
                : selected
                  ? 'border-brand bg-brand'
                  : 'border-border bg-bg active:border-brand active:opacity-100'
            )}
          >
            <Text className={cn('text-[11px] uppercase tracking-wide opacity-70', tone)}>
              {weekdayShort(day.date)}
            </Text>
            <Text className={cn('text-lg font-bold leading-[20px]', tone)}>{dayOfMonth(day.date)}</Text>
          </Tappable>
        )
      })}
    </ScrollView>
  )
}
