import { View } from 'react-native'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'

/**
 * The four stages of a job, told the same way everywhere they are told.
 *
 * It lives here rather than on the services screen because the appliance page
 * is where most customers actually arrive — from Home, from search, from a
 * shared link — and a customer who lands there was being asked to book without
 * ever being told what booking gets them. Two copies of four steps is two
 * copies that drift, so there is one.
 *
 * The order is the real order of the job, including the step that matters:
 * nobody repairs anything before the customer has said yes to a price.
 */

const STEPS = [
  {
    title: 'Pick the appliance and what is wrong',
    detail: 'Brand, model details and the symptoms you have noticed.',
  },
  {
    title: 'Choose a day and a two-hour window',
    detail: 'You pay only the visit fee to confirm the slot.',
  },
  {
    title: 'The expert inspects and quotes',
    detail: 'A written estimate for the repair, itemised, before any work.',
  },
  {
    title: 'You approve, and only then does work start',
    detail: 'Finished with a GST invoice and a service warranty in the app.',
  },
] as const

/** The line under a "How it works" heading, so callers do not retype it. */
export const HOW_IT_WORKS_SUBTITLE = `${STEPS.length} steps, in the order they happen`

export function HowItWorks({ className }: { className?: string }) {
  return (
    // One card with a rail down it, rather than four cards in a stack: these
    // are stages of a single job, and four separate boxes made them look like
    // four things a customer had to choose between.
    <Card className={cn('p-4', className)}>
      <View accessibilityRole="list">
        {STEPS.map((step, index) => {
          const last = index === STEPS.length - 1
          return (
            <View key={step.title} className={cn('relative flex-row gap-3', last ? 'pb-0' : 'pb-5')}>
              {!last ? (
                // Centred on the 28px circle above it, not beside it.
                <View aria-hidden className="absolute bottom-1 left-[13.5px] top-8 w-px bg-border" />
              ) : null}
              <View aria-hidden className="size-7 shrink-0 items-center justify-center rounded-full bg-brand">
                <Text className="text-xs font-bold text-white">{index + 1}</Text>
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-semibold text-ink">{step.title}</Text>
                <Text className="mt-0.5 text-sm text-muted">{step.detail}</Text>
              </View>
            </View>
          )
        })}
      </View>
    </Card>
  )
}
