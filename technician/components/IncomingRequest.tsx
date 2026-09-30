'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Clock, MapPin, Navigation, X } from 'lucide-react'
import { applianceTitle, inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ago, time } from '@/lib/format'
import { jobHref, stepHref } from '@/lib/routes'
import type { Job } from '@/lib/types'
import { chime } from '@/lib/chime'
import { inShift } from '@/lib/shift'
import { useStore, useTick } from '@/lib/store'
import { ApplianceGlyph, BrandTag } from './glyphs'
import { PriorityBadge } from './ui'

const WINDOW = 30

const SEEN_KEY = 'technician.seenRequests'

function readSeen(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

/**
 * Requests already put in front of the technician this session. Kept in
 * sessionStorage so a reload doesn't throw the same alert up again.
 */
const shown = new Set<string>(typeof window === 'undefined' ? [] : readSeen())
const session = { primed: shown.size > 0 }

function remember(id: string) {
  shown.add(id)
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...shown]))
  } catch {
    /* private mode — the alert may repeat after a reload */
  }
}

/**
 * The takeover for a request that has just come in. It is the one thing in
 * the app allowed to interrupt: a request left unanswered goes to the next
 * technician, so it has to be impossible to miss and quick to answer — the
 * two answers are the two biggest targets on the screen.
 *
 * Letting the timer run out is not a rejection. The request stays in the
 * Jobs list until dispatch reassigns it.
 */
export function IncomingRequest() {
  const { jobs, online, settings } = useStore()
  const pathname = usePathname()
  const [, force] = useState(0)
  // Re-check each minute so a shift starting mid-session starts the alerts.
  const now = useTick(60_000)

  const byUrgency = (a: Job, b: Job) =>
    Number(b.priority === 'emergency') - Number(a.priority === 'emergency') || b.requestedAt.localeCompare(a.requestedAt)

  // On first load only the most urgent waiting request interrupts; the rest
  // are already on Home. Anything that arrives after that gets its own turn.
  // (The first render already shows the most urgent one, so this can wait
  // for an effect.)
  useEffect(() => {
    if (session.primed || !jobs.length) return
    session.primed = true
    jobs.filter((j) => j.status === 'request').sort(byUrgency).slice(1).forEach((j) => remember(j.id))
  }, [jobs])

  // Settings decide what may interrupt: emergencies on their own switch (and
  // at any hour, as the Working hours note promises); everything else needs
  // the requests switch and falls inside the shift. Held-back requests still
  // wait in Jobs.
  const onShift = inShift(settings, new Date(now))
  const interrupts = (j: Job) => (j.priority === 'emergency' ? settings.notify.emergency : settings.notify.requests && onShift)
  const pending = jobs.filter((j) => j.status === 'request' && !shown.has(j.id) && interrupts(j)).sort(byUrgency)
  const job = online && !pathname.startsWith('/request') ? pending[0] : undefined
  if (!job) return null

  return (
    <Takeover
      key={job.id}
      job={job}
      onDone={() => {
        remember(job.id)
        force((n) => n + 1)
      }}
    />
  )
}

/** Keyed by job, so each request starts its own fresh countdown. */
function Takeover({ job, onDone }: { job: Job; onDone: () => void }) {
  const { accept, reject, settings } = useStore()
  const router = useRouter()
  const [left, setLeft] = useState(WINDOW)
  const dismiss = onDone
  const sound = settings.notify.sound

  useEffect(() => {
    if (sound) chime(job.priority === 'emergency')
  }, [sound, job.priority])

  useEffect(() => {
    const i = setInterval(() => setLeft((l) => l - 1), 1000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    if (left <= 0) onDone()
  }, [left, onDone])

  const emergency = job.priority === 'emergency'
  const r = 22
  const c = 2 * Math.PI * r

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 backdrop-blur-[2px] sm:items-center" role="alertdialog" aria-modal="true" aria-labelledby="incoming-title">
      <div className="animate-slide-up w-full overflow-hidden rounded-t-3xl bg-card shadow-float sm:max-w-md sm:rounded-3xl">
        <div className={cn('relative px-5 pb-5 pt-5 text-white', emergency ? 'bg-[#b3261e]' : 'bg-brand-ink')}>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Decide later"
            className="absolute right-3 top-3 grid size-10 place-items-center rounded-full text-white/70 hover:bg-white/10"
          >
            <X className="size-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="relative grid size-14 place-items-center">
              <span className="animate-pulse-ring absolute inset-2 rounded-full bg-white/30" />
              <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90">
                <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="3" />
                <circle
                  cx="26"
                  cy="26"
                  r={r}
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={c}
                  strokeDashoffset={c * (1 - Math.max(left, 0) / WINDOW)}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <span className="num relative text-lg font-extrabold">{Math.max(left, 0)}</span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                {emergency ? 'Emergency · respond now' : 'Incoming'}
              </p>
              <h2 id="incoming-title" className="text-xl font-extrabold tracking-tight">
                New Service Request
              </h2>
              <p className="text-xs font-semibold text-white/70">Received {ago(job.requestedAt)}</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className={cn('grid size-12 shrink-0 place-items-center rounded-xl', emergency ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand')}>
              <ApplianceGlyph appliance={job.appliance} className="size-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <BrandTag brand={job.brand} />
                <PriorityBadge priority={job.priority} />
              </div>
              <p className="mt-1 text-lg font-extrabold leading-tight tracking-tight">{applianceTitle(job.brand, job.appliance)}</p>
              <p className="text-sm font-semibold text-ink-2">&ldquo;{job.issue}&rdquo;</p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-canvas text-center">
            <div className="px-2 py-2.5">
              <dt className="text-[10.5px] font-bold uppercase tracking-wider text-faint">Distance</dt>
              <dd className="num mt-0.5 flex items-center justify-center gap-1 text-[15px] font-extrabold">
                <Navigation className="size-3.5 text-brand" aria-hidden />
                {job.distanceKm} km
              </dd>
            </div>
            <div className="px-2 py-2.5">
              <dt className="text-[10.5px] font-bold uppercase tracking-wider text-faint">Requested</dt>
              <dd className="num mt-0.5 flex items-center justify-center gap-1 text-[15px] font-extrabold">
                <Clock className="size-3.5 text-brand" aria-hidden />
                {emergency ? 'ASAP' : time(job.scheduledAt)}
              </dd>
            </div>
            <div className="px-2 py-2.5">
              <dt className="text-[10.5px] font-bold uppercase tracking-wider text-faint">Est. fee</dt>
              <dd className="num mt-0.5 text-[15px] font-extrabold text-success">{inr(job.estFee)}</dd>
            </div>
          </dl>

          <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-muted">
            <MapPin className="size-4 shrink-0" aria-hidden />
            <span className="truncate">
              <span className="text-ink">{job.customer.name}</span> · {job.customer.area}
            </span>
            <Link href={jobHref(job)} onClick={dismiss} className="ml-auto shrink-0 text-xs font-bold text-brand">
              Full details
            </Link>
          </p>

          <div className="mt-5 grid grid-cols-[1fr_1.6fr] gap-2.5">
            <button
              type="button"
              onClick={() => {
                reject(job.id)
                dismiss()
              }}
              className="h-14 rounded-xl border-2 border-line-strong text-[15px] font-extrabold text-ink-2 hover:border-danger hover:text-danger"
            >
              REJECT
            </button>
            <button
              type="button"
              onClick={() => {
                accept(job.id)
                dismiss()
                router.push(stepHref('detail', job.id))
              }}
              className="h-14 rounded-xl bg-success text-[15px] font-extrabold text-white hover:brightness-95"
            >
              ACCEPT JOB
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
