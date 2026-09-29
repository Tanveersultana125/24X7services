'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useState } from 'react'
import { BellOff, BriefcaseBusiness, CalendarClock, CircleX, IndianRupee, MessageCircle, Siren, Star, Zap } from 'lucide-react'
import { Card, Empty, FilterChip, Page, ScreenHeader } from '@/components/ui'
import { cn } from '@/lib/cn'
import { ago } from '@/lib/format'
import { useStore, useTick } from '@/lib/store'
import type { NotificationKind } from '@/lib/types'

const KIND: Record<NotificationKind, { icon: typeof Zap; tone: string; label: string }> = {
  request: { icon: Zap, tone: 'bg-brand-soft text-brand', label: 'New request' },
  assigned: { icon: BriefcaseBusiness, tone: 'bg-brand-soft text-brand', label: 'Assigned' },
  customer: { icon: MessageCircle, tone: 'bg-info-soft text-info', label: 'Customer' },
  schedule: { icon: CalendarClock, tone: 'bg-warning-soft text-warning', label: 'Schedule' },
  cancelled: { icon: CircleX, tone: 'bg-canvas text-muted', label: 'Cancelled' },
  emergency: { icon: Siren, tone: 'bg-danger text-white', label: 'Emergency' },
  payment: { icon: IndianRupee, tone: 'bg-success-soft text-success', label: 'Payment' },
  rating: { icon: Star, tone: 'bg-warning-soft text-warning', label: 'Rating' },
}

type Tab = 'all' | 'jobs' | 'payments'

export default function NotificationsPage() {
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
            <button type="button" onClick={markAllRead} className="h-10 rounded-xl px-3 text-sm font-bold text-brand hover:bg-brand-soft">
              Mark all read
            </button>
          )
        }
      />
      <Page className="space-y-4">
        <div className="flex gap-2">
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
        </div>
        {list.length ? (
          <Card className="divide-y divide-line overflow-hidden">
            {list.map((n) => {
              const k = KIND[n.kind]
              const job = jobs.find((j) => j.id === n.jobId)
              const href = (job ? (job.status === 'request' ? `/request/?id=${job.id}` : `/jobs/detail/?id=${job.id}`) : '/notifications') as Route
              return (
                <Link key={n.id} href={href} onClick={() => markRead(n.id)} className={cn('flex gap-3 p-4 hover:bg-canvas', !n.read && 'bg-brand-soft/40')}>
                  <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', k.tone)}>
                    <k.icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn('text-sm', n.read ? 'font-bold' : 'font-extrabold')}>{n.title}</span>
                      <span className="shrink-0 text-[11px] font-semibold text-faint">{ago(n.at)}</span>
                    </span>
                    <span className="mt-0.5 block text-sm font-medium text-muted">{n.body}</span>
                    <span className="mt-1.5 inline-block text-[10.5px] font-bold uppercase tracking-wider text-faint">{k.label}</span>
                  </span>
                  {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                </Link>
              )
            })}
          </Card>
        ) : (
          <Empty icon={<BellOff className="size-5" />} title="Nothing here" />
        )}
      </Page>
    </>
  )
}
