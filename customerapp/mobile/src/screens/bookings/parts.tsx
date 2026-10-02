import { useState } from 'react'
import { View } from 'react-native'
import type { Href } from 'expo-router'
import type { LucideIcon } from 'lucide-react-native'

import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/lib/auth'
import { CheckoutDismissed } from '@/lib/checkout'
import { friendlyError } from '@/lib/callables'
import { payBooking } from '@/lib/payBooking'

/**
 * Pieces the booking screens share. On the web each screen carried its own
 * copy; they are identical, so here they live once.
 */

/** The one thing to do right now — a dark full-width card. */
export function PrimaryAction({
  href,
  label,
  note,
  icon,
}: {
  href: Href
  label: string
  note: string
  icon: LucideIcon
}) {
  return (
    <Tappable href={href} className="mt-5 flex-row items-center gap-3 rounded-card bg-ink p-4">
      <Icon as={icon} className="size-5 text-bg" />
      <View className="min-w-0 flex-1">
        <Text className="text-base font-semibold text-bg">{label}</Text>
        <Text className="mt-0.5 text-sm text-bg/70">{note}</Text>
      </View>
    </Tappable>
  )
}

/** Invoice / Warranty / Review — an outlined tile with an icon and a label. */
export function SecondaryLink({ href, label, icon }: { href: Href; label: string; icon: LucideIcon }) {
  return (
    <Tappable
      href={href}
      className="min-h-12 flex-row items-center justify-center gap-2 rounded-card border border-border active:border-brand active:opacity-100"
    >
      <Icon as={icon} className="size-4 text-ink" />
      <Text className="text-sm font-semibold text-ink">{label}</Text>
    </Tappable>
  )
}

/** A labelled fact with an icon: When, Where, Arriving in. */
export function Row({
  icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <View className="flex-row items-start gap-3">
      <Icon as={icon} className="mt-0.5 size-4 text-muted" />
      <View className="min-w-0 flex-1">
        <Text className="text-xs text-muted">{label}</Text>
        <View className="mt-0.5">{children}</View>
      </View>
    </View>
  )
}

/** The small grey heading over a block. */
export function BlockTitle({ children, className = 'mb-3' }: { children: string; className?: string }) {
  return (
    <Text accessibilityRole="header" className={`${className} text-sm font-semibold text-muted`}>
      {children}
    </Text>
  )
}

/**
 * Paying what is owed on a booking — the visit fee to confirm it, or the
 * balance once the job is done. A dismissed checkout says nothing: the customer
 * closed it on purpose.
 */
export function useSettle(bookingId: string, purpose: 'visit_fee' | 'final_due') {
  const { user } = useAuth()
  const toast = useToast()
  const [paying, setPaying] = useState(false)

  async function settle(): Promise<void> {
    setPaying(true)
    try {
      const outcome = await payBooking(bookingId, purpose, {
        name: user?.displayName ?? undefined,
        phone: user?.phoneNumber ?? undefined,
      })
      if (outcome.kind === 'paid') {
        toast.show('Payment received. Thank you.', { tone: 'success' })
      } else if (outcome.kind === 'unsettled') {
        toast.show('Your payment went through but we could not update the booking. Support will sort it out.', {
          tone: 'error',
        })
      }
    } catch (error) {
      if (!(error instanceof CheckoutDismissed)) {
        toast.show(friendlyError(error), { tone: 'error' })
      }
    } finally {
      setPaying(false)
    }
  }

  return { paying, settle }
}
