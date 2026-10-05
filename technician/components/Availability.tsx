'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Route } from 'next'
import { Coffee, Radar, ShieldAlert, SlidersHorizontal } from 'lucide-react'
import { DAYS, RADIUS_STEPS, WEEKDAYS, availability, range12, type Availability } from '@/lib/availability'
import { cn } from '@/lib/cn'
import { useStore, useTick } from '@/lib/store'
import type { DayKey, DayHours } from '@/lib/types'
import { TimeField } from './TimeField'
import { Card, SectionTitle, Toggle } from './ui'

export function useAvailability(): Availability {
  const { settings, online } = useStore()
  const now = useTick(60_000)
  return availability(settings, online, new Date(now))
}

/** Green when taking jobs, amber when online but held back, grey when off. */
export function tone(a: Availability) {
  if (a.state === 'online') return { dot: 'bg-success', text: 'text-success', soft: 'bg-success-soft', ring: 'border-success/30' }
  if (a.state === 'offline') return { dot: 'bg-faint', text: 'text-muted', soft: 'bg-canvas', ring: 'border-line-strong' }
  return { dot: 'bg-warning', text: 'text-warning', soft: 'bg-warning-soft', ring: 'border-warning/30' }
}

/**
 * Settings → Availability & Schedule. Everything that decides whether new
 * work reaches the technician, in one place: the switch, the week, the break,
 * the radius. None of it touches jobs already accepted.
 */
export function AvailabilitySettings() {
  const store = useStore()
  const { settings: s, updateSettings } = store
  const a = useAvailability()
  const c = tone(a)
  const waiting = store.jobs.filter((j) => j.status === 'request').length

  const setDay = (key: DayKey, patch: Partial<DayHours>) => updateSettings((cur) => ({ schedule: { ...cur.schedule, [key]: { ...cur.schedule[key], ...patch } } }))
  const copyMonday = () =>
    updateSettings((cur) => ({
      schedule: { ...cur.schedule, ...Object.fromEntries(WEEKDAYS.map((k) => [k, { ...cur.schedule.mon }])) },
    }))
  const weekdaysMatch = WEEKDAYS.every((k) => {
    const d = s.schedule[k]
    return d.on === s.schedule.mon.on && d.start === s.schedule.mon.start && d.end === s.schedule.mon.end
  })

  return (
    <section id="availability" className="scroll-mt-20 space-y-4">
      <SectionTitle>Availability & Schedule</SectionTitle>

      {/* Status */}
      <Card className={cn('overflow-hidden border', c.ring)}>
        <div className={cn('flex items-center gap-3 p-4', c.soft)}>
          <span className="relative flex size-3.5 shrink-0">
            {a.state === 'online' && <span className="animate-pulse-ring absolute inset-0 rounded-full bg-success" />}
            <span className={cn('relative size-3.5 rounded-full', c.dot)} />
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn('text-lg font-extrabold uppercase leading-tight tracking-wide', c.text)}>{store.online ? 'Online' : 'Offline'}</p>
            <p className="text-sm font-semibold text-ink-2">{a.detail}</p>
          </div>
          <Toggle checked={store.online} onChange={store.setOnline} label="Online for new jobs" tone="success" size="lg" />
        </div>
        <dl className="grid grid-cols-2 gap-px bg-line">
          <Summary label="Working today" value={a.today} />
          <Summary label="Break" value={s.breakTime.on ? range12(s.breakTime.start, s.breakTime.end) : 'No break'} />
          <Summary label="Service radius" value={`${s.radiusKm} km`} />
          <Summary label="Jobs" value={a.accepting ? 'Accepting new requests' : 'Not accepting new requests'} tone={a.accepting ? 'text-success' : 'text-muted'} />
        </dl>
      </Card>

      {/* Week */}
      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <p className="text-sm font-extrabold">Working schedule</p>
          <button
            type="button"
            onClick={copyMonday}
            disabled={weekdaysMatch}
            className="text-xs font-bold text-brand disabled:text-faint"
          >
            {weekdaysMatch ? 'Weekdays match' : 'Apply Monday to all weekdays'}
          </button>
        </div>
        <ul className="divide-y divide-line">
          {DAYS.map((d) => {
            const day = s.schedule[d.key]
            return (
              <li key={d.key} className="grid grid-cols-[2.75rem_auto_1fr] items-center gap-x-2 gap-y-2 px-4 py-2.5">
                <span className="w-11 shrink-0 text-sm font-extrabold">{d.short}</span>
                <div className="flex shrink-0 rounded-lg bg-ink/[0.06] p-0.5" role="group" aria-label={`${d.label} working or off`}>
                  {(['Working', 'Off'] as const).map((opt) => {
                    const active = (opt === 'Working') === day.on
                    return (
                      <button
                        key={opt}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setDay(d.key, { on: opt === 'Working' })}
                        className={cn('h-8 rounded-md px-2.5 text-[12px] font-bold transition-colors', active ? 'bg-card text-ink shadow-card' : 'text-muted')}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {day.on ? (
                  // Times drop to their own full-width line on a phone.
                  <div className="col-span-3 grid min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:col-span-1">
                    <TimeField compact label={`${d.label} start`} value={day.start} onChange={(v) => setDay(d.key, { start: v })} />
                    <span className="text-xs font-bold text-faint">–</span>
                    <TimeField compact label={`${d.label} end`} value={day.end} onChange={(v) => setDay(d.key, { end: v })} />
                  </div>
                ) : (
                  <span className="text-right text-sm font-semibold text-faint">Day off</span>
                )}
              </li>
            )
          })}
        </ul>
      </Card>

      {/* Break */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink-2">
            <Coffee className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">Break time</p>
            <p className="text-xs font-medium text-muted">{s.breakTime.on ? 'Not accepting new jobs during your break' : 'No daily break set'}</p>
          </div>
          <Toggle checked={s.breakTime.on} onChange={(v) => updateSettings((cur) => ({ breakTime: { ...cur.breakTime, on: v } }))} label="Daily break" />
        </div>
        {s.breakTime.on && (
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <TimeField compact label="Break start" value={s.breakTime.start} onChange={(v) => updateSettings((cur) => ({ breakTime: { ...cur.breakTime, start: v } }))} />
            <span className="text-xs font-bold text-faint">–</span>
            <TimeField compact label="Break end" value={s.breakTime.end} onChange={(v) => updateSettings((cur) => ({ breakTime: { ...cur.breakTime, end: v } }))} />
          </div>
        )}
        <p className="mt-3 text-[11.5px] font-medium text-faint">Appointments you’ve already accepted are not affected.</p>
      </Card>

      {/* Radius */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink-2">
            <Radar className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">Service radius</p>
            <p className="text-xs font-medium text-muted">You may receive service requests within your selected radius.</p>
          </div>
          <span className="num text-lg font-extrabold text-brand">{s.radiusKm} km</span>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Service radius">
          {RADIUS_STEPS.map((km) => (
            <button
              key={km}
              type="button"
              role="radio"
              aria-checked={s.radiusKm === km}
              onClick={() => updateSettings({ radiusKm: km })}
              className={cn(
                'num h-11 rounded-xl border text-sm font-extrabold transition-colors',
                s.radiusKm === km ? 'border-brand bg-brand text-white' : 'border-line-strong bg-card text-ink-2 hover:border-brand'
              )}
            >
              {km} km
            </button>
          ))}
        </div>
        <p className="num mt-2.5 text-xs font-semibold text-muted">
          {waiting === 0 ? `No requests waiting within ${s.radiusKm} km` : `${waiting} request${waiting === 1 ? '' : 's'} waiting within ${s.radiusKm} km`}
        </p>
      </Card>

      {/* Preferences */}
      <Card className="flex items-center gap-3 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink-2">
          <ShieldAlert className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold">Emergencies outside hours</p>
          <p className="text-xs font-medium text-muted">
            {s.emergencyAnyTime ? 'Emergency requests reach you on breaks and days off while online' : 'Emergencies follow your working hours too'}
          </p>
        </div>
        <Toggle checked={s.emergencyAnyTime} onChange={(v) => updateSettings({ emergencyAnyTime: v })} label="Emergencies outside working hours" />
      </Card>
    </section>
  )
}

function Summary({ label, value, tone: t }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-card px-4 py-3">
      <dt className="text-[10.5px] font-bold uppercase tracking-wider text-faint">{label}</dt>
      <dd className={cn('num mt-0.5 text-[13.5px] font-extrabold', t)}>{value}</dd>
    </div>
  )
}

/** The compact read-only card for Profile, with a way into Settings. */
export function AvailabilitySummary() {
  const store = useStore()
  const a = useAvailability()
  const c = tone(a)
  const s = store.settings
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <span className={cn('size-3 shrink-0 rounded-full', c.dot, a.state === 'online' && 'animate-blink')} />
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-extrabold uppercase tracking-wide', c.text)}>{a.headline}</p>
          <p className="text-xs font-medium text-muted">{a.detail}</p>
        </div>
        <Toggle checked={store.online} onChange={store.setOnline} label="Online for new jobs" tone="success" size="lg" />
      </div>
      <dl className="grid grid-cols-3 gap-px border-t border-line bg-line">
        <Summary label="Today" value={a.today} />
        <Summary label="Break" value={s.breakTime.on ? range12(s.breakTime.start, s.breakTime.end) : 'None'} />
        <Summary label="Radius" value={`${s.radiusKm} km`} />
      </dl>
      <Link href={'/settings#availability' as Route} className="flex items-center justify-center gap-1.5 border-t border-line py-3 text-sm font-extrabold text-brand hover:bg-brand-soft">
        <SlidersHorizontal className="size-4" /> Manage availability
      </Link>
    </Card>
  )
}

/**
 * Confirms every switch between online and offline, wherever it was flipped
 * — dashboard, drawer, Settings or Profile. Mounted once in the app shell.
 */
export function AvailabilityToast() {
  const { online } = useStore()
  const [prev, setPrev] = useState(online)
  const [msg, setMsg] = useState<{ text: string; off: boolean } | null>(null)

  if (online !== prev) {
    setPrev(online)
    setMsg(
      online
        ? { text: 'You’re online and receiving new jobs.', off: false }
        : { text: 'You’re now offline and will not receive new service requests. Accepted jobs stay with you.', off: true }
    )
  }

  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 3500)
    return () => clearTimeout(t)
  }, [msg])

  if (!msg) return null
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-[calc(var(--safe-top)+0.75rem)] z-[85] flex justify-center px-4">
      <p className="animate-slide-up flex max-w-md items-start gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white shadow-float">
        <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', msg.off ? 'bg-white/50' : 'bg-[#4ade80]')} />
        {msg.text}
      </p>
    </div>
  )
}
