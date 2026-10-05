'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Banknote, ChevronRight, CircleCheck, Hourglass, Landmark, Smartphone, TrendingUp, Wallet } from 'lucide-react'
import { ApplianceGlyph } from '@/components/glyphs'
import { Card, Page, ScreenHeader, SectionTitle } from '@/components/ui'
import { APPLIANCES, APPLIANCE_LABEL, inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { billTotal, earned, isToday, thisMonth, withinDays } from '@/lib/format'
import { jobHref } from '@/lib/routes'
import { useStore } from '@/lib/store'

type Range = 'today' | 'week' | 'month'

export default function EarningsPage() {
  const { jobs, settings } = useStore()
  const [range, setRange] = useState<Range>('week')
  const closed = jobs.filter((j) => j.status === 'closed')
  const inRange = closed.filter((j) =>
    range === 'today' ? isToday(j.scheduledAt) : range === 'week' ? withinDays(j.scheduledAt, 7) : thisMonth(j.scheduledAt)
  )
  const total = inRange.reduce((s, j) => s + earned(j), 0)
  const sum = (list: typeof closed) => list.reduce((s, j) => s + earned(j), 0)
  const totals = {
    today: sum(closed.filter((j) => isToday(j.scheduledAt))),
    week: sum(closed.filter((j) => withinDays(j.scheduledAt, 7))),
    month: sum(closed.filter((j) => thisMonth(j.scheduledAt))),
  }
  // Billed but not yet collected: the work is done, the money isn't in.
  const pending = jobs.filter((j) => j.bill && !j.bill.paid && j.status !== 'cancelled' && j.status !== 'rejected')
  // The partner keeps 80% of the bill; the rest is the platform fee.
  const share = Math.round(total * 0.8)
  const cash = inRange.filter((j) => j.bill?.method === 'cash').reduce((s, j) => s + earned(j), 0)

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (6 - i))
    const sum = closed
      .filter((j) => {
        const x = new Date(j.scheduledAt)
        return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth() && x.getDate() === d.getDate()
      })
      .reduce((s, j) => s + earned(j), 0)
    return { d, sum }
  })

  const byAppliance = APPLIANCES.map((a) => ({
    a,
    n: inRange.filter((j) => j.appliance === a).length,
    sum: inRange.filter((j) => j.appliance === a).reduce((s, j) => s + earned(j), 0),
  })).sort((x, y) => y.sum - x.sum)
  const maxA = Math.max(1, ...byAppliance.map((x) => x.sum))

  return (
    <>
      <ScreenHeader back="/home" title="Earnings" subtitle="Service revenue & payouts" />
      <Page className="space-y-5">
        {/* The three periods side by side; tapping one scopes the page below. */}
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ['today', 'Today', totals.today],
              ['week', 'This week', totals.week],
              ['month', 'This month', totals.month],
            ] as const
          ).map(([key, label, value]) => (
            <button
              key={key}
              type="button"
              aria-pressed={range === key}
              onClick={() => setRange(key)}
              className={cn(
                'rounded-xl border px-3 py-3 text-left transition-colors',
                range === key ? 'border-brand bg-brand-soft ring-1 ring-brand/20' : 'border-line bg-card hover:border-line-strong'
              )}
            >
              <span className={cn('block text-[11px] font-bold uppercase tracking-wider', range === key ? 'text-brand' : 'text-faint')}>{label}</span>
              <span className="num mt-1 block truncate text-lg font-extrabold leading-tight">{inr(value)}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Card className="flex items-center gap-3 p-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
              <CircleCheck className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-faint">Completed services</span>
              <span className="num block text-lg font-extrabold leading-tight">{inRange.length}</span>
            </span>
          </Card>
          <Card className="flex items-center gap-3 p-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning">
              <Hourglass className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-faint">Pending payments</span>
              <span className="num block truncate text-lg font-extrabold leading-tight">
                {inr(pending.reduce((s, j) => s + billTotal(j), 0))}
                <span className="ml-1 text-xs font-bold text-muted">· {pending.length}</span>
              </span>
            </span>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <Card className="overflow-hidden">
            <div className="bg-brand-ink p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-wider text-white/60">Service revenue</p>
              <p className="num mt-1 text-[34px] font-extrabold leading-none tracking-tight">{inr(total)}</p>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-white/70">
                <TrendingUp className="size-4 text-[#4ade80]" /> {inRange.length} jobs · avg {inr(inRange.length ? total / inRange.length : 0)}
              </p>
            </div>
            <dl className="grid grid-cols-2 divide-x divide-line">
              <div className="p-4">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-faint">Your share (80%)</dt>
                <dd className="num mt-1 text-lg font-extrabold text-success">{inr(share)}</dd>
              </div>
              <div className="p-4">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-faint">Cash to deposit</dt>
                <dd className="num mt-1 text-lg font-extrabold">{inr(cash)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-4">
            <div className="mb-7 flex items-baseline justify-between">
              <h2 className="text-sm font-extrabold">Last 7 days</h2>
              <span className="num text-xs font-bold text-muted">{inr(days.reduce((s, d) => s + d.sum, 0))}</span>
            </div>
            <BarChart days={days} />
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section>
            <SectionTitle>By appliance</SectionTitle>
            <Card className="divide-y divide-line">
              {byAppliance.map(({ a, n, sum }) => (
                <div key={a} className="flex items-center gap-3 p-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                    <ApplianceGlyph appliance={a} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold">{APPLIANCE_LABEL[a]}</span>
                      <span className="num text-sm font-extrabold">{inr(sum)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${(sum / maxA) * 100}%` }} />
                      </div>
                      <span className="num w-12 text-right text-[11px] font-semibold text-muted">{n} jobs</span>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </section>

          <section>
            <SectionTitle>Payouts</SectionTitle>
            <Card className="divide-y divide-line">
              <div className="flex items-center gap-3 p-4">
                <span className="grid size-10 place-items-center rounded-xl bg-success-soft text-success">
                  <Wallet className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-extrabold">Next payout · tonight 11 PM</p>
                  <p className="text-xs font-medium text-muted">Settled daily to {settings.bank}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Smartphone className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-extrabold">UPI collections</p>
                  <p className="num text-xs font-medium text-muted">{settings.upi}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4">
                <span className="grid size-10 place-items-center rounded-xl bg-warning-soft text-warning">
                  <Banknote className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-extrabold">Cash deposit</p>
                  <p className="text-xs font-medium text-muted">Kondapur hub counter, before 9 PM</p>
                </div>
              </div>
              <Link href="/settings" className="flex items-center gap-3 p-4 hover:bg-canvas">
                <span className="grid size-10 place-items-center rounded-xl bg-canvas text-ink-2">
                  <Landmark className="size-5" />
                </span>
                <span className="flex-1 text-sm font-extrabold">Payment settings</span>
                <ChevronRight className="size-4 text-faint" />
              </Link>
            </Card>
          </section>
        </div>

        <section>
          <SectionTitle count={inRange.length}>Completed jobs</SectionTitle>
          <Card className="divide-y divide-line">
            {inRange.slice(0, 12).map((j) => (
              <Link key={j.id} href={jobHref(j)} className="flex items-center gap-3 p-3 hover:bg-canvas">
                <ApplianceGlyph appliance={j.appliance} className="size-5 text-brand" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  <span className="font-extrabold">{j.customer.name}</span> · {APPLIANCE_LABEL[j.appliance]}
                </span>
                <span className="num text-sm font-extrabold">{inr(earned(j))}</span>
              </Link>
            ))}
            {inRange.length === 0 && <p className="p-4 text-sm font-medium text-muted">No completed jobs in this period yet.</p>}
          </Card>
        </section>
      </Page>
    </>
  )
}

/** One series, so no legend: the title names it. Hover or tap a bar for its value. */
function BarChart({ days }: { days: { d: Date; sum: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1000, ...days.map((d) => d.sum))
  const nice = Math.ceil(max / 2000) * 2000
  const H = 140
  return (
    <div className="relative">
      <div className="relative flex h-[140px] items-end gap-2 border-b border-line-strong">
        {[0.5, 1].map((t) => (
          <div key={t} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: H * t }}>
            <span className="num absolute -top-4 right-0 text-[10px] font-semibold text-faint">{inr(nice * t)}</span>
          </div>
        ))}
        {days.map((d, i) => {
          const h = (d.sum / nice) * H
          const today = i === days.length - 1
          return (
            <button
              key={i}
              type="button"
              aria-label={`${d.d.toLocaleDateString('en-IN', { weekday: 'long' })}: ${inr(d.sum)}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => setHover(i)}
              className="relative flex h-full flex-1 items-end justify-center"
            >
              <span
                className={cn('w-full max-w-7 rounded-t-[4px] transition-colors', today ? 'bg-brand' : hover === i ? 'bg-brand/70' : 'bg-brand/35')}
                style={{ height: Math.max(h, d.sum ? 3 : 0) }}
              />
              {hover === i && (
                <span className="num absolute z-10 -translate-y-1 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-bold text-white shadow-float" style={{ bottom: Math.max(h, 0) + 6 }}>
                  {inr(d.sum)}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-1.5 flex gap-2">
        {days.map((d, i) => (
          <span key={i} className={cn('flex-1 text-center text-[11px] font-bold', i === days.length - 1 ? 'text-brand' : 'text-muted')}>
            {i === days.length - 1 ? 'Today' : d.d.toLocaleDateString('en-IN', { weekday: 'short' })}
          </span>
        ))}
      </div>
    </div>
  )
}
