'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo, useState } from 'react'
import { Clock3, MapPin, Siren } from 'lucide-react'
import { AssignModal, BookingDrawer } from '@/components/BookingDrawer'
import { DispatchMap, type MapLayers } from '@/components/DispatchMap'
import { ApplianceGlyph } from '@/components/glyphs'
import { useToast } from '@/components/toast'
import { Avatar, Button, Card, CardHeader, Page, PageHeader, PriorityTag, StatusChip } from '@/components/ui'
import { APPLIANCE_LABEL, BRAND_LABEL } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ago, dayLabel, time } from '@/lib/format'
import { candidates } from '@/lib/geo'
import { LIVE, OPEN } from '@/lib/status'
import { useStore, useTick } from '@/lib/store'
import type { Booking } from '@/lib/types'

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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
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
            bookings={q.onMap}
            technicians={store.technicians}
            layers={layers}
            onOpen={setOpen}
            customerName={(id) => store.customer(id)?.name}
          />
        </Card>

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
                  <QueueCard key={b.id} b={b} urgent onOpen={() => setOpen(b.id)} onNearest={() => assignNearest(b)} onChoose={() => setAssign(b)} />
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
                  <QueueCard key={b.id} b={b} onOpen={() => setOpen(b.id)} onNearest={() => assignNearest(b)} onChoose={() => setAssign(b)} />
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
    </Page>
  )
}

/** One waiting booking with the nearest free technician already worked out. */
function QueueCard({ b, urgent, onOpen, onNearest, onChoose }: { b: Booking; urgent?: boolean; onOpen: () => void; onNearest: () => void; onChoose: () => void }) {
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
        <Button size="xs" variant="secondary" onClick={onChoose}>
          Choose…
        </Button>
        <Button size="xs" variant={urgent ? 'danger' : 'primary'} onClick={onNearest} disabled={!best}>
          Assign nearest
        </Button>
      </div>
    </li>
  )
}
