import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Check, Loader2 } from 'lucide-react-native'
import type { Booking, BookingEvent, BookingStage } from '@app/shared'

import { BookingShell } from '@/components/BookingShell'
import { StatusTimeline } from '@/components/StatusTimeline'
import { JobOtpPanel } from '@/components/JobOtpPanel'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { STAGE_LABEL, STAGE_ORDER } from '@/lib/status'
import { cn } from '@/lib/cn'
import { BlockTitle } from '@/screens/bookings/parts'

/**
 * The job, as it happens.
 *
 * Four stages, in order, with the one underway marked. It is deliberately not a
 * percentage: nobody can say a repair is 40% done, and a bar that creeps
 * forward on a timer is a bar that lies when the job runs long.
 *
 * A stage the booking has passed is ticked, the current one spins, and the rest
 * wait. That is all a customer sitting in the next room needs from this screen —
 * that something is happening and roughly where it has got to.
 */

const STAGE_NOTE: Record<BookingStage, string> = {
  inspection: 'Your expert is looking at the appliance.',
  diagnosis: 'Working out what is causing the fault.',
  repair: 'Carrying out the work you approved.',
  testing: 'Checking it works before packing up.',
}

export default function ProgressScreen() {
  return (
    <BookingShell title="Job progress">
      {({ booking, events }) => <Progress booking={booking} events={events} />}
    </BookingShell>
  )
}

function Progress({ booking, events }: { booking: Booking; events: BookingEvent[] }) {
  const working = booking.status === 'in_progress' || booking.status === 'awaiting_approval'
  const currentIndex = booking.stage ? STAGE_ORDER.indexOf(booking.stage) : -1
  const finished = booking.status === 'completed'

  return (
    <>
      <Text className="mt-5 text-sm leading-[22px] text-muted">
        {finished
          ? 'This job is finished. Your invoice and warranty are on the booking.'
          : working
            ? 'Your expert is working on the appliance. Nothing is charged beyond the visit fee unless you approve it.'
            : 'Work has not started yet. This screen fills in once your expert begins.'}
      </Text>

      <View className="mt-5 gap-2">
        {STAGE_ORDER.map((stage, index) => {
          const done = finished || (currentIndex >= 0 && index < currentIndex)
          const current = working && index === currentIndex
          return (
            <Card key={stage} className={cn('flex-row items-start gap-3 p-4', current && 'border-ink')}>
              <View
                className={cn(
                  'size-6 shrink-0 items-center justify-center rounded-full border-2',
                  done || current ? 'border-ink' : 'border-border',
                  done && 'bg-ink'
                )}
              >
                {done ? (
                  <Icon as={Check} className="size-3.5 text-bg" strokeWidth={3} />
                ) : current ? (
                  <Spinner />
                ) : null}
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  className={cn('text-sm', current || done ? 'font-semibold text-ink' : 'font-medium text-muted')}
                >
                  {STAGE_LABEL[stage]}
                </Text>
                {current ? <Text className="mt-0.5 text-sm text-muted">{STAGE_NOTE[stage]}</Text> : null}
              </View>
            </Card>
          )
        })}
      </View>

      {booking.status === 'awaiting_approval' ? (
        <Card className="mt-5 border-warning bg-warning-soft p-4">
          <Text className="text-sm font-semibold text-ink">Work is paused, waiting on you</Text>
          <Text className="mt-0.5 text-sm leading-[22px] text-muted">
            Your expert has found something else and sent a quote. Nothing further happens until you answer it.
          </Text>
        </Card>
      ) : null}

      <JobOtpPanel className="mt-6" booking={booking} />

      <View className="mt-7">
        <BlockTitle>What has happened</BlockTitle>
        <StatusTimeline events={events} live={working} />
      </View>
    </>
  )
}

/** The web's `animate-spin` on Loader2; still when the system asks for less motion. */
function Spinner() {
  const turn = useSharedValue(0)
  useEffect(() => {
    turn.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
      undefined,
      ReduceMotion.System
    )
  }, [turn])
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }))
  return (
    <Animated.View style={style}>
      <Icon as={Loader2} className="size-3.5 text-ink" />
    </Animated.View>
  )
}
