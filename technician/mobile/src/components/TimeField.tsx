import { useEffect, useRef, useState } from 'react'
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Clock } from 'lucide-react-native'
import { cn } from '@/lib/cn'
import { Button, Icon, Sheet, Tappable, Text, inputClass, useColor } from './ui'

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const pad = (n: number) => String(n).padStart(2, '0')

type Parts = { h: number; m: number; pm: boolean }

/** "20:30" → { h: 8, m: 30, pm: true } */
function parse(v: string): Parts {
  const [hh = 0, mm = 0] = v.split(':').map(Number)
  return { h: hh % 12 || 12, m: mm, pm: hh >= 12 }
}

function format({ h, m, pm }: Parts) {
  return `${pad((h % 12) + (pm ? 12 : 0))}:${pad(m)}`
}

function display(v: string) {
  const { h, m, pm } = parse(v)
  return `${h}:${pad(m)} ${pm ? 'PM' : 'AM'}`
}

/**
 * A time input that opens a bottom sheet with scroll wheels, the picker people
 * already know from their phone's clock — drawn in the app's own type and
 * colours rather than the platform's time dialog.
 */
export function TimeField({
  label: title,
  value,
  onChange,
  compact,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  /** A small button with no visible label, for rows of times. */
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Parts>(() => parse(value))
  // A minute saved off the 5-minute grid gets its own row. Keyed to the saved
  // value, not the draft, so the wheel doesn't grow or shrink mid-scroll.
  const saved = parse(value).m
  const minutes = MINUTES.includes(saved) ? MINUTES : [...MINUTES, saved].sort((a, b) => a - b)

  return (
    <View>
      {!compact && <Text className="mb-1.5 text-sm font-bold text-ink-2">{title}</Text>}
      <Tappable
        accessibilityLabel={compact ? `${title}: ${display(value)}` : undefined}
        onPress={() => {
          setDraft(parse(value))
          setOpen(true)
        }}
        className={
          compact
            ? 'h-10 w-full flex-row items-center justify-center rounded-lg border border-line-strong bg-card px-2'
            : cn(inputClass, 'flex-row items-center justify-between')
        }
      >
        <Text numberOfLines={1} className={cn('num font-bold text-ink', compact ? 'text-[13.5px]' : 'text-base')}>
          {display(value)}
        </Text>
        {!compact && <Icon as={Clock} className="size-4 text-muted" />}
      </Tappable>

      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        <View className="relative mx-auto w-full max-w-xs">
          {/* The band the chosen row sits in. */}
          <View
            pointerEvents="none"
            className="absolute inset-x-0 rounded-xl border border-line bg-canvas"
            style={{ top: ROW * ((VISIBLE - 1) / 2), height: ROW }}
          />
          <View className="relative flex-row items-center">
            <View className="flex-1">
              <Wheel label="Hour" items={HOURS.map(String)} index={HOURS.indexOf(draft.h)} onIndex={(i) => setDraft((d) => ({ ...d, h: HOURS[i] ?? d.h }))} />
            </View>
            <Text importantForAccessibility="no" className="num pb-0.5 text-2xl font-extrabold text-ink">
              :
            </Text>
            <View className="flex-1">
              <Wheel label="Minute" items={minutes.map(pad)} index={minutes.indexOf(draft.m)} onIndex={(i) => setDraft((d) => ({ ...d, m: minutes[i] ?? d.m }))} />
            </View>
            <View className="flex-1">
              <Wheel label="AM or PM" items={['AM', 'PM']} index={draft.pm ? 1 : 0} onIndex={(i) => setDraft((d) => ({ ...d, pm: i === 1 }))} />
            </View>
          </View>
        </View>

        <View className="mt-5 flex-row gap-2.5">
          <Button variant="secondary" size="lg" className="flex-1" onPress={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="lg"
            className="flex-[1.6]"
            onPress={() => {
              onChange(format(draft))
              setOpen(false)
            }}
          >
            Set {display(format(draft))}
          </Button>
        </View>
      </Sheet>
    </View>
  )
}

const ROW = 48
const VISIBLE = 5

/**
 * One scroll-snapping column. The row that settles in the middle is the value;
 * tapping a row moves it there too.
 */
function Wheel({ label, items, index, onIndex }: { label: string; items: string[]; index: number; onIndex: (i: number) => void }) {
  const ref = useRef<ScrollView>(null)
  const card = useColor('text-card')
  const clear = /^#[0-9a-f]{6}$/i.test(card) ? `${card}00` : 'rgba(255,255,255,0)'
  const clamp = (i: number) => Math.max(0, Math.min(items.length - 1, i))

  // Start on the saved value. Only on mount: afterwards the scroll position
  // is the source of truth and `index` follows it.
  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollTo({ y: Math.max(index, 0) * ROW, animated: false }), 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const go = (i: number) => {
    const next = clamp(i)
    ref.current?.scrollTo({ y: next * ROW, animated: true })
    onIndex(next)
  }

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = clamp(Math.round(e.nativeEvent.contentOffset.y / ROW))
    if (i !== index) onIndex(i)
  }

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: items[index] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => go(e.nativeEvent.actionName === 'increment' ? index + 1 : index - 1)}
      style={{ height: ROW * VISIBLE }}
      className="overflow-hidden rounded-xl"
    >
      <ScrollView
        ref={ref}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        onMomentumScrollEnd={settle}
        onScrollEndDrag={(e) => {
          // A slow drag that stops without a fling has no momentum phase.
          if (Math.abs(e.nativeEvent.velocity?.y ?? 0) < 0.05) settle(e)
        }}
        contentContainerStyle={{ paddingVertical: ROW * ((VISIBLE - 1) / 2) }}
      >
        {items.map((it, i) => (
          <Tappable
            key={it}
            accessibilityRole="button"
            accessibilityState={{ selected: i === index }}
            onPress={() => go(i)}
            className="w-full items-center justify-center active:opacity-100"
            style={{ height: ROW }}
          >
            <Text
              className={cn(
                'num',
                i === index ? 'text-[26px] font-extrabold text-ink' : Math.abs(i - index) === 1 ? 'text-xl font-bold text-ink-2' : 'text-lg font-semibold text-faint'
              )}
            >
              {it}
            </Text>
          </Tappable>
        ))}
      </ScrollView>
      {/* The web's fade mask: rows dissolve towards the wheel's top and bottom. */}
      <LinearGradient pointerEvents="none" colors={[card, clear]} className="absolute inset-x-0 top-0" style={{ height: ROW * 1.6 }} />
      <LinearGradient pointerEvents="none" colors={[clear, card]} className="absolute inset-x-0 bottom-0" style={{ height: ROW * 1.6 }} />
    </View>
  )
}
