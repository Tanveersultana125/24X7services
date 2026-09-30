'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bell, ChevronRight, Search, SearchX, X, MessageCircle, Navigation, Phone, PowerOff, Siren, Star } from 'lucide-react'
import type { Route } from 'next'
import { AiMark, CallMark } from '@/components/ai/AiMark'
import { useAvailability } from '@/components/Availability'
import { ApplianceGlyph } from '@/components/glyphs'
import { JobCard } from '@/components/JobCard'
import { MenuButton } from '@/components/menu'
import { FlowBar } from '@/components/Timeline'
import { Avatar, Card, Empty, SectionTitle, StatusChip, Toggle } from '@/components/ui'
import { applianceTitle, inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { dayLabel, directionsHref, earned, isToday, matchesQuery, telHref, time } from '@/lib/format'
import { jobHref, stepHref } from '@/lib/routes'
import { IN_PROGRESS, NEXT_ACTION } from '@/lib/status'
import { useStore, useTick } from '@/lib/store'
import type { Job } from '@/lib/types'

export default function HomePage() {
  const store = useStore()
  useTick(30_000)
  const { jobs, tech, online } = store
  const avail = useAvailability()
  const [query, setQuery] = useState('')

  const requests = jobs
    .filter((j) => j.status === 'request')
    .sort((a, b) => Number(b.priority === 'emergency') - Number(a.priority === 'emergency') || b.requestedAt.localeCompare(a.requestedAt))
  const today = jobs.filter((j) => isToday(j.scheduledAt) && j.status !== 'request' && j.status !== 'rejected')
  const schedule = [...today].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const current =
    jobs.find((j) => IN_PROGRESS.includes(j.status)) ?? jobs.find((j) => j.status === 'on_the_way') ?? schedule.find((j) => j.status === 'accepted')
  const unread = store.notices.filter((n) => !n.read).length
  const emergencies = requests.filter((j) => j.priority === 'emergency')
  const emergencyWaiting = emergencies[0]
  // The next visit after the one in hand, and the last one finished.
  const upcoming = schedule.find((j) => (j.status === 'accepted' || j.status === 'assigned') && j.id !== current?.id)
  const recent = [...jobs].filter((j) => j.status === 'closed').sort((a, b) => (b.log.closed ?? b.scheduledAt).localeCompare(a.log.closed ?? a.scheduledAt))[0]

  const stats = {
    today: today.filter((j) => j.status !== 'cancelled').length,
    pending: jobs.filter((j) => j.status === 'assigned').length + requests.length,
    accepted: jobs.filter((j) => j.status === 'accepted').length,
    progress: jobs.filter((j) => j.status === 'on_the_way' || IN_PROGRESS.includes(j.status)).length,
    done: today.filter((j) => j.status === 'closed').length,
    earnings: today.reduce((s, j) => s + earned(j), 0),
  }
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      {/* Header */}
      <header className="bg-brand-ink pt-[var(--safe-top)] text-white">
        <div className="mx-auto max-w-5xl px-4 pb-4 pt-3 lg:px-8 lg:pb-6 lg:pt-6">
          <div className="flex items-center gap-3">
            <Link href="/profile" className="relative shrink-0">
              <Avatar name={tech.name} photo={tech.photo} size={42} className="ring-2 ring-white/15" />
              <span className={cn('absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-brand-ink', online ? 'bg-[#22c55e]' : 'bg-faint')} />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-extrabold leading-tight">{tech.name}</p>
              <p className="num mt-0.5 truncate text-[11.5px] font-semibold text-white/55">
                {tech.id} · {greeting}
              </p>
            </div>
            <MenuButton inverted className="order-first" />
            <Link href="/notifications" aria-label={`Notifications, ${unread} unread`} className="relative grid size-10 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/15">
              <Bell className="size-[18px]" />
              {unread > 0 && (
                <span className="num absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-extrabold ring-2 ring-brand-ink">
                  {unread}
                </span>
              )}
            </Link>
          </div>

          {/* Your availability: status, today's hours, radius — one tap to switch. */}
          <div
            className={cn(
              'mt-3.5 rounded-xl ring-1 transition-colors',
              avail.state === 'online' ? 'bg-[#22c55e]/[0.12] ring-[#22c55e]/25' : avail.state === 'offline' ? 'bg-white/[0.06] ring-white/10' : 'bg-[#f59e0b]/[0.12] ring-[#f59e0b]/25'
            )}
          >
            <div className="flex items-center gap-3 px-3 pb-2 pt-2.5">
              <span
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  avail.state === 'online' ? 'animate-blink bg-[#4ade80]' : avail.state === 'offline' ? 'bg-white/40' : 'bg-[#fbbf24]'
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/45">Your availability</p>
                <p
                  className={cn(
                    'truncate text-[13px] font-extrabold leading-tight',
                    avail.state === 'online' ? 'text-[#86efac]' : avail.state === 'offline' ? 'text-white/70' : 'text-[#fcd34d]'
                  )}
                >
                  {avail.headline.toUpperCase()} · <span className="font-semibold normal-case">{avail.detail}</span>
                </p>
              </div>
              <Toggle checked={online} onChange={store.setOnline} label="Availability" tone="success" />
            </div>
            <div className="flex items-center gap-3 border-t border-white/10 px-3 py-2 text-[11.5px] font-semibold text-white/60">
              <span className="num min-w-0 truncate">
                Today {avail.today} · {store.settings.radiusKm} km radius
              </span>
              <Link href={'/settings#availability' as Route} className="ml-auto shrink-0 font-extrabold text-white/85 hover:text-white">
                Manage
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 divide-x divide-white/10">
            <Link href="/earnings" className="pr-3">
              <p className="text-[11px] font-semibold text-white/55">Earned today</p>
              <p className="num mt-0.5 text-[19px] font-extrabold leading-tight tracking-tight">{inr(stats.earnings)}</p>
            </Link>
            <Link href="/profile" className="px-3">
              <p className="text-[11px] font-semibold text-white/55">Rating</p>
              <p className="num mt-0.5 flex items-center gap-1 text-[19px] font-extrabold leading-tight tracking-tight">
                {tech.rating.toFixed(2)}
                <Star className="size-3.5 fill-[#fbbf24] text-[#fbbf24]" />
              </p>
            </Link>
            <Link href="/history" className="pl-3">
              <p className="text-[11px] font-semibold text-white/55">Completed</p>
              <p className="num mt-0.5 text-[19px] font-extrabold leading-tight tracking-tight">
                {stats.done}
                <span className="text-[13px] font-bold text-white/45"> / {stats.today}</span>
              </p>
            </Link>
          </div>

          <label className="relative mt-4 block">
            <span className="sr-only">Search jobs</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer, area, job ID, appliance…"
              className="h-12 w-full rounded-xl border-0 bg-card pl-11 pr-11 text-[15px] font-medium text-ink shadow-card placeholder:text-faint focus:shadow-[0_0_0_3px_rgba(255,255,255,0.35)] [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
              >
                <X className="size-4" />
              </button>
            )}
          </label>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-28 pt-4 lg:px-8 lg:pb-16 lg:pt-6">
        {query.trim() ? (
          <SearchResults jobs={jobs.filter((j) => j.status !== 'rejected' && matchesQuery(j, query))} query={query.trim()} />
        ) : (
          <>
        {/* Today's pipeline */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {(
            [
              ["Today's jobs", stats.today, 'bg-ink', '/jobs'],
              ['Pending', stats.pending, 'bg-warning', '/jobs'],
              ['Accepted', stats.accepted, 'bg-brand', '/jobs'],
              ['In progress', stats.progress, 'bg-violet', '/jobs'],
              ['Completed', stats.done, 'bg-success', '/history'],
              ["Today's earnings", inr(stats.earnings), 'bg-success', '/earnings'],
            ] as const
          ).map(([label, value, bar, href]) => (
            <Link
              key={label}
              href={href}
              className="relative overflow-hidden rounded-xl border border-line bg-card px-2.5 pb-2.5 pt-3 shadow-card"
            >
              <span className={cn('absolute inset-x-0 top-0 h-[3px]', bar)} />
              <p className="num text-[22px] font-extrabold leading-none">{value}</p>
              <p className="mt-1.5 truncate text-[11.5px] font-semibold text-muted">{label}</p>
            </Link>
          ))}
        </div>

        {!online && (
          <div className="flex items-center gap-3 rounded-card border border-line-strong bg-card p-4">
            <div className="grid size-10 place-items-center rounded-full bg-canvas text-muted">
              <PowerOff className="size-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold">You’re offline</p>
              <p className="text-xs font-medium text-muted">Dispatch won’t send new requests. Assigned jobs stay on your list.</p>
            </div>
            <button type="button" onClick={() => store.setOnline(true)} className="h-10 rounded-lg bg-success px-3 text-sm font-extrabold text-white">
              Go online
            </button>
          </div>
        )}

        <AiAssistCard job={current} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-6">
            {emergencyWaiting && <EmergencyAlert job={emergencyWaiting} count={emergencies.length} />}
            {current && <CurrentJob job={current} />}
            {(upcoming || recent) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {upcoming && <MiniJob kicker="Upcoming service" job={upcoming} meta={`${dayLabel(upcoming.scheduledAt)}, ${time(upcoming.scheduledAt)}`} />}
                {recent && <MiniJob kicker="Recent job" job={recent} meta={`Completed · ${inr(earned(recent))}`} done />}
              </div>
            )}

            {/* New requests */}
            {requests.length > 0 && (
              <section>
                <SectionTitle
                  count={requests.length}
                  action={
                    <Link href="/emergency" className="flex items-center gap-1 text-xs font-bold text-danger">
                      <Siren className="size-4" /> Emergency desk
                    </Link>
                  }
                >
                  <span className="relative flex size-2.5">
                    <span className="animate-pulse-ring absolute inset-0 rounded-full bg-brand" />
                    <span className="relative size-2.5 rounded-full bg-brand" />
                  </span>
                  New requests
                </SectionTitle>
                <div className="space-y-3">
                  {requests.map((j) => (
                    <JobCard key={j.id} job={j} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Today's schedule */}
          <section>
            <SectionTitle
              count={schedule.length}
              action={
                <Link href="/jobs" className="flex items-center text-xs font-bold text-brand">
                  All jobs <ChevronRight className="size-4" />
                </Link>
              }
            >
              Today’s Service Jobs
            </SectionTitle>
            {schedule.length ? (
              <div className="space-y-3">
                {schedule.map((j) => (
                  <JobCard key={j.id} job={j} />
                ))}
              </div>
            ) : (
              <Empty icon={<Bell className="size-5" />} title="No jobs scheduled today" body="Stay online — new requests will appear here." />
            )}
          </section>
        </div>
          </>
        )}
      </main>
    </>
  )
}

/** The job in hand, with its next step one tap away. */
function CurrentJob({ job }: { job: Job }) {
  const next = NEXT_ACTION[job.status]
  const store = useStore()
  const needsScreen = job.status === 'diagnosis' ? stepHref('diagnosis', job.id) : job.status === 'repaired' ? stepHref('bill', job.id) : job.status === 'confirmation' ? stepHref('confirm', job.id) : null
  return (
    <section>
      <SectionTitle>Current job</SectionTitle>
      <Card className="overflow-hidden border-brand/30 ring-1 ring-brand/10">
        <Link href={jobHref(job)} className="block p-4">
          <div className="flex items-center justify-between gap-2">
            <StatusChip status={job.status} />
            <span className="num text-xs font-bold text-muted">
              {job.id} · {time(job.scheduledAt)}
            </span>
          </div>
          <div className="mt-3 flex items-start gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand text-white">
              <ApplianceGlyph appliance={job.appliance} className="size-7" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-extrabold leading-tight tracking-tight">{applianceTitle(job.brand, job.appliance)}</p>
              <p className="text-sm font-semibold text-ink-2">&ldquo;{job.issue}&rdquo;</p>
              <p className="mt-1 truncate text-xs font-semibold text-muted">
                {job.customer.name} · {job.customer.address}
              </p>
            </div>
          </div>
          <FlowBar job={job} className="mt-4" />
        </Link>
        <div className="grid grid-cols-3 border-t border-line">
          <a href={telHref(job.customer.phone)} className="flex h-12 items-center justify-center gap-1.5 text-sm font-bold text-ink-2 hover:bg-canvas">
            <Phone className="size-4" /> Call
          </a>
          <a href={`sms:${job.customer.phone.replace(/\s/g, '')}`} className="flex h-12 items-center justify-center gap-1.5 border-x border-line text-sm font-bold text-ink-2 hover:bg-canvas">
            <MessageCircle className="size-4" /> Chat
          </a>
          <a href={directionsHref(job.customer.lat, job.customer.lng)} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-1.5 text-sm font-bold text-ink-2 hover:bg-canvas">
            <Navigation className="size-4" /> Navigate
          </a>
        </div>
        {next && (
          <div className="border-t border-line p-3">
            {needsScreen ? (
              <Link href={needsScreen} className="flex h-14 items-center justify-center rounded-xl bg-brand text-base font-extrabold text-white hover:bg-brand-deep">
                {job.status === 'diagnosis' ? 'Record diagnosis' : next.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => store.advance(job.id, next.to)}
                className="flex h-14 w-full items-center justify-center rounded-xl bg-brand text-base font-extrabold text-white hover:bg-brand-deep"
              >
                {next.label}
              </button>
            )}
          </div>
        )}
      </Card>
    </section>
  )
}

/** Everything the technician has on record that matches, newest work first. */
function SearchResults({ jobs, query }: { jobs: Job[]; query: string }) {
  const sorted = [...jobs].sort(
    (a, b) => Number(b.status === 'request') - Number(a.status === 'request') || b.scheduledAt.localeCompare(a.scheduledAt)
  )
  return (
    <section>
      <SectionTitle count={sorted.length}>Results for &ldquo;{query}&rdquo;</SectionTitle>
      {sorted.length ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {sorted.slice(0, 30).map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      ) : (
        <Empty icon={<SearchX className="size-5" />} title="No jobs found" body="Try a customer name, area, job ID, brand or appliance." />
      )}
    </section>
  )
}

/**
 * The way into AI Assist from the dashboard. With a job in hand both buttons
 * open straight on it, so the technician never retypes the appliance.
 */
function AiAssistCard({ job }: { job?: Job }) {
  return (
    <Card className="flex flex-wrap items-center gap-3 p-4">
      <Link href="/ai" className="flex min-w-0 flex-1 basis-60 items-center gap-3">
        <AiMark size={44} />
        <span className="min-w-0">
          <span className="flex items-center gap-1 text-[15px] font-extrabold">
            AI Assistant <ChevronRight className="size-4 text-faint" />
          </span>
          <span className="block truncate text-xs font-medium text-muted">
            {job ? `Ready for ${applianceTitle(job.brand, job.appliance)} · ${job.issue}` : 'Diagnose faults, find parts, run customer calls'}
          </span>
        </span>
      </Link>
      <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
        <Link href={(job ? `/ai/chat/?id=${job.id}` : '/ai/chat') as Route} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-ink px-4 text-sm font-extrabold text-white hover:bg-brand">
          <AiMark size={18} className="bg-transparent" /> Ask AI
        </Link>
        <Link href={(job ? `/ai/call/?id=${job.id}` : '/ai') as Route} className="flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-line-strong px-4 text-sm font-extrabold hover:border-ink-2">
          <CallMark size={18} className="bg-transparent text-success" /> AI Call
        </Link>
      </div>
    </Card>
  )
}

/**
 * A waiting emergency, flagged without turning the dashboard red: a red rail
 * and label carry the priority, the card itself stays white.
 */
function EmergencyAlert({ job, count }: { job: Job; count: number }) {
  return (
    <Link href={`/request/?id=${job.id}` as Route} className="relative flex items-center gap-3 overflow-hidden rounded-card border border-danger/30 bg-card p-4 pl-5 shadow-card hover:border-danger/60">
      <span className="absolute inset-y-0 left-0 w-1 bg-danger" />
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger">
        <Siren className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.1em] text-danger">
          <span className="size-1.5 animate-blink rounded-full bg-danger" />
          Emergency request{count > 1 ? ` · ${count} waiting` : ''}
        </span>
        <span className="mt-0.5 block truncate text-[15px] font-extrabold">{applianceTitle(job.brand, job.appliance)}</span>
        <span className="block truncate text-xs font-medium text-muted">
          {job.customer.area} · {job.distanceKm} km · “{job.issue}”
        </span>
      </span>
      <span className="shrink-0 rounded-lg bg-danger px-3 py-2 text-xs font-extrabold text-white">Respond</span>
    </Link>
  )
}

function MiniJob({ kicker, job, meta, done }: { kicker: string; job: Job; meta: string; done?: boolean }) {
  return (
    <Link href={jobHref(job)} className="flex items-center gap-3 rounded-card border border-line bg-card p-3.5 shadow-card hover:border-line-strong">
      <span className={cn('grid size-11 shrink-0 place-items-center rounded-xl', done ? 'bg-success-soft text-success' : 'bg-brand-soft text-brand')}>
        <ApplianceGlyph appliance={job.appliance} className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-faint">{kicker}</span>
        <span className="block truncate text-sm font-extrabold">{applianceTitle(job.brand, job.appliance)}</span>
        <span className="block truncate text-xs font-medium text-muted">
          {job.customer.name} · <span className="num">{meta}</span>
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-faint" />
    </Link>
  )
}
