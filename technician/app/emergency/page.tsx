'use client'

import { ShieldCheck, Siren } from 'lucide-react'
import { JobCard } from '@/components/JobCard'
import { Empty, Page, ScreenHeader, SectionTitle } from '@/components/ui'
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
        <div className="relative overflow-hidden rounded-card bg-[#8f1d17] p-4 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full border-[24px] border-white/[0.06]" />
          <div className="flex items-center gap-3">
            <span className="relative grid size-12 place-items-center rounded-full bg-white/15">
              <span className="animate-pulse-ring absolute inset-1 rounded-full bg-white/25" />
              <Siren className="relative size-6" />
            </span>
            <div>
              <p className="num text-2xl font-extrabold leading-none">{open.length} open</p>
              <p className="mt-1 text-sm font-medium text-white/75">Target: accept within 2 min, arrive within 45 min.</p>
            </div>
          </div>
          {!online && <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold">You’re offline — go online to take emergency jobs.</p>}
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

