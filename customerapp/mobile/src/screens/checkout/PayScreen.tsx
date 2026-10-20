import { useState } from 'react'
import { View } from 'react-native'
import { router, type Href } from 'expo-router'
import { CalendarClock, CreditCard, Landmark, MapPin, ShieldCheck, Smartphone } from 'lucide-react-native'
import { formatPaise } from '@app/shared'

import { useToast } from '@/components/Toast'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useAuth } from '@/lib/auth'
import { useCoupons } from '@/lib/data/account'
import { clearCheckout, placeBooking, useCheckoutDraft, type PaymentMethod } from '@/lib/data/booking'
import { clearCart, useCart } from '@/lib/data/cart'
import { useServicesByIds } from '@/lib/data/catalog'
import { priceCart } from '@/lib/data/pricing'
import { cn } from '@/lib/cn'
import { PriceBreakup } from '@/screens/cart/PriceBreakup'
import { StepFrame, StepHeading } from './StepFrame'
import { longDate, time12 } from './when'

/**
 * Step 4: check it and pay. What is booked, where, when, the bill, and how to
 * pay. The payment itself is Razorpay's sheet, which the backend wires in;
 * this screen is the UI around it, and for now the button pays at once
 * (lib/data/booking placeBooking).
 */

const METHODS: { id: PaymentMethod; label: string; detail: string; icon: typeof Smartphone }[] = [
  { id: 'upi', label: 'UPI', detail: 'Google Pay, PhonePe, Paytm and others', icon: Smartphone },
  { id: 'card', label: 'Credit or debit card', detail: 'Visa, Mastercard, RuPay', icon: CreditCard },
  { id: 'netbanking', label: 'Netbanking', detail: 'All major banks', icon: Landmark },
]

export function PayScreen() {
  const cart = useCart()
  const draft = useCheckoutDraft()
  const { user } = useAuth()
  const toast = useToast()
  const coupons = useCoupons()
  const services = useServicesByIds(cart.items.map((item) => item.serviceId))
  const [method, setMethod] = useState<PaymentMethod>('upi')
  const [paying, setPaying] = useState(false)
  const [placed, setPlaced] = useState(false)

  const coupon = coupons.data?.find((c) => c.code === cart.couponCode) ?? null
  const price = priceCart(cart.items, coupon, cart.categoryId)

  async function pay(): Promise<void> {
    if (!user || !cart.categoryId) return
    if (!draft.address || !draft.slot) {
      router.replace(draft.address ? '/checkout/slot' : '/checkout/address')
      return
    }
    setPaying(true)
    try {
      const booking = await placeBooking({ uid: user.uid, categoryId: cart.categoryId, items: cart.items, draft, price, method })
      setPlaced(true)
      router.replace(`/checkout/confirmed?id=${booking.id}` as Href)
      clearCart()
      clearCheckout()
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'The payment did not go through. You have not been charged.', { tone: 'error' })
      setPaying(false)
    }
  }

  return (
    <StepFrame
      step={4}
      title="Review and pay"
      guard={!placed}
      action={{ label: `Pay ${formatPaise(price.total)}`, onPress: () => void pay(), loading: paying }}
    >
      <View className="rounded-card border border-border px-4">
        {cart.items.map((item, index) => {
          const service = services.data?.find((s) => s.id === item.serviceId)
          const variant = service?.variants.find((v) => v.id === item.variantId)
          return (
            <View key={`${item.serviceId}:${item.variantId ?? ''}`} className={cn('flex-row gap-3 py-3', index < cart.items.length - 1 && 'border-b border-border')}>
              <Text className="min-w-0 flex-1 text-sm text-ink">
                {`${service?.name ?? 'Service'}${variant ? ` · ${variant.label}` : ''}${item.qty > 1 ? ` × ${item.qty}` : ''}`}
              </Text>
              <Text className="text-sm text-ink tabular-nums">{formatPaise(item.unitPrice * item.qty)}</Text>
            </View>
          )
        })}
      </View>

      <Summary
        icon={MapPin}
        title={draft.address ? `${draft.address.label[0]!.toUpperCase()}${draft.address.label.slice(1)}` : 'Address'}
        detail={draft.address ? [draft.address.line1, draft.address.line2, draft.address.pincode].filter(Boolean).join(', ') : 'Not chosen'}
        onChange={() => router.push('/checkout/address')}
      />
      <Summary
        icon={CalendarClock}
        title={draft.slot ? longDate(draft.slot.date) : 'Slot'}
        detail={draft.slot ? `Arrives between ${time12(draft.slot.start)} and 30 minutes after` : 'Not chosen'}
        onChange={() => router.push('/checkout/slot')}
      />

      <PriceBreakup price={price} couponCode={coupon?.code} className="mt-4" />

      <View className="mt-6">
        <StepHeading>Pay with</StepHeading>
        <View className="gap-2" accessibilityRole="radiogroup">
          {METHODS.map((option) => {
            const on = option.id === method
            return (
              <Tappable
                key={option.id}
                onPress={() => setMethod(option.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                className={cn('min-h-14 flex-row items-center gap-3 rounded-card border px-4 py-3', on ? 'border-brand bg-brand-soft' : 'border-border')}
              >
                <Icon as={option.icon} className={cn('size-5', on ? 'text-brand' : 'text-muted')} />
                <View className="min-w-0 flex-1">
                  <Text className="text-base font-semibold text-ink">{option.label}</Text>
                  <Text className="text-xs text-muted">{option.detail}</Text>
                </View>
                <View className={cn('size-5 items-center justify-center rounded-full border-2', on ? 'border-brand' : 'border-border')}>
                  {on ? <View className="size-2.5 rounded-full bg-brand" /> : null}
                </View>
              </Tappable>
            )
          })}
        </View>
        <View className="mt-3 flex-row items-center gap-2">
          <Icon as={ShieldCheck} className="size-4 text-success" />
          <Text className="flex-1 text-xs text-muted">Payments are processed securely by Razorpay. We never see your card or UPI PIN.</Text>
        </View>
      </View>
    </StepFrame>
  )
}

function Summary({ icon, title, detail, onChange }: { icon: typeof MapPin; title: string; detail: string; onChange: () => void }) {
  return (
    <View className="mt-4 flex-row items-start gap-3 rounded-card border border-border p-4">
      <Icon as={icon} className="mt-0.5 size-5 text-muted" />
      <View className="min-w-0 flex-1">
        <Text className="text-base font-semibold text-ink">{title}</Text>
        <Text className="mt-0.5 text-sm text-muted">{detail}</Text>
      </View>
      <Tappable onPress={onChange} accessibilityLabel={`Change ${title}`} className="min-h-11 justify-center px-1">
        <Text className="text-sm font-semibold text-brand">Change</Text>
      </Tappable>
    </View>
  )
}
