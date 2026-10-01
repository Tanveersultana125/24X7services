'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useMemo, useState } from 'react'
import { Check, Eye, EyeOff, Flag, MessageSquareText, Star, ThumbsUp } from 'lucide-react'
import { BookingDrawer } from '@/components/BookingDrawer'
import { HBars } from '@/components/charts'
import { useToast } from '@/components/toast'
import { Avatar, Button, Card, CardHeader, Chip, Empty, Page, PageHeader, Select, StatCard, Tabs } from '@/components/ui'
import { cn } from '@/lib/cn'
import { ago, withinDays } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { Review } from '@/lib/types'

const STATUS: Record<Review['status'], { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  published: { label: 'Published', tone: 'success' },
  flagged: { label: 'Flagged', tone: 'warning' },
  hidden: { label: 'Hidden', tone: 'neutral' },
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn('size-4', i <= value ? 'fill-warning text-warning' : 'fill-line text-line')} aria-hidden />
      ))}
    </span>
  )
}

/** What customers say about technicians, and the moderation queue for it. */
export default function Reviews() {
  const store = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<'all' | Review['status']>('all')
  const [stars, setStars] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all')
  const [booking, setBooking] = useState<string | null>(null)

  const r = store.reviews
  const m = useMemo(() => {
    const last30 = r.filter((x) => withinDays(x.at, 30))
    return {
      avg: last30.length ? last30.reduce((s, x) => s + x.rating, 0) / last30.length : 0,
      five: r.length ? Math.round((r.filter((x) => x.rating === 5).length / r.length) * 100) : 0,
      dist: [5, 4, 3, 2, 1].map((n) => ({ key: `${n}`, label: `${n} ★`, value: r.filter((x) => x.rating === n).length })),
    }
  }, [r])

  const shown = r.filter((x) => (tab === 'all' || x.status === tab) && (stars === 'all' || x.rating === Number(stars))).sort((a, z) => z.at.localeCompare(a.at))

  const act = (x: Review, status: Review['status'], msg: string) => {
    store.setReviewStatus(x.id, status)
    toast(msg)
  }

  return (
    <Page>
      <PageHeader
        side="customer" title="Reviews & Ratings" sub="Customer feedback on every completed job" />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <StatCard label="Average · 30 days" value={m.avg.toFixed(2)} icon={<Star />} toneName="warning" />
        <StatCard label="Total reviews" value={r.length} icon={<MessageSquareText />} />
        <StatCard label="5★ share" value={`${m.five}%`} icon={<ThumbsUp />} toneName="success" />
        <StatCard label="Flagged" value={r.filter((x) => x.status === 'flagged').length} icon={<Flag />} toneName="danger" hint={<span>Waiting for review</span>} />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="h-fit">
          <CardHeader title="Rating distribution" sub={`${r.length} reviews, all time`} />
          <div className="p-5">
            <HBars rows={m.dist} format={(n) => n.toLocaleString('en-IN')} />
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <Tabs
            className="px-3"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'all', label: 'All', count: r.length },
              { value: 'flagged', label: 'Flagged', count: r.filter((x) => x.status === 'flagged').length, alert: true },
              { value: 'published', label: 'Published', count: r.filter((x) => x.status === 'published').length },
              { value: 'hidden', label: 'Hidden', count: r.filter((x) => x.status === 'hidden').length },
            ]}
          />
          <div className="flex items-center justify-between gap-2 border-b border-line p-4">
            <p className="text-[13px] font-semibold text-muted">{shown.length} reviews</p>
            <Select
              label="Rating"
              value={stars}
              onChange={setStars}
              options={[
                { value: 'all', label: 'All ratings' },
                ...(['5', '4', '3', '2', '1'] as const).map((n) => ({ value: n, label: `${n} star${n === '1' ? '' : 's'}` })),
              ]}
            />
          </div>
          {shown.length === 0 ? (
            <Empty icon={<MessageSquareText />} title="No reviews here" body="Try another tab or rating." />
          ) : (
            <ul className="divide-y divide-line">
              {shown.map((x) => {
                const c = store.customer(x.customerId)
                const t = store.technician(x.technicianId)
                return (
                  <li key={x.id} className={cn('px-5 py-4', x.status === 'hidden' && 'opacity-60')}>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Stars value={x.rating} />
                      <Chip tone={STATUS[x.status].tone}>{STATUS[x.status].label}</Chip>
                      <span className="ml-auto text-xs font-medium text-faint">{ago(x.at)}</span>
                    </div>
                    <p className={cn('mt-2 text-sm font-medium', x.text ? 'text-ink' : 'italic text-faint')}>{x.text || 'Rated without a comment.'}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-muted">
                      {c && (
                        <Link href={`/customers/?id=${c.id}` as Route} className="flex items-center gap-1.5 hover:text-brand">
                          <Avatar name={c.name} size={20} side="customer" /> {c.name}
                        </Link>
                      )}
                      {t && (
                        <Link href={`/technicians/?id=${t.id}` as Route} className="hover:text-brand">
                          for <span className="font-bold text-ink-2">{t.name}</span>
                        </Link>
                      )}
                      <button type="button" onClick={() => setBooking(x.bookingId)} className="num font-bold text-brand hover:underline">
                        {x.bookingId}
                      </button>
                      <span className="ml-auto flex gap-1.5">
                        {x.status === 'flagged' && (
                          <Button size="xs" variant="secondary" onClick={() => act(x, 'published', `${x.id} reviewed and published`)}>
                            <Check /> Mark reviewed
                          </Button>
                        )}
                        {x.status !== 'hidden' ? (
                          <Button size="xs" variant="subtle" onClick={() => act(x, 'hidden', `${x.id} hidden from the app`)}>
                            <EyeOff /> Hide
                          </Button>
                        ) : (
                          <Button size="xs" variant="secondary" onClick={() => act(x, 'published', `${x.id} published`)}>
                            <Eye /> Publish
                          </Button>
                        )}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <BookingDrawer id={booking} onClose={() => setBooking(null)} />
    </Page>
  )
}
