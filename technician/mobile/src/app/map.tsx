import { useState } from 'react'
import { Linking, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated'
import { ArrowLeft, ChevronRight, Clock, Crosshair, Navigation, Phone, Route as RouteIcon } from 'lucide-react-native'
import { ApplianceGlyph, BrandTag } from '@/components/glyphs'
import { MenuButton } from '@/components/menu'
import { ServiceMap, type MapPin } from '@/components/ServiceMap'
import { Icon, PriorityBadge, StatusChip, Tappable, Text } from '@/components/ui'
import { applianceTitle } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { directionsHref, driveProgress, isToday, telHref, time } from '@/lib/format'
import { useBack } from '@/lib/nav'
import { jobHref } from '@/lib/routes'
import { IN_PROGRESS, isOpen } from '@/lib/status'
import { useStore, useTick } from '@/lib/store'

export default function MapScreen() {
  const { jobs, tech } = useStore()
  const goBack = useBack('/home')
  const now = useTick(5_000)
  const insets = useSafeAreaInsets()
  const visible = jobs
    .filter((j) => j.status === 'request' || (isOpen(j) && isToday(j.scheduledAt)))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const active = jobs.find((j) => j.status === 'on_the_way' || IN_PROGRESS.includes(j.status))
  const [picked, setPicked] = useState<string | null>(null)
  const sel = visible.find((j) => j.id === picked) ?? active ?? visible[0]

  const pins: MapPin[] = visible.map((j) => ({
    id: j.id,
    lat: j.customer.lat,
    lng: j.customer.lng,
    tone: j.priority === 'emergency' && j.status === 'request' ? 'danger' : j.status === 'request' ? 'muted' : 'brand',
    active: j.id === sel?.id,
    label: j.id === sel?.id ? time(j.scheduledAt) : undefined,
  }))

  const progress = sel && sel.id === active?.id ? driveProgress(sel, now) : 0
  const remaining = sel ? Math.max(1, Math.round(sel.etaMin * (1 - progress))) : 0

  return (
    <View className="relative flex-1 bg-canvas">
      <ServiceMap fill insets={[0.2, 0.36]} className="absolute inset-0" pins={pins} to={sel ? sel.customer : undefined} progress={progress} onPin={setPicked} />

      {/* Top overlay */}
      <View pointerEvents="box-none" className="absolute inset-x-0 top-0 p-3" style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center gap-2 rounded-2xl border border-line bg-card/95 p-2 shadow-float">
          <Tappable onPress={goBack} accessibilityLabel="Back" className="size-10 shrink-0 items-center justify-center rounded-xl active:bg-canvas active:opacity-100">
            <Icon as={ArrowLeft} className="size-5 text-ink" />
          </Tappable>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-extrabold">Service area map</Text>
            <Text numberOfLines={1} className="text-xs font-semibold text-muted">
              {tech.area}
            </Text>
          </View>
          <MenuButton />
          <Tappable
            onPress={() => setPicked(active?.id ?? null)}
            accessibilityLabel="Centre on current job"
            className="size-10 items-center justify-center rounded-xl bg-brand-soft"
          >
            <Icon as={Crosshair} className="size-5 text-brand" />
          </Tappable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-3 mt-2 grow-0" contentContainerClassName="gap-2 px-3 pb-2">
          {visible.map((j) => (
            <Tappable
              key={j.id}
              onPress={() => setPicked(j.id)}
              className={cn(
                'h-9 shrink-0 flex-row items-center gap-1.5 rounded-pill border px-3 shadow-card',
                j.id === sel?.id ? 'border-ink bg-ink' : 'border-line bg-card'
              )}
            >
              <View className={cn('size-2 rounded-full', j.priority === 'emergency' && j.status === 'request' ? 'bg-danger' : j.status === 'request' ? 'bg-faint' : 'bg-brand')} />
              <Text className={cn('text-xs font-bold', j.id === sel?.id ? 'text-white' : 'text-ink-2')}>
                <Text className={cn('num text-xs font-bold', j.id === sel?.id ? 'text-white' : 'text-ink-2')}>{time(j.scheduledAt)}</Text> {j.customer.area}
              </Text>
            </Tappable>
          ))}
        </ScrollView>
      </View>

      {/* Selected job */}
      {sel && (
        <View className="absolute inset-x-0 bottom-0 p-3" style={{ paddingBottom: insets.bottom + 12 }}>
          <Animated.View
            key={sel.id}
            entering={FadeInDown.duration(300).reduceMotion(ReduceMotion.System)}
            className="overflow-hidden rounded-2xl border border-line bg-card shadow-float"
          >
            <Tappable href={jobHref(sel)} className="flex-row items-start gap-3 p-4 active:bg-canvas/60 active:opacity-100">
              <View className={cn('size-12 shrink-0 items-center justify-center rounded-xl', sel.priority === 'emergency' ? 'bg-danger-soft' : 'bg-brand-soft')}>
                <ApplianceGlyph appliance={sel.appliance} className={cn('size-7', sel.priority === 'emergency' ? 'text-danger' : 'text-brand')} />
              </View>
              <View className="min-w-0 flex-1">
                <View className="flex-row flex-wrap items-center gap-1.5">
                  <BrandTag brand={sel.brand} />
                  <StatusChip status={sel.status} />
                  {sel.priority !== 'normal' && <PriorityBadge priority={sel.priority} />}
                </View>
                <Text numberOfLines={1} className="mt-1 text-base font-extrabold">
                  {applianceTitle(sel.brand, sel.appliance)}
                </Text>
                <Text numberOfLines={1} className="text-sm font-semibold text-muted">
                  {sel.customer.name} · {sel.customer.address}
                </Text>
              </View>
              <Icon as={ChevronRight} className="mt-3 size-5 text-faint" />
            </Tappable>
            <View className="flex-row border-y border-line bg-canvas/60">
              <Stat icon={RouteIcon} label="Distance" value={`${(sel.distanceKm * (1 - progress)).toFixed(1)} km`} />
              <Stat icon={Clock} label="ETA" value={`${remaining} min`} className="border-l border-line" />
              <Stat icon={Clock} label="Scheduled" value={time(sel.scheduledAt)} className="border-l border-line" />
            </View>
            <View className="flex-row gap-2 p-3">
              {sel.status !== 'request' && (
                <Tappable
                  onPress={() => Linking.openURL(telHref(sel.customer.phone))}
                  accessibilityLabel="Call customer"
                  className="h-12 w-14 shrink-0 items-center justify-center rounded-xl border border-line-strong"
                >
                  <Icon as={Phone} className="size-5 text-success" />
                </Tappable>
              )}
              <Tappable href={jobHref(sel)} className="h-12 flex-1 items-center justify-center rounded-xl border-2 border-line-strong active:border-ink-2 active:opacity-100">
                <Text className="text-[15px] font-extrabold">Open Job</Text>
              </Tappable>
              <Tappable
                onPress={() => Linking.openURL(directionsHref(sel.customer.lat, sel.customer.lng))}
                className="h-12 flex-[1.3] flex-row items-center justify-center gap-2 rounded-xl bg-brand active:bg-brand-deep active:opacity-100"
              >
                <Icon as={Navigation} className="size-5 text-white" />
                <Text className="text-[15px] font-extrabold text-white">Navigate</Text>
              </Tappable>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  )
}

function Stat({ icon, label, value, className }: { icon: typeof Clock; label: string; value: string; className?: string }) {
  return (
    <View className={cn('flex-1 px-3 py-2.5', className)}>
      <View className="flex-row items-center gap-1">
        <Icon as={icon} className="size-3.5 text-brand" />
        <Text numberOfLines={1} className="shrink text-[10.5px] font-bold uppercase tracking-wider text-faint">
          {label}
        </Text>
      </View>
      <Text className="num text-[15px] font-extrabold">{value}</Text>
    </View>
  )
}
