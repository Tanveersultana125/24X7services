'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock, MapPin, Navigation, Phone, Play, ShieldCheck, Siren } from 'lucide-react'
import { ApplianceGlyph, BrandTag } from '@/components/glyphs'
import { Card, Empty, Page, ScreenHeader, SectionTitle, StatusChip } from '@/components/ui'
import { applianceTitle, inr } from '@/lib/catalog'
import { ago, directionsHref, telHref, time } from '@/lib/format'
import { jobHref, stepHref } from '@/lib/routes'
import { isActive } from '@/lib/status'
import { useStore, useTick } from '@/lib/store'
import type { Job } from '@/lib/types'

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
            <div className="grid gap-3 lg:grid-cols-2">
              {mine.map((j) => (
                <EmergencyCard key={j.id} job={j} />
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionTitle count={open.length}>Waiting for a technician</SectionTitle>
          {open.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {open.map((j) => (
                <EmergencyCard key={j.id} job={j} />
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

function EmergencyCard({ job }: { job: Job }) {
  const { accept, advance } = useStore()
  const router = useRouter()
  const isRequest = job.status === 'request'
  return (
    <Card className="overflow-hidden border-danger/40">
      <div className="flex items-center justify-between bg-danger px-4 py-2 text-white">
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider">
          <Siren className="size-3.5" /> High priority
        </span>
        <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-danger">Emergency</span>
      </div>
      <Link href={jobHref(job)} className="block p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger">
            <ApplianceGlyph appliance={job.appliance} className="size-7" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <BrandTag brand={job.brand} />
              {!isRequest && <StatusChip status={job.status} />}
            </div>
            <p className="mt-1 text-[16px] font-extrabold leading-snug tracking-tight">{applianceTitle(job.brand, job.appliance)}</p>
            <p className="text-sm font-semibold text-ink-2">&ldquo;{job.issue}&rdquo;</p>
          </div>
          <p className="num text-right text-sm font-extrabold text-success">{inr(job.estFee)}</p>
        </div>
        <div className="mt-3 space-y-1.5 text-sm font-semibold text-muted">
          <p className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-danger" />
            <span className="truncate">
              <span className="text-ink">{job.customer.name}</span> · {job.customer.area} · <span className="num">{job.distanceKm} km</span>
            </span>
          </p>
          <p className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" />
            Requested <span className="num text-ink">{time(job.requestedAt)}</span> · {ago(job.requestedAt)}
          </p>
        </div>
      </Link>
      <div className="grid grid-cols-4 border-t border-line">
        {isRequest ? (
          <button type="button" onClick={() => accept(job.id)} className="col-span-4 h-14 bg-success text-base font-extrabold text-white hover:brightness-95">
            ACCEPT EMERGENCY JOB
          </button>
        ) : (
          <>
            <a href={directionsHref(job.customer.lat, job.customer.lng)} target="_blank" rel="noreferrer" className="flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-ink-2 hover:bg-canvas">
              <Navigation className="size-4 text-brand" /> Navigate
            </a>
            <a href={telHref(job.customer.phone)} className="flex h-14 flex-col items-center justify-center gap-0.5 border-x border-line text-[11px] font-bold text-ink-2 hover:bg-canvas">
              <Phone className="size-4 text-success" /> Call
            </a>
            <button
              type="button"
              onClick={() => {
                if (job.status === 'accepted') advance(job.id, 'on_the_way')
                else if (job.status === 'on_the_way') advance(job.id, 'arrived')
                router.push(stepHref('detail', job.id))
              }}
              className="col-span-2 flex h-14 items-center justify-center gap-1.5 bg-brand text-sm font-extrabold text-white hover:bg-brand-deep"
            >
              <Play className="size-4 fill-white" />
              {job.status === 'accepted' ? 'Start service' : job.status === 'on_the_way' ? 'Mark arrived' : 'Continue'}
            </button>
          </>
        )}
      </div>
    </Card>
  )
}
