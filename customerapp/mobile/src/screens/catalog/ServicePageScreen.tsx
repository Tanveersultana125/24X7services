import { useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { Check, ChevronDown, Clock, Sparkles, Star, X } from 'lucide-react-native'
import { formatPaise } from '@app/shared'
import type { Faq, Service } from '@app/shared/catalog-v2'

import { Header, Screen } from '@/components/Screen'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Skeleton, SkeletonGroup, SkeletonText } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { serviceQty } from '@/lib/data/cart'
import { useServicePage } from '@/lib/data/catalog'
import { cn } from '@/lib/cn'
import { hasPublicAsset } from '@/lib/publicAsset'
import { AddControl, compactCount, useCartActions } from './cartActions'
import { OptionsSheet } from './OptionsSheet'

/**
 * One service, in full: the picture, the price and the time it takes, what
 * is and is not included, the questions people ask, and how it rates. The Add
 * control stays pinned to the bottom with the price beside it, so the
 * decision is never a scroll away.
 */
export function ServicePageScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const id = typeof params.id === 'string' ? params.id : ''
  const page = useServicePage(id)
  const service = page.data?.service
  const { cart, change, confirm } = useCartActions(page.data?.root?.id)
  const [options, setOptions] = useState(false)

  return (
    <Screen
      header={<Header title={page.data?.category?.name ?? ''} showBack backFallback="/home" />}
      contentClassName="px-0"
      footer={service ? <AddBar service={service} qty={serviceQty(cart.items, service.id)} onAdd={() => (service.variants.length ? setOptions(true) : change(service, undefined, 1))} onChange={(qty) => change(service, undefined, qty)} cartCount={cart.count} /> : null}
    >
      {page.status === 'loading' ? (
        <SkeletonGroup label="Loading service" className="gap-4">
          <Skeleton className="aspect-video w-full rounded-none" />
          <View className="gap-3 px-4">
            <Skeleton className="h-7 w-3/4" />
            <SkeletonText lines={3} />
          </View>
        </SkeletonGroup>
      ) : page.status === 'error' ? (
        <ErrorState className="mt-10 px-4" onRetry={page.reload} retrying={page.refreshing} />
      ) : !service ? (
        <ErrorState className="mt-10 px-4" kind="notFound" />
      ) : (
        <ServiceBody service={service} />
      )}

      {service ? (
        <OptionsSheet
          service={options ? service : null}
          cart={cart}
          onChange={(s, variant, qty) => change(s, variant, qty)}
          onClose={() => setOptions(false)}
        />
      ) : null}
      {confirm}
    </Screen>
  )
}

function ServiceBody({ service }: { service: Service }) {
  return (
    <View>
      <View className="aspect-video w-full items-center justify-center bg-plate">
        {hasPublicAsset(service.image) ? (
          <Img src={service.image} alt={service.name} className="size-full" />
        ) : (
          <Icon as={Sparkles} className="size-10 text-muted" />
        )}
      </View>

      <View className="px-4 pt-5">
        <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
          {service.name}
        </Text>
        {service.rating ? (
          <View className="mt-2 flex-row items-center gap-1.5">
            <Icon as={Star} filled className="size-4 text-ink" />
            <Text className="text-sm text-ink">
              {`${service.rating.toFixed(2)} `}
              <Text className="text-sm text-muted">{`(${compactCount(service.reviewCount)} reviews)`}</Text>
            </Text>
          </View>
        ) : null}
        <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1">
          <Text className="text-base font-semibold text-ink tabular-nums">
            {service.variants.length ? `Starts at ${formatPaise(service.price)}` : formatPaise(service.price)}
          </Text>
          {service.compareAt ? (
            <Text className="text-sm text-muted line-through tabular-nums">{formatPaise(service.compareAt)}</Text>
          ) : null}
          {service.durationMinutes ? (
            <View className="flex-row items-center gap-1">
              <Icon as={Clock} className="size-3.5 text-muted" />
              <Text className="text-sm text-muted">{`${service.durationMinutes} mins`}</Text>
            </View>
          ) : null}
        </View>
        {service.highlights.map((line) => (
          <Text key={line} className="mt-2 text-sm text-muted">{`• ${line}`}</Text>
        ))}
      </View>

      <Band />
      {service.included.length ? <Checklist title="What's included" lines={service.included} included /> : null}
      {service.excluded.length ? <Checklist title="Not included" lines={service.excluded} included={false} /> : null}
      {service.faqs.length ? <Faqs faqs={service.faqs} /> : null}
      {service.rating ? (
        <View className="px-4 py-6">
          <Text accessibilityRole="header" className="text-xl font-bold text-ink">
            Ratings
          </Text>
          <View className="mt-3 flex-row items-center gap-3">
            <Text className="text-3xl font-bold text-ink tabular-nums">{service.rating.toFixed(2)}</Text>
            <Text className="flex-1 text-sm text-muted">{`From ${compactCount(service.reviewCount)} customers who booked this service.`}</Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}

/** The grey rule between unrelated blocks, as everywhere else in the app. */
function Band() {
  return <View className="mt-6 h-2 bg-surface" />
}

function Checklist({ title, lines, included }: { title: string; lines: string[]; included: boolean }) {
  return (
    <View className="border-b border-border px-4 py-6">
      <Text accessibilityRole="header" className="mb-3 text-xl font-bold text-ink">
        {title}
      </Text>
      {lines.map((line) => (
        <View key={line} className="mt-2 flex-row gap-3">
          <Icon as={included ? Check : X} className={cn('mt-0.5 size-4', included ? 'text-success' : 'text-error')} />
          <Text className="flex-1 text-sm text-ink">{line}</Text>
        </View>
      ))}
    </View>
  )
}

function Faqs({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <View className="border-b border-border px-4 py-6">
      <Text accessibilityRole="header" className="mb-1 text-xl font-bold text-ink">
        Frequently asked questions
      </Text>
      {faqs.map((faq, index) => (
        <View key={faq.q} className={cn(index < faqs.length - 1 && 'border-b border-border')}>
          <Tappable
            onPress={() => setOpen(open === index ? null : index)}
            accessibilityState={{ expanded: open === index }}
            className="min-h-12 flex-row items-center gap-3 py-3"
          >
            <Text className="flex-1 text-base font-medium text-ink">{faq.q}</Text>
            <Icon as={ChevronDown} className={cn('size-4 text-muted', open === index && 'rotate-180')} />
          </Tappable>
          {open === index ? <Text className="pb-4 text-sm leading-[22px] text-muted">{faq.a}</Text> : null}
        </View>
      ))}
    </View>
  )
}

/** Pinned to the bottom: the price, and Add (or the stepper, or View cart). */
function AddBar({
  service,
  qty,
  cartCount,
  onAdd,
  onChange,
}: {
  service: Service
  qty: number
  cartCount: number
  onAdd: () => void
  onChange: (qty: number) => void
}) {
  const insets = useSafeAreaInsets()
  const hasOptions = service.variants.length > 0
  return (
    <View className="flex-row items-center gap-3 border-t border-border bg-bg px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
      <View className="min-w-0 flex-1">
        <Text className="text-base font-bold text-ink tabular-nums">
          {hasOptions ? `From ${formatPaise(service.price)}` : formatPaise(service.price)}
        </Text>
        {qty > 0 ? <Text className="text-xs text-muted">{`${qty} in cart`}</Text> : null}
      </View>
      {qty > 0 && cartCount > 0 ? (
        <>
          <AddControl
            qty={qty}
            label={service.name}
            onAdd={onAdd}
            onIncrease={() => (hasOptions ? onAdd() : onChange(qty + 1))}
            onDecrease={() => (hasOptions ? onAdd() : onChange(qty - 1))}
          />
          <Button href="/cart">View cart</Button>
        </>
      ) : (
        <Button onPress={onAdd} className="px-8">
          {hasOptions ? 'Choose options' : 'Add to cart'}
        </Button>
      )}
    </View>
  )
}
