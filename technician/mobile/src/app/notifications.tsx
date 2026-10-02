import { useState } from 'react'
import { View } from 'react-native'
import type { Href } from 'expo-router'
import { BellOff, BriefcaseBusiness, CalendarClock, CircleCheck, CircleX, IndianRupee, MessageCircle, PhoneCall, Siren, Star, Zap } from 'lucide-react-native'
import { Card, Empty, FilterChip, Icon, Page, ScreenHeader, Tappable, Text } from '@/components/ui'
import { cn } from '@/lib/cn'
import { ago } from '@/lib/format'
import { useStore, useTick } from '@/lib/store'
import type { NotificationKind } from '@/lib/types'

const KIND: Record<NotificationKind, { icon: typeof Zap; tone: string; label: string }> = {
  request: { icon: Zap, tone: 'bg-brand-soft text-brand', label: 'New job' },
  emergency: { icon: Siren, tone: 'bg-danger text-white', label: 'Emergency request' },
  accepted: { icon: CircleCheck, tone: 'bg-success-soft text-success', label: 'Job accepted' },
  assigned: { icon: BriefcaseBusiness, tone: 'bg-brand-soft text-brand', label: 'Assigned' },
  schedule: { icon: CalendarClock, tone: 'bg-warning-soft text-warning', label: 'Schedule change' },
  cancelled: { icon: CircleX, tone: 'bg-canvas text-muted', label: 'Cancelled' },
  customer: { icon: MessageCircle, tone: 'bg-info-soft text-info', label: 'Customer update' },
  payment: { icon: IndianRupee, tone: 'bg-success-soft text-success', label: 'Payment' },
  ai_call: { icon: PhoneCall, tone: 'bg-violet-soft text-violet', label: 'AI call summary' },
  rating: { icon: Star, tone: 'bg-warning-soft text-warning', label: 'New rating' },
}

type Tab = 'all' | 'jobs' | 'payments'

export default function NotificationsScreen() {
  const { notices, jobs, markRead, markAllRead } = useStore()
  useTick(30_000)
  const [tab, setTab] = useState<Tab>('all')
  const list = notices.filter((n) =>
    tab === 'all' ? true : tab === 'payments' ? n.kind === 'payment' || n.kind === 'rating' : n.kind !== 'payment' && n.kind !== 'rating'
  )
  const unread = notices.filter((n) => !n.read).length

  return (
    <>
      <ScreenHeader
        back="/home"
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'All caught up'}
        right={
          unread > 0 && (
            <Tappable onPress={markAllRead} className="h-10 justify-center rounded-xl px-3 active:bg-brand-soft active:opacity-100">
              <Text className="text-sm font-bold text-brand">Mark all read</Text>
            </Tappable>
          )
        }
      />
      <Page className="gap-4">
        <View className="flex-row flex-wrap gap-2">
          {(
            [
              ['all', 'All'],
              ['jobs', 'Jobs'],
              ['payments', 'Payments & ratings'],
            ] as [Tab, string][]
          ).map(([k, l]) => (
            <FilterChip key={k} active={tab === k} onClick={() => setTab(k)}>
              {l}
            </FilterChip>
          ))}
        </View>
        {list.length ? (
          <Card className="overflow-hidden">
            {list.map((n, i) => {
              const k = KIND[n.kind]
              const job = jobs.find((j) => j.id === n.jobId)
              // Without a job there is nowhere to go: the tap just marks it read.
              const href = job ? ((job.status === 'request' ? `/request?id=${job.id}` : `/jobs/detail?id=${job.id}`) as Href) : undefined
              return (
                <Tappable
                  key={n.id}
                  href={href}
                  onPress={() => markRead(n.id)}
                  className={cn('flex-row gap-3 p-4 active:bg-canvas active:opacity-100', i > 0 && 'border-t border-line', !n.read && 'bg-brand-soft/40')}
                >
                  <View className={cn('size-10 shrink-0 items-center justify-center rounded-full', k.tone)}>
                    <Icon as={k.icon} className={cn('size-5', k.tone)} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <View className="flex-row items-baseline justify-between gap-2">
                      <Text className={cn('shrink text-sm', n.read ? 'font-bold' : 'font-extrabold')}>{n.title}</Text>
                      <Text className="shrink-0 text-[11px] font-semibold text-faint">{ago(n.at)}</Text>
                    </View>
                    <Text className="mt-0.5 text-sm font-medium text-muted">{n.body}</Text>
                    <Text className="mt-1.5 text-[10.5px] font-bold uppercase tracking-wider text-faint">{k.label}</Text>
                  </View>
                  {!n.read && <View accessibilityLabel="Unread" className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" />}
                </Tappable>
              )
            })}
          </Card>
        ) : (
          <Empty icon={<Icon as={BellOff} className="size-5" />} title="Nothing here" />
        )}
      </Page>
    </>
  )
}
