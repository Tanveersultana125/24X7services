'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronRight, Clock, Crosshair, Navigation, Phone, Route as RouteIcon } from 'lucide-react'
import { ApplianceGlyph, BrandTag } from '@/components/glyphs'
import { ServiceMap, type MapPin } from '@/components/ServiceMap'
import { PriorityBadge, StatusChip } from '@/components/ui'
import { applianceTitle } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { directionsHref, driveProgress, isToday, telHref, time } from '@/lib/format'
import { jobHref } from '@/lib/routes'
import { IN_PROGRESS, isOpen } from '@/lib/status'
import { useStore, useTick } from '@/lib/store'

export default function MapPage() {
  const { jobs, tech } = useStore()
  const now = useTick(5_000)
  const visible = jobs
    .filter((j) => j.status === 'request' || (isOpen(j) && isToday(j.scheduledAt)))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const active = jobs.find((j) => j.status === 'on_the_way' || IN_PROGRESS.includes(j.status))
  const [picked, setPicked] = useState<string | null>(null)
  const sel = visible.find((j) => j.id === picked) ?? active ?? visible[0]

  const pins: MapPin[] = visible.map((j) => ({
    id: j.id,
    lat: j.customer.lat,
    lng: j.customer.lng,
    tone: j.priority === 'emergency' && j.status === 'request' ? 'danger' : j.status === 'request' ? 'muted' : 'brand',
    active: j.id === sel?.id,
    label: j.id === sel?.id ? time(j.scheduledAt) : undefined,
  }))

  const progress = sel && sel.id === active?.id ? driveProgress(sel, now) : 0
  const remaining = sel ? Math.max(1, Math.round(sel.etaMin * (1 - progress))) : 0

  return (
    <div className="relative h-[calc(100dvh-64px-var(--safe-bottom))] lg:h-dvh">
      <ServiceMap fill insets={[0.2, 0.36]} className="absolute inset-0" pins={pins} to={sel ? sel.customer : undefined} progress={progress} onPin={setPicked} />

      {/* Top overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 p-3 pt-[calc(var(--safe-top)+0.75rem)] lg:p-6">
        <div className="pointer-events-auto mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-line bg-card/95 p-2 pl-3 shadow-float backdrop-blur">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">Service area map</p>
            <p className="truncate text-xs font-semibold text-muted">{tech.area}</p>
          </div>
          <div className="hidden items-center gap-3 pr-2 text-[11px] font-bold text-muted sm:flex">
            <Legend color="bg-brand" label="My jobs" />
            <Legend color="bg-danger" label="Emergency" />
            <Legend color="bg-faint" label="Requests" />
          </div>
          <button type="button" onClick={() => setPicked(active?.id ?? null)} aria-label="Centre on current job" className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
            <Crosshair className="size-5" />
          </button>
        </div>
        <div className="no-scrollbar pointer-events-auto mx-auto mt-2 flex max-w-3xl gap-2 overflow-x-auto">
          {visible.map((j) => (
            <button
              key={j.id}
              type="button"
              onClick={() => setPicked(j.id)}
              className={cn(
                'flex h-9 shrink-0 items-center gap-1.5 rounded-pill border px-3 text-xs font-bold shadow-card',
                j.id === sel?.id ? 'border-ink bg-ink text-white' : 'border-line bg-card text-ink-2'
              )}
            >
              <span className={cn('size-2 rounded-full', j.priority === 'emergency' && j.status === 'request' ? 'bg-danger' : j.status === 'request' ? 'bg-faint' : 'bg-brand')} />
              <span className="num">{time(j.scheduledAt)}</span> {j.customer.area}
            </button>
          ))}
        </div>
      </div>

      {/* Selected job */}
      {sel && (
        <div className="absolute inset-x-0 bottom-0 p-3 lg:p-6">
          <div className="animate-slide-up mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line bg-card shadow-float" key={sel.id}>
            <Link href={jobHref(sel)} className="flex items-start gap-3 p-4">
              <span className={cn('grid size-12 shrink-0 place-items-center rounded-xl', sel.priority === 'emergency' ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand')}>
                <ApplianceGlyph appliance={sel.appliance} className="size-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <BrandTag brand={sel.brand} />
                  <StatusChip status={sel.status} />
                  {sel.priority !== 'normal' && <PriorityBadge priority={sel.priority} />}
                </span>
                <span className="mt-1 block truncate text-base font-extrabold">{applianceTitle(sel.brand, sel.appliance)}</span>
                <span className="block truncate text-sm font-semibold text-muted">
                  {sel.customer.name} · {sel.customer.address}
                </span>
              </span>
              <ChevronRight className="mt-3 size-5 text-faint" />
            </Link>
            <div className="grid grid-cols-3 divide-x divide-line border-y border-line bg-canvas/60">
              <Stat icon={<RouteIcon className="size-3.5" />} label="Distance" value={`${(sel.distanceKm * (1 - progress)).toFixed(1)} km`} />
              <Stat icon={<Clock className="size-3.5" />} label="ETA" value={`${remaining} min`} />
              <Stat icon={<Clock className="size-3.5" />} label="Scheduled" value={time(sel.scheduledAt)} />
            </div>
            <div className="flex gap-2 p-3">
              {sel.status !== 'request' && (
                <a href={telHref(sel.customer.phone)} aria-label="Call customer" className="grid h-12 w-14 shrink-0 place-items-center rounded-xl border border-line-strong text-success">
                  <Phone className="size-5" />
                </a>
              )}
              <a
                href={directionsHref(sel.customer.lat, sel.customer.lng)}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-extrabold text-white hover:bg-brand-deep"
              >
                <Navigation className="size-5" /> Start navigation
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('size-2 rounded-full', color)} /> {label}
    </span>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-3 py-2.5">
      <p className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-faint">
        <span className="text-brand">{icon}</span> {label}
      </p>
      <p className="num text-[15px] font-extrabold">{value}</p>
    </div>
  )
}
