'use client'

import { ShieldCheck, Siren } from 'lucide-react'
import { JobCard } from '@/components/JobCard'
import { Empty, Page, ScreenHeader, SectionTitle } from '@/components/ui'
import { cn } from '@/lib/cn'
import { isActive } from '@/lib/status'
import { useStore, useTick } from '@/lib/store'

/**
 * The 24×7 desk: emergency requests only, with every action a technician
 * needs on the card itself — no detour through the detail screen.
 */
export default function EmergencyPage() {
  const { jobs, online } = useStore()
  useTick(20_000)
  const open = jobs.filter((j) => j.priority === 'emergency' && j.status === 'request').sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
  const mine = jobs.filter((j) => j.priority === 'emergency' && isActive(j))

  return (
    <>
      <ScreenHeader back="/home" title="Emergency Jobs" subtitle="24×7 high-priority desk" />
      <Page className="space-y-5">
        {/* Priority is carried by the rail, icon and numbers — the page stays white. */}
        <div className="relative overflow-hidden rounded-card border border-line bg-card shadow-card">
          <span className="absolute inset-y-0 left-0 w-1 bg-danger" />
          <div className="flex items-center gap-3 p-4 pl-5">
            <span className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger">
              {open.length > 0 && <span className="animate-pulse-ring absolute inset-1 rounded-xl bg-danger/20" />}
              <Siren className="relative size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-danger">24×7 priority desk</p>
              <p className="text-sm font-medium text-muted">Accept within 2 min · arrive within 45 min</p>
            </div>
          </div>
          <dl className="grid grid-cols-2 divide-x divide-line border-t border-line">
            <div className="px-4 py-3">
              <dt className="text-[10.5px] font-bold uppercase tracking-wider text-faint">Waiting</dt>
              <dd className={cn('num text-2xl font-extrabold leading-tight', open.length ? 'text-danger' : 'text-ink')}>{open.length}</dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-[10.5px] font-bold uppercase tracking-wider text-faint">Your emergency jobs</dt>
              <dd className="num text-2xl font-extrabold leading-tight">{mine.length}</dd>
            </div>
          </dl>
          {!online && <p className="border-t border-line bg-warning-soft px-4 py-2.5 text-xs font-bold text-warning">You’re offline — go online to take emergency jobs.</p>}
        </div>

        {mine.length > 0 && (
          <section>
            <SectionTitle count={mine.length}>Your emergency jobs</SectionTitle>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {mine.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionTitle count={open.length}>Waiting for a technician</SectionTitle>
          {open.length ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {open.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          ) : (
            <Empty icon={<ShieldCheck className="size-5" />} title="No open emergencies" body="You’ll get a full-screen alert the moment one comes in." />
          )}
        </section>
      </Page>
    </>
  )
}

