'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { BriefcaseBusiness, History, Search } from 'lucide-react'
import { ActiveFilters, FilterButton, NO_FILTERS, applyFilters, type FilterState } from '@/components/Filters'
import { JobCard } from '@/components/JobCard'
import { Empty, FilterChip, Page, ScreenHeader, SectionTitle } from '@/components/ui'
import { isToday, matchesQuery } from '@/lib/format'
import { STATUS_FILTERS, inFilter, type StatusFilter } from '@/lib/status'
import { useStore } from '@/lib/store'

export default function JobsPage() {
  const { jobs } = useStore()
  const [status, setStatus] = useState<StatusFilter | 'all'>('all')
  const [filters, setFilters] = useState<FilterState>(NO_FILTERS)
  const [q, setQ] = useState('')

  // Today's board: everything scheduled today plus open requests.
  const board = useMemo(
    () => jobs.filter((j) => j.status !== 'rejected' && (j.status === 'request' || isToday(j.scheduledAt))),
    [jobs]
  )

  const shown = applyFilters(board, filters)
    .filter((j) => status === 'all' || inFilter(j.status, status))
    .filter((j) => matchesQuery(j, q))
    .sort((a, b) => Number(b.status === 'request') - Number(a.status === 'request') || a.scheduledAt.localeCompare(b.scheduledAt))

  const count = (k: StatusFilter) => board.filter((j) => inFilter(j.status, k)).length

  return (
    <>
      <ScreenHeader
        back="/home"
        title="Jobs"
        subtitle={`${board.length} on today’s board`}
        right={
          <Link href="/history" className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-brand hover:bg-brand-soft">
            <History className="size-4" /> History
          </Link>
        }
      />
      <Page className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Customer, area, job ID…"
              className="h-10 w-full rounded-xl border border-line-strong bg-card pl-10 pr-3 text-[15px] focus:border-brand"
            />
          </div>
          <FilterButton value={filters} onChange={setFilters} hideStatus />
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          <FilterChip active={status === 'all'} onClick={() => setStatus('all')}>
            All <span className="num opacity-60">{board.length}</span>
          </FilterChip>
          {STATUS_FILTERS.map((s) => (
            <FilterChip key={s.key} active={status === s.key} onClick={() => setStatus(s.key)}>
              {s.label} <span className="num opacity-60">{count(s.key)}</span>
            </FilterChip>
          ))}
        </div>
        <ActiveFilters value={filters} onChange={setFilters} />

        <section>
          <SectionTitle count={shown.length}>{status === 'all' ? 'Today’s board' : STATUS_FILTERS.find((s) => s.key === status)!.label}</SectionTitle>
          {shown.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {shown.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          ) : (
            <Empty icon={<BriefcaseBusiness className="size-5" />} title="No jobs match" body="Try another status, or clear the brand and appliance filters." />
          )}
        </section>
      </Page>
    </>
  )
}
