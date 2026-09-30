'use client'

import Link from 'next/link'
import { useState } from 'react'
import { History } from 'lucide-react'
import { ActiveFilters, FilterButton, NO_FILTERS, applyFilters, type FilterState } from '@/components/Filters'
import { ApplianceGlyph, BrandTag } from '@/components/glyphs'
import { Card, Empty, FilterChip, Page, ScreenHeader, Segmented, StatusChip } from '@/components/ui'
import { APPLIANCE_LABEL, BRAND_LABEL, inr } from '@/lib/catalog'
import { dayLabel, earned, isToday, shortDate, thisMonth, withinDays } from '@/lib/format'
import { jobHref } from '@/lib/routes'
import { useStore } from '@/lib/store'
import type { Job } from '@/lib/types'

type Range = 'today' | 'week' | 'month'

const RANGE: Record<Range, (iso: string) => boolean> = {
  today: isToday,
  week: (iso) => withinDays(iso, 7),
  month: thisMonth,
}

export default function HistoryPage() {
  const { jobs } = useStore()
  const [range, setRange] = useState<Range>('week')
  const [filters, setFilters] = useState<FilterState>(NO_FILTERS)
  const [outcome, setOutcome] = useState<'all' | 'closed' | 'cancelled'>('all')

  // History is finished work only; open jobs live on the Jobs board.
  const finished = applyFilters(
    jobs.filter((j) => (j.status === 'closed' || j.status === 'cancelled') && RANGE[range](j.scheduledAt)),
    filters
  )
  const rows = finished.filter((j) => outcome === 'all' || j.status === outcome).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))

  const completed = finished.filter((j) => j.status === 'closed')
  const cancelled = finished.filter((j) => j.status === 'cancelled')
  const total = completed.reduce((s, j) => s + earned(j), 0)

  const groups = rows.reduce<Record<string, Job[]>>((g, j) => {
    const k = dayLabel(j.scheduledAt)
    ;(g[k] ??= []).push(j)
    return g
  }, {})

  return (
    <>
      <ScreenHeader back="/jobs" title="Job history" subtitle="Completed and cancelled jobs" />
      <Page className="space-y-4">
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
          ]}
        />

        <div className="flex gap-2">
          {(
            [
              ['all', 'All', finished.length],
              ['closed', 'Completed', completed.length],
              ['cancelled', 'Cancelled', cancelled.length],
            ] as const
          ).map(([k, label, n]) => (
            <FilterChip key={k} active={outcome === k} onClick={() => setOutcome(k)}>
              {label} <span className="num opacity-70">{n}</span>
            </FilterChip>
          ))}
        </div>

        <Card className="grid grid-cols-3 divide-x divide-line">
          <div className="p-3 text-center">
            <p className="num text-xl font-extrabold text-success">{completed.length}</p>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Completed</p>
          </div>
          <div className="p-3 text-center">
            <p className="num text-xl font-extrabold text-muted">{cancelled.length}</p>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Cancelled</p>
          </div>
          <div className="p-3 text-center">
            <p className="num text-xl font-extrabold">{inr(total)}</p>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Billed</p>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-muted">
            {rows.length} record{rows.length === 1 ? '' : 's'}
          </p>
          <FilterButton value={filters} onChange={setFilters} />
        </div>
        <ActiveFilters value={filters} onChange={setFilters} />

        {rows.length === 0 ? (
          <Empty icon={<History className="size-5" />} title="Nothing in this range" body="Change the period or clear filters." />
        ) : (
          <>
            {/* Desktop: a proper table */}
            <Card className="hidden overflow-hidden lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-canvas text-[11px] font-bold uppercase tracking-wider text-faint">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Appliance</th>
                    <th className="px-4 py-2.5">Brand</th>
                    <th className="px-4 py-2.5">Service</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((j) => (
                    <tr key={j.id} className="hover:bg-canvas/70">
                      <td className="num px-4 py-3 font-semibold text-muted">
                        <Link href={jobHref(j)} className="block">
                          {shortDate(j.scheduledAt)}
                          <span className="block text-[11px] text-faint">{j.id}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {j.customer.name}
                        <span className="block text-xs font-medium text-muted">{j.customer.area}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <span className="flex items-center gap-2">
                          <ApplianceGlyph appliance={j.appliance} className="size-4 text-brand" />
                          {APPLIANCE_LABEL[j.appliance]}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">{BRAND_LABEL[j.brand]}</td>
                      <td className="px-4 py-3 text-ink-2">{j.service}</td>
                      <td className="num px-4 py-3 text-right font-extrabold">{j.status === 'closed' ? inr(earned(j)) : '—'}</td>
                      <td className="px-4 py-3">
                        <StatusChip status={j.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Phone: grouped rows */}
            <div className="space-y-5 lg:hidden">
              {Object.entries(groups).map(([day, list]) => (
                <section key={day}>
                  <p className="mb-2 flex items-baseline justify-between text-xs font-extrabold uppercase tracking-wider text-faint">
                    {day}
                    <span className="num normal-case tracking-normal">{inr(list.reduce((s, j) => s + earned(j), 0))}</span>
                  </p>
                  <Card className="divide-y divide-line">
                    {list.map((j) => (
                      <Link key={j.id} href={jobHref(j)} className="flex items-center gap-3 p-3 hover:bg-canvas">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                          <ApplianceGlyph appliance={j.appliance} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <BrandTag brand={j.brand} />
                            <span className="truncate text-sm font-extrabold">{APPLIANCE_LABEL[j.appliance]}</span>
                          </span>
                          <span className="mt-0.5 block truncate text-xs font-medium text-muted">
                            {j.customer.name} · {j.service}
                          </span>
                        </span>
                        <span className="flex flex-col items-end gap-1">
                          <span className="num text-sm font-extrabold">{j.status === 'closed' ? inr(earned(j)) : '—'}</span>
                          <StatusChip status={j.status} />
                        </span>
                      </Link>
                    ))}
                  </Card>
                </section>
              ))}
            </div>
          </>
        )}
      </Page>
    </>
  )
}
