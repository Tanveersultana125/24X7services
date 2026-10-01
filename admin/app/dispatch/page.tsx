'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo, useState } from 'react'
import { Activity, Clock3, HousePlus, LocateOff, MapPin, Navigation, Siren, UserRoundCheck, UserRoundX, Wrench } from 'lucide-react'
import { AssignModal, BookingDrawer } from '@/components/BookingDrawer'
import { DispatchMap, type MapLayers } from '@/components/DispatchMap'
import { ApplianceGlyph } from '@/components/glyphs'
import { useToast } from '@/components/toast'
import { AssignJobModal } from '@/components/tech-assign'
import { LiveTechnicians, currentJob } from '@/components/tech-live'
import { Avatar, Button, Card, CardHeader, Page, PageHeader, PriorityTag, StatusChip } from '@/components/ui'
import { APPLIANCE_LABEL, BRAND_LABEL } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ago, dayLabel, time } from '@/lib/format'
import { candidates } from '@/lib/geo'
import { LIVE, OPEN } from '@/lib/status'
import { useStore, useTick } from '@/lib/store'
import type { Booking, Technician } from '@/lib/types'

type Focus = 'online' | 'offline' | 'active' | 'emergency' | 'en_route' | 'arrived' | 'in_progress'

export default function DispatchPage() {
  return (
    <Suspense>
      <Dispatch />
    </Suspense>
  )
}

/** The live board: where everyone is, and what still needs a technician. */
function Dispatch() {
  const store = useStore()
  const toast = useToast()
  const params = useSearchParams()
  useTick(30_000)
  const [open, setOpen] = useState<string | null>(params.get('id'))
  const [assign, setAssign] = useState<Booking | null>(null)
  const [layers, setLayers] = useState<MapLayers>({ techs: true, offline: false, bookings: true })
  const [focus, setFocus] = useState<Focus | null>(null)
  const [assignTo, setAssignTo] = useState<Technician | null>(null)

  const [lastId, setLastId] = useState(params.get('id'))
  if (params.get('id') !== lastId) {
    setLastId(params.get('id'))
    setOpen(params.get('id'))
  }

  const q = useMemo(() => {
    const today = store.bookings.filter((b) => OPEN.includes(b.status) && b.status !== 'pending_payment' && dayLabel(b.scheduledAt) !== 'Yesterday')
    const bySlot = (a: Booking, b: Booking) => a.scheduledAt.localeCompare(b.scheduledAt)
    return {
      onMap: today.filter((b) => dayLabel(b.scheduledAt) === 'Today' || b.priority === 'emergency'),
      emergency: today.filter((b) => b.priority === 'emergency' && b.status === 'confirmed').sort(bySlot),
      unassigned: today.filter((b) => b.priority !== 'emergency' && b.status === 'confirmed').sort(bySlot),
      live: store.bookings.filter((b) => LIVE.includes(b.status)).sort(bySlot),
    }
  }, [store.bookings])

  const verified = store.technicians.filter((t) => t.kyc === 'verified')
  const count = (p: string) => verified.filter((t) => t.presence === p).length
  const canAssign = store.can('dispatch', 'assign')

  // What each counter selects: which jobs, and which technicians.
  const openJobs = store.bookings.filter((b) => OPEN.includes(b.status) && b.status !== 'pending_payment')
  const jobMatch: Record<Focus, (b: Booking) => boolean> = {
    online: () => true,
    offline: () => true,
    active: (b) => LIVE.includes(b.status),
    emergency: (b) => b.priority === 'emergency',
    en_route: (b) => b.status === 'en_route',
    arrived: (b) => b.status === 'arrived',
    in_progress: (b) => b.status === 'in_progress',
  }
  const counters: { key: Focus; label: string; n: number; icon: React.ReactNode; tone: string }[] = [
    { key: 'online', label: 'Online technicians', n: count('online') + count('on_job'), icon: <UserRoundCheck />, tone: 'text-success bg-success-soft' },
    { key: 'offline', label: 'Offline technicians', n: count('offline'), icon: <UserRoundX />, tone: 'text-muted bg-canvas' },
    { key: 'active', label: 'Active jobs', n: q.live.length, icon: <Activity />, tone: 'text-violet bg-violet-soft' },
    { key: 'emergency', label: 'Emergency jobs', n: openJobs.filter(jobMatch.emergency).length, icon: <Siren />, tone: 'text-danger bg-danger-soft' },
    { key: 'en_route', label: 'On the way', n: openJobs.filter(jobMatch.en_route).length, icon: <Navigation />, tone: 'text-info bg-info-soft' },
    { key: 'arrived', label: 'Arrived', n: openJobs.filter(jobMatch.arrived).length, icon: <HousePlus />, tone: 'text-violet bg-violet-soft' },
    { key: 'in_progress', label: 'In progress', n: openJobs.filter(jobMatch.in_progress).length, icon: <Wrench />, tone: 'text-violet bg-violet-soft' },
  ]
  const jobFocus = focus !== null && focus !== 'online' && focus !== 'offline'
  const mapBookings = jobFocus ? q.onMap.filter(jobMatch[focus]) : q.onMap
  const jobTechs = new Set(mapBookings.map((b) => b.technicianId))
  const mapTechs =
    focus === 'offline'
      ? verified.filter((t) => t.presence === 'offline')
      : focus === 'online'
        ? verified.filter((t) => t.presence !== 'offline')
        : jobFocus
          ? verified.filter((t) => jobTechs.has(t.id))
          : verified
  const mapLayers = focus === 'offline' ? { ...layers, offline: true } : layers
  const untracked = verified.filter((t) => t.presence !== 'offline' && !t.tracking).length
  const liveRows = (focus === 'offline' ? mapTechs : mapTechs.filter((t) => t.presence !== 'offline'))
    .map((t) => ({ t, job: currentJob(t, store.bookings) }))
    .filter((r) => !jobFocus || (r.job && jobMatch[focus](r.job)))
    .sort((a, z) => Number(!a.job) - Number(!z.job) || (a.job?.scheduledAt ?? '').localeCompare(z.job?.scheduledAt ?? ''))

  const assignNearest = (b: Booking) => {
    const best = candidates(b, store.technicians, store.bookings).find((c) => c.tech.presence !== 'offline' && !c.busy)
    if (!best) {
      toast('No free technician nearby — choose one manually')
      setAssign(b)
      return
    }
    store.assign(b.id, best.tech.id)
    toast(`${b.id} assigned to ${best.tech.name} · ~${best.eta} min away`)
  }

  const layerToggle = (k: keyof MapLayers, label: string, swatch: string) => (
    <button
      key={k}
      type="button"
      aria-pressed={layers[k]}
      onClick={() => setLayers((l) => ({ ...l, [k]: !l[k] }))}
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-lg border px-2.5 text-xs font-bold transition-colors',
        layers[k] ? 'border-line-strong bg-card text-ink' : 'border-line bg-canvas text-faint'
      )}
    >
      <span className={cn('size-2.5 rounded-full', swatch, !layers[k] && 'opacity-40')} aria-hidden />
      {label}
    </button>
  )

  return (
    <Page>
      <PageHeader
        title="Live Dispatch"
        sub={`${count('online') + count('on_job')} of ${verified.length} technicians on shift · ${q.live.length} live jobs · ${q.emergency.length + q.unassigned.length} waiting for a technician`}
      />

      <div className="no-scrollbar -mx-4 mb-5 flex gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 xl:grid-cols-7" role="toolbar" aria-label="Filter the board">
        {counters.map((c) => {
          const on = focus === c.key
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on}
              onClick={() => setFocus(on ? null : c.key)}
              className={cn(
                'flex min-w-[148px] items-center gap-3 rounded-card border bg-card px-3.5 py-3 text-left shadow-card transition-colors sm:min-w-0',
                on ? 'border-brand ring-1 ring-brand' : 'border-line hover:border-line-strong'
              )}
            >
              <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg [&_svg]:size-4', c.tone)}>{c.icon}</span>
              <span className="min-w-0">
                <span className={cn('num block text-xl font-extrabold leading-tight', c.key === 'emergency' && c.n > 0 && 'text-danger')}>{c.n}</span>
                <span className="block truncate text-[11px] font-bold text-muted">{c.label}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-5">
        <Card className="self-start">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
            <div className="flex flex-wrap gap-2">
              {layerToggle('bookings', 'Open bookings', 'bg-brand')}
              {layerToggle('techs', 'Technicians', 'bg-success')}
              {layerToggle('offline', 'Show offline', 'bg-faint')}
            </div>
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-muted">
              {[
                ['bg-danger', 'Emergency'],
                ['bg-warning', 'Unassigned'],
                ['bg-brand', 'Assigned'],
                ['bg-violet', 'Live / on job'],
                ['bg-success', 'Free technician'],
              ].map(([c, l]) => (
                <li key={l} className="flex items-center gap-1.5">
                  <span className={cn('size-2 rounded-full', c)} aria-hidden />
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <DispatchMap
            bookings={mapBookings}
            technicians={mapTechs}
            layers={mapLayers}
            onOpen={setOpen}
            customerName={(id) => store.customer(id)?.name}
          />
          {untracked > 0 && (
            <p className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-xs font-semibold text-muted sm:px-5">
              <LocateOff className="size-3.5" aria-hidden />
              {untracked} technician{untracked === 1 ? '' : 's'} on shift not sharing location: listed below, not drawn on the map.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Live technicians"
            sub={focus ? `Filtered: ${counters.find((c) => c.key === focus)!.label.toLowerCase()}` : 'Who is on shift, their current job and how far they are'}
            action={
              focus ? (
                <Button size="xs" variant="secondary" onClick={() => setFocus(null)}>
                  Clear filter
                </Button>
              ) : (
                <span className="num text-sm font-bold text-muted">{liveRows.length}</span>
              )
            }
          />
          <LiveTechnicians rows={liveRows} onOpen={setOpen} onReassign={setAssign} onAssign={setAssignTo} />
        </Card>
        </div>

        <div className="space-y-5">
          <Card className={cn(q.emergency.length > 0 && 'border-danger/30 ring-1 ring-danger/10')}>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Siren className="size-4 text-danger" aria-hidden /> Emergency queue
                  {q.emergency.length > 0 && <span className="num grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">{q.emergency.length}</span>}
                </span>
              }
              sub={`Target: technician on the way within ${store.settings.emergencySlaMin} min`}
            />
            {q.emergency.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm font-semibold text-muted">No emergency waiting.</p>
            ) : (
              <ul className="divide-y divide-line">
                {q.emergency.map((b) => (
                  <QueueCard key={b.id} b={b} urgent canAssign={canAssign} onOpen={() => setOpen(b.id)} onNearest={() => assignNearest(b)} onChoose={() => setAssign(b)} />
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Unassigned" sub="Paid, waiting for a technician" action={<span className="num text-sm font-bold text-muted">{q.unassigned.length}</span>} />
            {q.unassigned.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm font-semibold text-muted">Every paid booking has a technician.</p>
            ) : (
              <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
                {q.unassigned.map((b) => (
                  <QueueCard key={b.id} b={b} canAssign={canAssign} onOpen={() => setOpen(b.id)} onNearest={() => assignNearest(b)} onChoose={() => setAssign(b)} />
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Live jobs" sub="On the road or on site" action={<span className="num text-sm font-bold text-muted">{q.live.length}</span>} />
            <ul className="max-h-[360px] divide-y divide-line overflow-y-auto">
              {q.live.map((b) => {
                const t = store.technician(b.technicianId)
                return (
                  <li key={b.id}>
                    <button type="button" onClick={() => setOpen(b.id)} className="flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-canvas/60">
                      {t && <Avatar name={t.name} size={30} side="technician" />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{t?.name}</span>
                        <span className="block truncate text-xs font-medium text-muted">
                          {b.id} · {BRAND_LABEL[b.brand]} {APPLIANCE_LABEL[b.appliance]} · {b.area}
                        </span>
                      </span>
                      <StatusChip status={b.status} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      </div>

      <BookingDrawer id={open} onClose={() => setOpen(null)} />
      <AssignModal booking={assign} onClose={() => setAssign(null)} />
      {assignTo && <AssignJobModal tech={assignTo} onClose={() => setAssignTo(null)} />}
    </Page>
  )
}

/** One waiting booking with the nearest free technician already worked out. */
function QueueCard({
  b,
  urgent,
  canAssign,
  onOpen,
  onNearest,
  onChoose,
}: {
  b: Booking
  urgent?: boolean
  canAssign: boolean
  onOpen: () => void
  onNearest: () => void
  onChoose: () => void
}) {
  const store = useStore()
  const c = store.customer(b.customerId)
  const best = candidates(b, store.technicians, store.bookings).find((x) => x.tech.presence !== 'offline' && !x.busy)
  return (
    <li className="px-5 py-3.5">
      <button type="button" onClick={onOpen} className="flex w-full items-start gap-3 text-left">
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', urgent ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning')}>
          <ApplianceGlyph appliance={b.appliance} className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">
              {BRAND_LABEL[b.brand]} {APPLIANCE_LABEL[b.appliance]}
            </span>
            <PriorityTag priority={b.priority} />
          </span>
          <span className="block truncate text-xs font-medium text-ink-2">{b.issue}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-semibold text-muted">
            <span>
              {b.id} · {c?.name}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" aria-hidden /> {b.area}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3" aria-hidden /> {urgent ? `raised ${ago(b.createdAt)}` : `${dayLabel(b.scheduledAt)} ${time(b.scheduledAt)}`}
            </span>
          </span>
        </span>
      </button>
      <div className="mt-2.5 flex items-center gap-2 pl-12">
        <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-muted">
          {best ? (
            <>
              Nearest: <span className="font-bold text-ink">{best.tech.name}</span> · {best.distance} km · ~{best.eta} min
            </>
          ) : (
            'No free certified technician nearby'
          )}
        </p>
        {canAssign && (
          <>
            <Button size="xs" variant="secondary" onClick={onChoose}>
              Choose…
            </Button>
            <Button size="xs" variant={urgent ? 'danger' : 'primary'} onClick={onNearest} disabled={!best}>
              Assign nearest
            </Button>
          </>
        )}
      </div>
    </li>
  )
}
