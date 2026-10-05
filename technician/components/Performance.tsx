'use client'

import { useMemo, useState } from 'react'
import { BadgeCheck, CalendarCheck, Clock, Star, Timer, XCircle, Wrench } from 'lucide-react'
import { applianceTitle } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { isToday, shortDate, thisMonth, withinDays } from '@/lib/format'
import { seedReviews } from '@/lib/seed'
import { useStore } from '@/lib/store'
import type { Job, Review } from '@/lib/types'
import { Card, FilterChip, SectionTitle, Segmented, Sheet } from './ui'

type Period = 'today' | 'week' | 'month' | 'all'

const IN_PERIOD: Record<Exclude<Period, 'all'>, (iso: string) => boolean> = {
  today: isToday,
  week: (iso) => withinDays(iso, 7),
  month: thisMonth,
}

const median = (xs: number[]) => {
  if (!xs.length) return undefined
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}

/**
 * Worked out from the jobs on this device for Today, Week and Month. All time
 * adds the lifetime record from the partner profile for jobs and rating; the
 * other figures stay device-only and say so, rather than inventing history.
 */
function metrics(jobs: Job[], period: Period, lifetime: { completed: number; rating: number }) {
  const mine = jobs.filter((j) => j.status !== 'request' && j.status !== 'rejected')
  const inP = period === 'all' ? mine : mine.filter((j) => IN_PERIOD[period](j.scheduledAt))
  const completed = inP.filter((j) => j.status === 'closed')
  const cancelled = inP.filter((j) => j.status === 'cancelled')
  const arrived = inP.filter((j) => j.log.arrived)
  const onTime = arrived.filter((j) => new Date(j.log.arrived!).getTime() <= new Date(j.scheduledAt).getTime() + 15 * 60_000)
  const rated = completed.filter((j) => j.confirmation?.rating)
  const response = median(
    inP
      .filter((j) => j.log.accepted)
      .map((j) => (new Date(j.log.accepted!).getTime() - new Date(j.requestedAt).getTime()) / 60_000)
      .filter((m) => m >= 0 && m < 24 * 60)
  )
  const closedHere = mine.filter((j) => j.status === 'closed').length
  const decided = completed.length + cancelled.length
  return {
    completed: period === 'all' ? lifetime.completed + closedHere : completed.length,
    total: period === 'all' ? lifetime.completed + closedHere + cancelled.length + (inP.length - decided) : inP.length,
    rating: period === 'all' ? lifetime.rating : rated.length ? rated.reduce((s, j) => s + j.confirmation!.rating, 0) / rated.length : undefined,
    ratedCount: rated.length,
    cancelRate: decided ? (cancelled.length / decided) * 100 : undefined,
    onTime: arrived.length ? (onTime.length / arrived.length) * 100 : undefined,
    response,
  }
}

export function PerformanceSection() {
  const { jobs, tech } = useStore()
  const [period, setPeriod] = useState<Period>('month')
  const m = metrics(jobs, period, { completed: tech.completedJobs, rating: tech.rating })
  const dash = '—'

  const cards: { icon: typeof Star; label: string; value: string; sub?: string; tone?: string }[] = [
    { icon: BadgeCheck, label: 'Completed jobs', value: m.completed.toLocaleString('en-IN'), tone: 'text-success' },
    { icon: Star, label: 'Customer rating', value: m.rating !== undefined ? `★ ${m.rating.toFixed(2)}` : dash, sub: period === 'all' ? `${tech.ratingCount.toLocaleString('en-IN')} ratings` : m.ratedCount ? `${m.ratedCount} rated` : 'No ratings yet' },
    { icon: Wrench, label: 'Total services', value: m.total.toLocaleString('en-IN') },
    { icon: XCircle, label: 'Cancellation rate', value: m.cancelRate !== undefined ? `${m.cancelRate.toFixed(1)}%` : dash },
    { icon: CalendarCheck, label: 'On-time arrival', value: m.onTime !== undefined ? `${Math.round(m.onTime)}%` : dash, sub: 'Within 15 min of slot' },
    { icon: Timer, label: 'Avg response time', value: m.response !== undefined ? `${Math.max(1, Math.round(m.response))} min` : dash, sub: 'Request to accept' },
  ]

  return (
    <section>
      <SectionTitle action={<span className="text-xs font-bold text-muted">{tech.experienceYears} yrs experience</span>}>Performance</SectionTitle>
      <Segmented
        size="sm"
        className="mb-3"
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'today', label: 'Today' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'all', label: 'All time' },
        ]}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-3.5">
            <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-faint">
              <c.icon className="size-3.5" /> {c.label}
            </p>
            <p className={cn('num mt-1 text-xl font-extrabold leading-tight', c.tone)}>{c.value}</p>
            {c.sub && <p className="mt-0.5 truncate text-[11px] font-medium text-muted">{c.sub}</p>}
          </Card>
        ))}
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-faint">
        <Clock className="size-3" />
        {period === 'all' ? 'Jobs and rating use your lifetime partner record; other figures use jobs on this device.' : 'Worked out from jobs on this device.'}
      </p>
    </section>
  )
}

/** Reviews from sign-offs on this device plus the ones already on record. */
function useReviews(): Review[] {
  const { jobs } = useStore()
  return useMemo(() => {
    const fromJobs: Review[] = jobs
      .filter((j) => j.confirmation?.review?.trim())
      .map((j) => ({
        id: j.id,
        name: j.customer.name,
        rating: j.confirmation!.rating,
        at: j.confirmation!.at ?? j.scheduledAt,
        text: j.confirmation!.review,
        appliance: applianceTitle(j.brand, j.appliance),
      }))
    const seen = new Set(fromJobs.map((r) => r.text.trim()))
    return [...fromJobs, ...seedReviews().filter((r) => !seen.has(r.text.trim()))].sort((a, b) => b.at.localeCompare(a.at))
  }, [jobs])
}

export function ReviewsSection() {
  const { tech } = useStore()
  const reviews = useReviews()
  const [all, setAll] = useState(false)
  const [stars, setStars] = useState<number | null>(null)
  const total = tech.ratingBreakdown.reduce((a, b) => a + b, 0) || 1
  const shown = stars ? reviews.filter((r) => r.rating === stars) : reviews

  return (
    <section>
      <SectionTitle>Customer reviews</SectionTitle>
      <Card className="overflow-hidden">
        {/* Overall + distribution */}
        <div className="flex gap-4 p-4">
          <div className="shrink-0 text-center">
            <p className="num text-4xl font-extrabold leading-none tracking-tight">{tech.rating.toFixed(2)}</p>
            <p className="mt-1 text-xs font-bold text-muted">out of 5</p>
            <Stars n={Math.round(tech.rating)} className="mt-1.5 justify-center" />
            <p className="num mt-1 text-[11px] font-semibold text-faint">{tech.ratingCount.toLocaleString('en-IN')} ratings</p>
          </div>
          <ul className="min-w-0 flex-1 space-y-1.5 self-center" aria-label="Rating distribution">
            {tech.ratingBreakdown.map((count, i) => {
              const star = 5 - i
              const pct = (count / total) * 100
              return (
                <li key={star} className="flex items-center gap-2 text-xs font-bold">
                  <span className="num w-6 shrink-0 text-ink-2">{star}★</span>
                  <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-canvas">
                    <span className={cn('block h-full rounded-full', star >= 4 ? 'bg-success' : star === 3 ? 'bg-warning' : 'bg-danger')} style={{ width: `${pct}%` }} />
                  </span>
                  <span className="num w-9 shrink-0 text-right text-muted">{pct < 1 && pct > 0 ? '<1' : Math.round(pct)}%</span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="divide-y divide-line border-t border-line">
          {reviews.slice(0, 3).map((r) => (
            <ReviewRow key={r.id} r={r} />
          ))}
        </div>
        <button type="button" onClick={() => setAll(true)} className="w-full border-t border-line py-3 text-sm font-extrabold text-brand hover:bg-brand-soft">
          View all reviews · {reviews.length}
        </button>
      </Card>

      <Sheet open={all} onClose={() => setAll(false)} title={`All reviews · ${reviews.length}`}>
        <div className="no-scrollbar -mx-4 -mt-4 flex gap-2 overflow-x-auto border-b border-line px-4 py-3">
          <FilterChip active={stars === null} onClick={() => setStars(null)}>
            All
          </FilterChip>
          {[5, 4, 3, 2, 1].map((n) => (
            <FilterChip key={n} active={stars === n} onClick={() => setStars(n)}>
              {n}★ <span className="num opacity-70">{reviews.filter((r) => r.rating === n).length}</span>
            </FilterChip>
          ))}
        </div>
        <div className="-mx-4 -mb-4 divide-y divide-line">
          {shown.length ? shown.map((r) => <ReviewRow key={r.id} r={r} />) : <p className="p-4 text-sm font-medium text-muted">No {stars}★ reviews yet.</p>}
        </div>
      </Sheet>
    </section>
  )
}

function ReviewRow({ r }: { r: Review }) {
  return (
    <figure className="p-4">
      <div className="flex items-center justify-between gap-2">
        <figcaption className="truncate text-sm font-extrabold">{r.name}</figcaption>
        <span className="num shrink-0 text-[11px] font-semibold text-faint">{shortDate(r.at)}</span>
      </div>
      <Stars n={r.rating} className="mt-1" />
      <blockquote className="mt-1.5 text-sm font-medium text-ink-2">&ldquo;{r.text}&rdquo;</blockquote>
      <p className="mt-1 text-[11px] font-semibold text-faint">{r.appliance}</p>
    </figure>
  )
}

function Stars({ n, className }: { n: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn('size-3.5', i <= n ? 'fill-warning text-warning' : 'text-line-strong')} aria-hidden />
      ))}
    </div>
  )
}
