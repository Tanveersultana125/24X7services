import { useEffect } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import { Header, Screen } from '@/components/Screen'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { useAuth } from '@/lib/auth'
import { useCart } from '@/lib/data/cart'
import { cn } from '@/lib/cn'

/**
 * The frame every checkout step sits in: a title, "Step 2 of 4" with a bar,
 * and the one button that moves on, pinned to the bottom.
 *
 * It also keeps the flow honest. A step opened with an empty cart (the cart
 * was paid for, or emptied in another tab) goes back to the cart, and one
 * opened signed out goes to log in and returns here.
 */

export const CHECKOUT_STEPS = ['Details', 'Address', 'Slot', 'Payment'] as const

export function StepFrame({
  step,
  title,
  action,
  guard = true,
  children,
}: {
  /** 1-based, into CHECKOUT_STEPS. */
  step: number
  title: string
  action: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean } | null
  /** Off while the booking is being placed: paying empties the cart, and that is not a reason to leave. */
  guard?: boolean
  children: React.ReactNode
}) {
  const insets = useSafeAreaInsets()
  const cart = useCart()
  const { user, ready } = useAuth()

  useEffect(() => {
    if (!guard) return
    if (cart.count === 0) router.replace('/cart')
    else if (ready && !user) router.replace('/login?next=%2Fcart')
  }, [guard, cart.count, ready, user])

  return (
    <Screen
      header={<Header title={title} subtitle={`Step ${step} of ${CHECKOUT_STEPS.length} · ${CHECKOUT_STEPS[step - 1]}`} showBack backFallback="/cart" />}
      contentClassName="pt-1"
      footer={
        action ? (
          <View className="border-t border-border bg-bg px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
            <Button fullWidth size="lg" onPress={action.onPress} disabled={action.disabled} loading={action.loading}>
              {action.label}
            </Button>
          </View>
        ) : null
      }
    >
      <View className="mb-4 flex-row gap-1.5" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {CHECKOUT_STEPS.map((name, index) => (
          <View key={name} className={cn('h-1 flex-1 rounded-full', index < step ? 'bg-brand' : 'bg-border')} />
        ))}
      </View>
      {children}
    </Screen>
  )
}

/** A question or block heading inside a step. */
export function StepHeading({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <View className="mb-3">
      <Text accessibilityRole="header" className="text-lg font-bold text-ink">
        {children}
      </Text>
      {hint ? <Text className="mt-0.5 text-sm text-muted">{hint}</Text> : null}
    </View>
  )
}
