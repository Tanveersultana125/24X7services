import { Image, Linking, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { MapPin, MessageSquareText, Phone, SearchX } from 'lucide-react-native'
import { ApplianceGlyph, BrandTag } from './glyphs'
import { Card, Empty, Icon, Label, PriorityBadge, StatusChip, Tappable, Text } from './ui'
import { LABOUR_RATE, applianceTitle, inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { telHref } from '@/lib/format'
import { useJob } from '@/lib/store'
import type { Job } from '@/lib/types'

/** The job a `?id=` screen is about, or a not-found panel. */
export function useJobParam(): Job | undefined {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return useJob(id ?? null)
}

export function JobNotFound() {
  return (
    <View className="px-4 pt-10">
      <Empty icon={<Icon as={SearchX} className="size-5" />} title="Job not found" body="It may have been reassigned by dispatch or cleared from this device." />
    </View>
  )
}

/** Appliance, brand, service and issue — the same block on every job screen. */
export function JobSummary({ job, className }: { job: Job; className?: string }) {
  const emergency = job.priority === 'emergency'
  return (
    <Card className={cn('p-4', className)}>
      <View className="flex-row items-start gap-3">
        <View className={cn('size-14 shrink-0 items-center justify-center rounded-2xl', emergency ? 'bg-danger-soft' : 'bg-brand-soft')}>
          <ApplianceGlyph appliance={job.appliance} className={cn('size-8', emergency ? 'text-danger' : 'text-brand')} />
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-1.5">
            <BrandTag brand={job.brand} />
            <PriorityBadge priority={job.priority} />
            <StatusChip status={job.status} />
          </View>
          <Text accessibilityRole="header" className="mt-1.5 text-xl font-extrabold leading-tight tracking-tight">
            {applianceTitle(job.brand, job.appliance)}
          </Text>
          <Text className="text-[15px] font-semibold text-ink-2">“{job.issue}”</Text>
        </View>
      </View>
      <View className="mt-4 flex-row flex-wrap gap-y-3 border-t border-line pt-4">
        <SummaryFact label="Service" value={job.service} />
        <SummaryFact label="Model" value={job.model ?? '—'} />
        <SummaryFact label="Job ID" value={job.id} num />
        <SummaryFact label="Est. duration" value={`${job.durationMin} min`} />
      </View>
      {job.customerNote && (
        <View className="mt-4 flex-row gap-2.5 rounded-xl bg-warning-soft p-3">
          <Icon as={MessageSquareText} className="mt-0.5 size-4 shrink-0 text-warning" />
          <Text className="flex-1 text-sm font-medium text-ink-2">
            <Text className="text-sm font-extrabold text-ink">Customer note: </Text>
            {job.customerNote}
          </Text>
        </View>
      )}
    </Card>
  )
}

/** One cell of the summary's two-column facts. */
function SummaryFact({ label, value, num }: { label: string; value: string; num?: boolean }) {
  return (
    <View className="w-1/2 pr-4">
      <Label>{label}</Label>
      <Text numberOfLines={1} className={cn('mt-0.5 text-sm font-bold', num && 'num')}>
        {value}
      </Text>
    </View>
  )
}

export function CustomerBlock({ job, masked }: { job: Job; masked?: boolean }) {
  return (
    <Card className="p-4">
      <View className="flex-row items-start gap-3">
        <View className="size-11 shrink-0 items-center justify-center rounded-full bg-canvas">
          <Text className="text-sm font-extrabold text-ink-2">
            {job.customer.name
              .split(' ')
              .map((w) => w[0])
              .join('')}
          </Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-extrabold">{job.customer.name}</Text>
          <Text className="num text-sm font-semibold text-muted">
            {masked ? job.customer.phone.replace(/\d(?=(?:\D*\d){4})/g, '•') : job.customer.phone}
          </Text>
        </View>
        {!masked && (
          <Tappable
            accessibilityLabel="Call customer"
            onPress={() => Linking.openURL(telHref(job.customer.phone))}
            className="size-11 items-center justify-center rounded-full bg-success-soft active:bg-success active:opacity-100"
          >
            <Icon as={Phone} className="size-5 text-success" />
          </Tappable>
        )}
      </View>
      <View className="mt-3 flex-row gap-2.5 border-t border-line pt-3">
        <Icon as={MapPin} className="mt-0.5 size-4 shrink-0 text-brand" />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink">{masked ? job.customer.area + ', Hyderabad' : job.customer.address}</Text>
          {job.customer.landmark && !masked && <Text className="text-sm text-muted">Landmark: {job.customer.landmark}</Text>}
          {masked && <Text className="text-xs text-muted">Full address and number unlock when you accept.</Text>}
        </View>
      </View>
    </Card>
  )
}

/**
 * What has been found and what it costs, on the job screen itself — so the
 * technician (or a supervisor looking over their shoulder) sees the whole
 * job without opening Diagnosis, Parts and Bill one by one.
 */
export function ServiceSummary({ job }: { job: Job }) {
  const labour = job.bill?.labour ?? LABOUR_RATE[job.appliance]
  const parts = job.parts.reduce((s, p) => s + p.qty * p.price, 0)
  const additional = job.bill?.additional ?? 0
  const legacy = job.status === 'closed' && !job.bill && job.amount !== undefined
  const total = legacy ? job.amount! : labour + parts + additional
  const paid = job.status === 'closed' || !!job.bill?.paid

  return (
    <Card>
      <View className="p-4">
        <Label>Diagnosis</Label>
        {job.diagnosis ? (
          <View className="mt-1">
            <Text className="text-sm font-extrabold">{job.diagnosis.problem}</Text>
            <Text className="mt-0.5 text-sm font-medium text-ink-2">{job.diagnosis.repair}</Text>
            <View className="mt-1.5 flex-row flex-wrap gap-1.5">
              <View className="rounded-md bg-canvas px-2 py-0.5">
                <Text className="text-[11px] font-bold text-ink-2">{job.diagnosis.category}</Text>
              </View>
              <View className="rounded-md bg-canvas px-2 py-0.5">
                <Text className="text-[11px] font-bold text-ink-2">Condition: {job.diagnosis.condition}</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text className="mt-1 text-sm font-semibold text-muted">Not recorded yet — done on site after arrival.</Text>
        )}
      </View>

      <View className="border-t border-line p-4">
        <Label>Parts required</Label>
        {job.parts.length ? (
          <View className="mt-1.5 gap-1">
            {job.parts.map((p) => (
              <View key={p.sku} className="flex-row items-baseline justify-between gap-3">
                <Text numberOfLines={1} className="min-w-0 flex-1 text-sm font-semibold">
                  {p.name} <Text className="text-sm font-semibold text-muted">× {p.qty}</Text>
                  {!p.inVan && <Text className="text-[11px] font-bold text-danger">{'  From hub'}</Text>}
                </Text>
                <Text className="num shrink-0 text-sm font-bold">{inr(p.qty * p.price)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="mt-1 text-sm font-semibold text-muted">None selected</Text>
        )}
      </View>

      <View className="border-t border-line p-4">
        <View className="flex-row items-center justify-between">
          <Label>Service charges</Label>
          <View className={cn('rounded-md px-2 py-0.5', paid ? 'bg-success-soft' : 'bg-warning-soft')}>
            <Text className={cn('text-[10.5px] font-extrabold uppercase tracking-wider', paid ? 'text-success' : 'text-warning')}>
              {paid ? `Paid${job.bill?.method ? ` · ${job.bill.method === 'cash' ? 'Cash' : 'Online'}` : ''}` : 'Payment pending'}
            </Text>
          </View>
        </View>
        {!legacy && (
          <View className="mt-2 gap-1">
            <View className="flex-row justify-between">
              <Text className="text-sm font-medium text-muted">Labour / service</Text>
              <Text className="num text-sm font-bold">{inr(labour)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm font-medium text-muted">Parts</Text>
              <Text className="num text-sm font-bold">{inr(parts)}</Text>
            </View>
            {additional > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-sm font-medium text-muted">Additional</Text>
                <Text className="num text-sm font-bold">{inr(additional)}</Text>
              </View>
            )}
          </View>
        )}
        <View className="mt-2 flex-row items-baseline justify-between border-t border-dashed border-line pt-2">
          <Text className="text-sm font-extrabold">Total</Text>
          <Text className="num text-lg font-extrabold">{inr(total)}</Text>
        </View>
      </View>

      {job.photos.length > 0 && (
        <View className="border-t border-line p-4">
          <Label>Photos</Label>
          <View className="-m-1 mt-1 flex-row flex-wrap">
            {job.photos.map((p) => (
              <View key={p.id} className="w-1/4 p-1">
                <View className="relative aspect-square overflow-hidden rounded-lg border border-line bg-canvas">
                  <Image source={{ uri: p.url }} accessibilityLabel={`${p.kind} photo`} className="size-full" resizeMode="cover" />
                  <View className="absolute inset-x-0 bottom-0 bg-ink/60 px-1 py-0.5">
                    <Text className="text-center text-[9.5px] font-bold uppercase text-white">{p.kind}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </Card>
  )
}
