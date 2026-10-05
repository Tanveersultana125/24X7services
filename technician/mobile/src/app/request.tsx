import { Linking, View } from 'react-native'
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated'
import { CircleCheck, CircleX, ClipboardList, Clock, IndianRupee, MessageCircle, Navigation, Phone, Route as RouteIcon, Siren } from 'lucide-react-native'
import { CustomerBlock, JobNotFound, JobSummary, useJobParam } from '@/components/JobParts'
import { ServiceMap } from '@/components/ServiceMap'
import { ActionDock, Card, Icon, Label, Page, ScreenHeader, SectionTitle, Tappable, Text } from '@/components/ui'
import { LABOUR_RATE, inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ago, directionsHref, telHref, time } from '@/lib/format'
import { stepHref } from '@/lib/routes'
import { useStore } from '@/lib/store'

export default function RequestScreen() {
  const job = useJobParam()
  const { accept, reject } = useStore()
  if (!job)
    return (
      <>
        <ScreenHeader back="/home" title="New Service Request" />
        <JobNotFound />
      </>
    )

  const emergency = job.priority === 'emergency'
  const accepted = job.status !== 'request' && job.status !== 'rejected'

  return (
    <>
      <ScreenHeader back="/home" title={accepted ? 'Job accepted' : 'New Service Request'} subtitle={`${job.id} · received ${ago(job.requestedAt)}`} />
      <Page className="gap-4">
        {emergency && !accepted && (
          <View className="flex-row items-center gap-3 rounded-card bg-danger p-4">
            <Icon as={Siren} className="size-6 shrink-0 text-white" />
            <View className="flex-1">
              <Text className="font-extrabold text-white">Emergency · high priority</Text>
              <Text className="text-sm font-medium text-white/80">Customer needs a technician as soon as possible. Target arrival within 45 minutes.</Text>
            </View>
          </View>
        )}

        {accepted && (
          <Animated.View entering={FadeInDown.duration(300).reduceMotion(ReduceMotion.System)}>
            <Card className="overflow-hidden border-success/30">
              <View className="flex-row items-center gap-3 bg-success-soft p-4">
                <Icon as={CircleCheck} className="size-8 text-success" />
                <View className="flex-1">
                  <Text className="font-extrabold text-success">You’ve got this job</Text>
                  <Text className="text-sm font-medium text-ink-2">Customer has been told you’re assigned. Head out when ready.</Text>
                </View>
              </View>
              <View className="flex-row flex-wrap gap-2 p-3">
                <Tile
                  onPress={() => Linking.openURL(directionsHref(job.customer.lat, job.customer.lng))}
                  className="border-0 bg-brand"
                  textClassName="text-white"
                  icon={<Icon as={Navigation} className="size-5 text-white" />}
                  label="Start navigation"
                />
                <Tile onPress={() => Linking.openURL(telHref(job.customer.phone))} icon={<Icon as={Phone} className="size-5 text-success" />} label="Call customer" />
                <Tile
                  onPress={() => Linking.openURL(`sms:${job.customer.phone.replace(/\s/g, '')}`)}
                  icon={<Icon as={MessageCircle} className="size-5 text-brand" />}
                  label="Chat"
                />
                <Tile href={stepHref('detail', job.id)} icon={<Icon as={ClipboardList} className="size-5 text-violet" />} label="Service details" />
              </View>
            </Card>
          </Animated.View>
        )}

        {job.status === 'rejected' && (
          <View className="flex-row items-center gap-3 rounded-card border border-line-strong bg-card p-4">
            <Icon as={CircleX} className="size-6 text-muted" />
            <Text className="flex-1 text-sm font-semibold text-ink-2">You declined this request. Dispatch has offered it to the next technician.</Text>
          </View>
        )}

        <JobSummary job={job} />
        <Card className="overflow-hidden">
          <ServiceMap to={job.customer} pins={[{ id: job.id, lat: job.customer.lat, lng: job.customer.lng, tone: emergency ? 'danger' : 'brand', label: job.customer.area }]} />
          <View className="flex-row">
            <Metric icon={<Icon as={RouteIcon} className="size-4 text-brand" />} label="Distance" value={`${job.distanceKm} km`} />
            <Metric icon={<Icon as={Clock} className="size-4 text-brand" />} label="Drive" value={`~${job.etaMin} min`} className="border-l border-line" />
            <Metric icon={<Icon as={Clock} className="size-4 text-brand" />} label="Requested" value={emergency ? 'ASAP' : time(job.scheduledAt)} className="border-l border-line" />
          </View>
        </Card>

        <View>
          <SectionTitle>Customer</SectionTitle>
          <CustomerBlock job={job} masked={!accepted} />
        </View>
        <View>
          <SectionTitle>Estimated service fee</SectionTitle>
          <Card className="p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Icon as={IndianRupee} className="size-4 text-success" />
                <Text className="text-sm font-semibold text-ink-2">Visit &amp; labour</Text>
              </View>
              <Text className="num font-bold">{inr(LABOUR_RATE[job.appliance])}</Text>
            </View>
            {job.estFee > LABOUR_RATE[job.appliance] && (
              <View className="mt-2 flex-row items-baseline justify-between">
                <Text className="text-sm font-semibold text-ink-2">Emergency surcharge</Text>
                <Text className="num font-bold">{inr(job.estFee - LABOUR_RATE[job.appliance])}</Text>
              </View>
            )}
            <View className="mt-3 flex-row items-baseline justify-between border-t border-dashed border-line pt-3">
              <Label>You earn (before parts)</Label>
              <Text className="num text-xl font-extrabold text-success">{inr(job.estFee)}</Text>
            </View>
            <Text className="mt-2 text-xs text-muted">Parts are billed separately after diagnosis and customer approval.</Text>
          </Card>
        </View>
      </Page>

      {job.status === 'request' && (
        <ActionDock>
          <Tappable
            onPress={() => reject(job.id)}
            className="h-14 flex-1 items-center justify-center rounded-xl border-2 border-line-strong active:border-danger active:opacity-100"
          >
            <Text className="text-[15px] font-extrabold text-ink-2">REJECT JOB</Text>
          </Tappable>
          <Tappable onPress={() => accept(job.id)} className="h-14 flex-[1.6] items-center justify-center rounded-xl bg-success active:opacity-90">
            <Text className="text-[15px] font-extrabold text-white">ACCEPT JOB</Text>
          </Tappable>
        </ActionDock>
      )}
    </>
  )
}

/** One of the four big shortcuts once the job is yours. */
function Tile({
  icon,
  label,
  onPress,
  href,
  className,
  textClassName,
}: {
  icon: React.ReactNode
  label: string
  onPress?: () => void
  href?: ReturnType<typeof stepHref>
  className?: string
  textClassName?: string
}) {
  return (
    <Tappable
      onPress={onPress}
      href={href}
      className={cn('h-20 grow basis-[45%] items-center justify-center gap-1.5 rounded-xl border border-line-strong', className)}
    >
      {icon}
      <Text className={cn('text-sm font-extrabold', textClassName)}>{label}</Text>
    </Tappable>
  )
}

function Metric({ icon, label, value, className }: { icon: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <View className={cn('flex-1 px-3 py-3', className)}>
      <View className="flex-row items-center gap-1">
        {icon}
        <Text numberOfLines={1} className="shrink text-[10.5px] font-bold uppercase tracking-wider text-faint">
          {label}
        </Text>
      </View>
      <Text className="num mt-0.5 text-base font-extrabold">{value}</Text>
    </View>
  )
}
