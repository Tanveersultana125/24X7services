'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { BriefcaseBusiness, History, Search, Siren } from 'lucide-react'
import { NO_FILTERS, applyFilters, type FilterState } from '@/components/Filters'
import { ApplianceGlyph } from '@/components/glyphs'
import { JobCard, variantOf, type CardVariant } from '@/components/JobCard'
import { Empty, FilterChip, Page, ScreenHeader, SectionTitle } from '@/components/ui'
import { APPLIANCES, APPLIANCE_LABEL, BRANDS, BRAND_LABEL } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { isToday, matchesQuery } from '@/lib/format'
import type { Job } from '@/lib/types'
import { useStore } from '@/lib/store'

/** The Jobs screen's chips, in the order a job moves — Emergency last, as a cut across them. */
const CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'on_the_way', label: 'On The Way' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'emergency', label: 'Emergency' },
] as const

type Chip = (typeof CHIPS)[number]['key']

const CHIP_MATCH: Record<Chip, (j: Job, v: CardVariant) => boolean> = {
  all: () => true,
  new: (_, v) => v === 'request' || v === 'emergency',
  accepted: (_, v) => v === 'accepted',
  on_the_way: (_, v) => v === 'on_the_way',
  in_progress: (_, v) => v === 'in_progress',
  completed: (_, v) => v === 'completed',
  emergency: (j, v) => j.priority === 'emergency' && v !== 'completed' && v !== 'cancelled',
}

const inChip = (j: Job, c: Chip) => CHIP_MATCH[c](j, variantOf(j))

export default function JobsPage() {
  const { jobs } = useStore()
  const [status, setStatus] = useState<Chip>('all')
  const [filters, setFilters] = useState<FilterState>(NO_FILTERS)
  const [q, setQ] = useState('')

  // Today's board: everything scheduled today plus open requests.
  const board = useMemo(
    () => jobs.filter((j) => j.status !== 'rejected' && (j.status === 'request' || isToday(j.scheduledAt))),
    [jobs]
  )

  const shown = applyFilters(board, filters)
    .filter((j) => inChip(j, status))
    .filter((j) => matchesQuery(j, q))
    .sort((a, b) => Number(b.status === 'request') - Number(a.status === 'request') || a.scheduledAt.localeCompare(b.scheduledAt))

  const count = (k: Chip) => board.filter((j) => inChip(j, k)).length

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
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {CHIPS.map((c) => (
            <FilterChip key={c.key} active={status === c.key} onClick={() => setStatus(c.key)}>
              {c.key === 'emergency' && <Siren className={cn('size-3.5', status === c.key ? 'text-white' : 'text-danger')} aria-hidden />}
              {c.label} <span className="num opacity-60">{count(c.key)}</span>
            </FilterChip>
          ))}
        </div>

        <div className="space-y-2">
          <ChipRow label="Brand">
            {BRANDS.map((b) => (
              <MiniChip key={b} active={filters.brands.includes(b)} onClick={() => setFilters((f) => ({ ...f, brands: toggle(f.brands, b) }))}>
                {BRAND_LABEL[b]}
              </MiniChip>
            ))}
          </ChipRow>
          <ChipRow label="Service">
            {APPLIANCES.map((a) => (
              <MiniChip key={a} active={filters.appliances.includes(a)} onClick={() => setFilters((f) => ({ ...f, appliances: toggle(f.appliances, a) }))}>
                <ApplianceGlyph appliance={a} className="size-3.5" />
                {APPLIANCE_LABEL[a]}
              </MiniChip>
            ))}
          </ChipRow>
        </div>

        <section>
          <SectionTitle count={shown.length}>{status === 'all' ? 'Today’s board' : CHIPS.find((c) => c.key === status)!.label}</SectionTitle>
          {shown.length ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-[11px] font-bold uppercase tracking-wider text-faint">{label}</span>
      <div className="no-scrollbar -mr-4 flex min-w-0 flex-1 gap-1.5 overflow-x-auto pr-4 lg:mr-0 lg:flex-wrap lg:pr-0">{children}</div>
    </div>
  )
}

function MiniChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 text-[12.5px] font-bold transition-colors',
        active ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-card text-ink-2 hover:border-line-strong'
      )}
    >
      {children}
    </button>
  )
}
