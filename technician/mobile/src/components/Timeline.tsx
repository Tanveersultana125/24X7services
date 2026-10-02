import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, { Easing, ReduceMotion, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { Check } from 'lucide-react-native'
import { cn } from '@/lib/cn'
import { time } from '@/lib/format'
import { STEP_LABEL, stepIndex } from '@/lib/status'
import { FLOW, type Job } from '@/lib/types'
import { Icon, Text } from './ui'

/** The nine steps of a job, with the time each one happened. */
export function Timeline({ job }: { job: Job }) {
  const current = job.status === 'closed' ? FLOW.length : stepIndex(job.status)
  return (
    <View accessibilityRole="list">
      {FLOW.map((step, i) => {
        const done = i < current || (job.status === 'closed' && i === FLOW.length - 1)
        const now = i === current
        const at = job.log[step]
        const last = i === FLOW.length - 1
        return (
          <View key={step} className={cn('relative flex-row gap-3', !last && 'pb-4')}>
            {!last && <View className={cn('absolute -bottom-1 left-[11px] top-6 w-0.5', done ? 'bg-success' : 'bg-line')} />}
            <View
              className={cn(
                'relative z-10 size-6 shrink-0 items-center justify-center rounded-full border-2',
                done && 'border-success bg-success',
                now && 'border-brand bg-card',
                !done && !now && 'border-line-strong bg-card'
              )}
            >
              {now && <PulseRing />}
              {done ? (
                <Icon as={Check} className="size-3.5 text-white" strokeWidth={3} />
              ) : (
                <Text className={cn('text-[10px] font-extrabold', now ? 'text-brand' : 'text-faint')}>{i + 1}</Text>
              )}
            </View>
            <View className="min-w-0 flex-1 flex-row items-baseline justify-between gap-2 pt-0.5">
              <Text className={cn('shrink text-sm', done ? 'font-bold text-ink' : now ? 'font-extrabold text-brand' : 'font-semibold text-faint')}>
                {STEP_LABEL[step]}
                {now && <Text className="text-[11px] font-bold uppercase tracking-wider text-brand/70">{'  · current'}</Text>}
              </Text>
              {at && <Text className="num shrink-0 text-xs font-semibold text-muted">{time(at)}</Text>}
            </View>
          </View>
        )
      })}
    </View>
  )
}

/** The web's `animate-pulse-ring`: a soft ring that swells out of the current step. */
function PulseRing() {
  const p = useSharedValue(0)
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease), reduceMotion: ReduceMotion.System }), -1, false)
    return () => cancelAnimation(p)
  }, [p])
  const style = useAnimatedStyle(() => ({ opacity: 1 - p.value, transform: [{ scale: 1 + p.value * 0.9 }] }))
  return <Animated.View pointerEvents="none" className="absolute -inset-0.5 rounded-full bg-brand/30" style={style} />
}

/** The same nine steps as a thin progress bar, for cards and headers. */
export function FlowBar({ job, className }: { job: Job; className?: string }) {
  const current = job.status === 'closed' ? FLOW.length : stepIndex(job.status)
  return (
    <View
      accessible
      accessibilityLabel={`Step ${Math.max(current, 0) + 1} of ${FLOW.length}`}
      className={cn('flex-row gap-1', className)}
    >
      {FLOW.map((s, i) => (
        <View key={s} className={cn('h-1.5 flex-1 rounded-full', i < current ? 'bg-success' : i === current ? 'bg-brand' : 'bg-line')} />
      ))}
    </View>
  )
}
