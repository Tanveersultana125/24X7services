'use client'

import { useMemo, useState } from 'react'
import { Briefcase, FileCheck2, IdCard, Mail, MapPin, Pencil, Phone, Radar, ShieldAlert, ShieldCheck, UserRoundPlus } from 'lucide-react'
import { AssignModal, BookingDrawer } from './BookingDrawer'
import { ApplianceGlyph } from './glyphs'
import { AssignJobModal } from './tech-assign'
import { useToast } from './toast'
import { Avatar, Button, Chip, Drawer, Field, Modal, Rating, SectionLabel, StatusChip, Tabs, Toggle, buttonClass, inputClass } from './ui'
import { APPLIANCES, APPLIANCE_LABEL, BRANDS, BRAND_LABEL, inr, type Appliance, type Brand } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ago, dateTime, longDate, telHref, thisMonth, withinDays } from '@/lib/format'
import { AREAS } from '@/lib/seed'
import { KYC, OPEN, PRESENCE } from '@/lib/status'
import { useStore } from '@/lib/store'
import type { Booking, Technician } from '@/lib/types'

export const DOCS: { key: keyof Technician['docs']; label: string }[] = [
  { key: 'aadhaar', label: 'Aadhaar' },
  { key: 'pan', label: 'PAN card' },
  { key: 'bank', label: 'Bank account' },
  { key: 'training', label: 'Training certificate' },
  { key: 'police', label: 'Police verification' },
]

const presenceDot = { online: 'bg-success', on_job: 'bg-violet', offline: 'bg-faint' } as const
const DAY_SETS = ['Mon–Sat', 'Mon–Fri', 'All days', 'Weekends only']

type Section = 'profile' | 'availability' | 'performance' | 'earnings' | 'jobs' | 'reviews'

/**
 * One technician, end to end: who they are, when and how far they work, how
 * well, what they have earned and been paid, and every job they have touched.
 */
export function TechnicianDrawer({ t, onClose }: { t?: Technician; onClose: () => void }) {
  const store = useStore()
  const toast = useToast()
  const [section, setSection] = useState<Section>('profile')
  const [booking, setBooking] = useState<string | null>(null)
  const [reassign, setReassign] = useState<Booking | null>(null)
  const [assignJob, setAssignJob] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [editing, setEditing] = useState(false)
  const canEdit = store.can('technicians', 'edit')
  const canApprove = store.can('technicians', 'approve')
  const canAssign = store.can('technicians', 'assign')

  const stats = useMemo(() => {
    if (!t) return null
    const mine = store.bookings.filter((b) => b.technicianId === t.id)
    const done = mine.filter((b) => b.status === 'completed')
    const month = done.filter((b) => thisMonth(b.scheduledAt))
    const week = done.filter((b) => withinDays(b.scheduledAt, 7))
    const pct = store.settings.commissionPct / 100
    const money = (list: Booking[]) => {
      const gross = list.reduce((s, b) => s + b.amount, 0)
      const commission = Math.round(gross * pct)
      return { jobs: list.length, gross, commission, net: gross - commission }
    }
    return {
      open: mine.filter((b) => OPEN.includes(b.status)).sort((a, z) => a.scheduledAt.localeCompare(z.scheduledAt)),
      history: [...mine].sort((a, z) => z.scheduledAt.localeCompare(a.scheduledAt)),
      month: money(month),
      week: money(week),
      all30: money(done.filter((b) => withinDays(b.scheduledAt, 30))),
    }
  }, [store.bookings, store.settings.commissionPct, t])

  if (!t || !stats) return null
  const reviews = store.reviews.filter((r) => r.technicianId === t.id)
  const payouts = store.payouts.filter((p) => p.technicianId === t.id).sort((a, z) => z.at.localeCompare(a.at))
  const suspended = t.kyc === 'suspended' || t.kyc === 'rejected'
  const verified = t.kyc === 'verified'
  const pending = t.kyc === 'pending'
  const missing = DOCS.filter((d) => !t.docs[d.key])

  const toggleBrand = (b: Brand) => {
    const next = t.brands.includes(b) ? t.brands.filter((x) => x !== b) : [...t.brands, b]
    if (!next.length) return toast('A technician needs at least one brand')
    store.updateTechnician(t.id, { brands: BRANDS.filter((x) => next.includes(x)) }, {
      action: t.brands.includes(b) ? 'Removed supported brand' : 'Added supported brand',
      target: t.name,
      old: t.brands.map((x) => BRAND_LABEL[x]).join(', '),
      new: next.map((x) => BRAND_LABEL[x]).join(', '),
    })
    toast(`${BRAND_LABEL[b]} ${t.brands.includes(b) ? 'removed from' : 'added to'} ${t.name}`)
  }
  const toggleAppliance = (a: Appliance) => {
    const next = t.appliances.includes(a) ? t.appliances.filter((x) => x !== a) : [...t.appliances, a]
    if (!next.length) return toast('A technician needs at least one appliance')
    store.updateTechnician(t.id, { appliances: APPLIANCES.filter((x) => next.includes(x)) }, {
      action: t.appliances.includes(a) ? 'Removed supported appliance' : 'Added supported appliance',
      target: t.name,
      old: t.appliances.map((x) => APPLIANCE_LABEL[x]).join(', '),
      new: next.map((x) => APPLIANCE_LABEL[x]).join(', '),
    })
    toast(`${APPLIANCE_LABEL[a]} ${t.appliances.includes(a) ? 'removed from' : 'added to'} ${t.name}`)
  }

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        width="max-w-2xl"
        title={t.name}
        sub={
          <span className="flex flex-wrap items-center gap-2 pt-1">
            <span className="num">{t.id}</span>
            <Chip tone={KYC[t.kyc].tone}>{KYC[t.kyc].label}</Chip>
            {verified && <Chip tone={PRESENCE[t.presence].tone}>{PRESENCE[t.presence].label}</Chip>}
          </span>
        }
        footer={
          <>
            {pending && canApprove && (
              <>
                <Button
                  variant="subtle"
                  size="sm"
                  className="mr-auto text-danger hover:bg-danger-soft"
                  onClick={() => {
                    store.setKyc(t.id, 'rejected')
                    toast(`${t.name}’s application rejected`)
                  }}
                >
                  Reject
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  disabled={missing.length > 0}
                  title={missing.length ? `Missing: ${missing.map((d) => d.label).join(', ')}` : undefined}
                  onClick={() => {
                    store.setKyc(t.id, 'verified')
                    toast(`${t.name} approved and onboarded`)
                  }}
                >
                  <ShieldCheck /> Approve
                </Button>
              </>
            )}
            {(verified || suspended) && canApprove && (
              <Button variant="subtle" size="sm" className={cn('mr-auto', !suspended && 'text-danger hover:bg-danger-soft')} onClick={() => setConfirm(true)}>
                {suspended ? <ShieldCheck /> : <ShieldAlert />} {suspended ? 'Activate' : 'Suspend'}
              </Button>
            )}
            {canEdit && (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                <Pencil /> Edit
              </Button>
            )}
            <a href={telHref(t.phone)} className={buttonClass('secondary', 'sm')}>
              <Phone /> Call
            </a>
            {verified && canAssign && (
              <Button size="sm" onClick={() => setAssignJob(true)}>
                <UserRoundPlus /> Assign job
              </Button>
            )}
          </>
        }
      >
        <div className="flex items-center gap-4">
          <span className="relative">
            <Avatar name={t.name} size={56} side="technician" />
            <span className={cn('absolute bottom-0.5 right-0.5 size-3.5 rounded-full border-2 border-card', presenceDot[t.presence])} />
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <Rating value={t.rating} /> <span className="text-faint">•</span> {t.experienceYears} yrs exp.
            </p>
            <p className="num flex items-center gap-2 text-[13px] font-semibold text-ink-2">
              <Phone className="size-3.5 text-faint" aria-hidden /> {t.phone}
            </p>
            <p className="flex items-center gap-2 truncate text-[13px] font-semibold text-ink-2">
              <Mail className="size-3.5 shrink-0 text-faint" aria-hidden /> {t.email}
            </p>
            <p className="text-xs font-medium text-muted">
              {t.area} · joined {longDate(t.joinedAt)}
            </p>
          </div>
        </div>

        <Tabs
          className="-mx-5 mt-5 px-3"
          value={section}
          onChange={setSection}
          options={[
            { value: 'profile', label: 'Profile' },
            { value: 'availability', label: 'Availability' },
            { value: 'performance', label: 'Performance' },
            { value: 'earnings', label: 'Earnings' },
            { value: 'jobs', label: 'Jobs', count: stats.open.length },
            { value: 'reviews', label: 'Reviews', count: reviews.length },
          ]}
        />

        {section === 'profile' && (
          <>
            <SectionLabel>Supported brands</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {BRANDS.map((b) => (
                <ChipToggle key={b} on={t.brands.includes(b)} disabled={!canEdit} onClick={() => toggleBrand(b)}>
                  {BRAND_LABEL[b]}
                </ChipToggle>
              ))}
            </div>
            <SectionLabel>Supported appliances</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {APPLIANCES.map((a) => (
                <ChipToggle key={a} on={t.appliances.includes(a)} disabled={!canEdit} onClick={() => toggleAppliance(a)}>
                  <ApplianceGlyph appliance={a} className="size-4" /> {APPLIANCE_LABEL[a]}
                </ChipToggle>
              ))}
            </div>
            <SectionLabel>Documents</SectionLabel>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DOCS.map((d) => (
                <li key={d.key} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px] font-semibold">
                  {t.docs[d.key] ? <FileCheck2 className="size-4 text-success" aria-hidden /> : <IdCard className="size-4 text-faint" aria-hidden />}
                  <span className={cn('flex-1', !t.docs[d.key] && 'text-muted')}>{d.label}</span>
                  {pending && canApprove ? (
                    <Toggle size="sm" checked={t.docs[d.key]} onChange={(v) => store.setDoc(t.id, d.key, v)} label={`${d.label} verified`} />
                  ) : (
                    <span className={cn('text-[11px] font-bold', t.docs[d.key] ? 'text-success' : 'text-warning')}>{t.docs[d.key] ? 'Verified' : 'Missing'}</span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {section === 'availability' && <Availability t={t} canEdit={canEdit} />}

        {section === 'performance' && (
          <>
            <SectionLabel>Performance</SectionLabel>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ['Rating', t.rating ? `${t.rating.toFixed(2)}★` : '—', `${t.ratingCount.toLocaleString('en-IN')} ratings`],
                ['Completed jobs', t.completedJobs.toLocaleString('en-IN'), 'Lifetime'],
                ['This month', String(stats.month.jobs), inr(stats.month.gross)],
                ['Last 30 days', String(stats.all30.jobs), inr(stats.all30.gross)],
                ['Open jobs', String(stats.open.length), 'Assigned or live'],
                ['Cash held', inr(t.cashInHand), 'Not yet deposited'],
              ].map(([k, v, s]) => (
                <div key={k} className="rounded-lg border border-line p-3">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-faint">{k}</dt>
                  <dd className="num mt-0.5 text-base font-extrabold">{v}</dd>
                  <dd className="text-[11px] font-medium text-muted">{s}</dd>
                </div>
              ))}
            </dl>
            <SectionLabel>Reliability</SectionLabel>
            <div className="space-y-3 rounded-card border border-line p-4">
              {[
                ['On-time arrival', t.onTimeRate],
                ['Offer acceptance', t.acceptanceRate],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="font-semibold text-ink-2">{k}</span>
                    <span className="num font-bold">{v ? `${v}%` : '—'}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-canvas">
                    <div className={cn('h-full rounded-full', (v as number) >= 90 ? 'bg-success' : 'bg-warning')} style={{ width: `${v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {section === 'earnings' && (
          <>
            <SectionLabel>Earnings · commission {store.settings.commissionPct}%</SectionLabel>
            <div className="overflow-hidden rounded-card border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-canvas/60 text-[11px] font-bold uppercase tracking-[0.06em] text-faint">
                    <th className="px-4 py-2 text-left">Period</th>
                    <th className="px-3 py-2 text-right">Jobs</th>
                    <th className="px-3 py-2 text-right">Gross</th>
                    <th className="px-3 py-2 text-right">Commission</th>
                    <th className="px-4 py-2 text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ['Last 7 days', stats.week],
                      ['This month', stats.month],
                      ['Last 30 days', stats.all30],
                    ] as const
                  ).map(([k, m]) => (
                    <tr key={k} className="border-t border-line">
                      <td className="px-4 py-2.5 font-semibold">{k}</td>
                      <td className="num px-3 py-2.5 text-right">{m.jobs}</td>
                      <td className="num px-3 py-2.5 text-right">{inr(m.gross)}</td>
                      <td className="num px-3 py-2.5 text-right text-muted">−{inr(m.commission)}</td>
                      <td className="num px-4 py-2.5 text-right font-extrabold">{inr(m.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <SectionLabel
              action={
                t.cashInHand > 0 && store.can('payouts', 'approve') ? (
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => {
                      store.settleCash(t.id)
                      toast(`Deposit of ${inr(t.cashInHand)} recorded for ${t.name}`)
                    }}
                  >
                    Record deposit · {inr(t.cashInHand)}
                  </Button>
                ) : undefined
              }
            >
              Payouts
            </SectionLabel>
            {payouts.length === 0 ? (
              <p className="text-sm font-medium text-muted">No payouts yet.</p>
            ) : (
              <ul className="divide-y divide-line rounded-card border border-line">
                {payouts.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{p.period}</span>
                      <span className="block text-xs text-muted">
                        {p.id} · {p.jobs} jobs · gross {inr(p.gross)}
                      </span>
                    </span>
                    <span className="num font-extrabold">{inr(p.gross - p.commission)}</span>
                    <Chip tone={p.status === 'paid' ? 'success' : p.status === 'processing' ? 'brand' : 'warning'}>{p.status === 'paid' ? 'Paid' : p.status === 'processing' ? 'Processing' : 'Pending'}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {section === 'jobs' && (
          <>
            <SectionLabel>Current & upcoming · {stats.open.length}</SectionLabel>
            {stats.open.length === 0 ? (
              <p className="text-sm font-medium text-muted">Nothing assigned right now.</p>
            ) : (
              <ul className="divide-y divide-line rounded-card border border-line">
                {stats.open.map((b) => (
                  <li key={b.id} className="flex items-center gap-2 pr-3">
                    <JobRow b={b} onOpen={() => setBooking(b.id)} />
                    {canAssign && (
                      <Button size="xs" variant="secondary" onClick={() => setReassign(b)}>
                        Reassign
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <SectionLabel>Job history · {stats.history.length}</SectionLabel>
            {stats.history.length === 0 ? (
              <p className="text-sm font-medium text-muted">No jobs yet.</p>
            ) : (
              <ul className="max-h-[420px] divide-y divide-line overflow-y-auto rounded-card border border-line">
                {stats.history.map((b) => (
                  <li key={b.id} className="flex">
                    <JobRow b={b} onOpen={() => setBooking(b.id)} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {section === 'reviews' && (
          <>
            <SectionLabel>Customer reviews · {reviews.length}</SectionLabel>
            {reviews.length === 0 ? (
              <p className="text-sm font-medium text-muted">No reviews yet.</p>
            ) : (
              <ul className="space-y-2">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-lg border border-line px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Rating value={r.rating} />
                      <span className="flex items-center gap-1.5 text-xs font-medium text-faint">
                        <Avatar name={store.customer(r.customerId)?.name ?? '?'} size={18} side="customer" />
                        {store.customer(r.customerId)?.name} · {ago(r.at)}
                      </span>
                    </div>
                    {r.text && <p className="mt-1 text-[13px] font-medium text-ink-2">{r.text}</p>}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Drawer>

      <BookingDrawer id={booking} onClose={() => setBooking(null)} />
      <AssignModal booking={reassign} onClose={() => setReassign(null)} />
      {assignJob && <AssignJobModal tech={t} onClose={() => setAssignJob(false)} />}
      {editing && <EditModal t={t} onClose={() => setEditing(false)} />}

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={suspended ? `Activate ${t.name}?` : `Suspend ${t.name}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant={suspended ? 'success' : 'danger'}
              onClick={() => {
                store.setKyc(t.id, suspended ? 'verified' : 'suspended')
                toast(`${t.name} ${suspended ? 'activated' : 'suspended'}`)
                setConfirm(false)
              }}
            >
              {suspended ? 'Activate' : 'Suspend technician'}
            </Button>
          </>
        }
      >
        <p className="text-sm font-medium text-muted">
          {suspended
            ? 'They will be able to go online and receive jobs again.'
            : `They go offline at once and stop receiving jobs.${stats.open.length ? ` ${stats.open.length} open job${stats.open.length === 1 ? '' : 's'} will need reassigning.` : ''}`}
        </p>
      </Modal>
    </>
  )
}

function JobRow({ b, onOpen }: { b: Booking; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left hover:bg-canvas/60">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
        <ApplianceGlyph appliance={b.appliance} className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold">
          {BRAND_LABEL[b.brand]} {APPLIANCE_LABEL[b.appliance]} · {b.area}
        </span>
        <span className="block text-xs font-medium text-muted">
          {b.id} · {dateTime(b.scheduledAt)} · {inr(b.amount)}
        </span>
      </span>
      <StatusChip status={b.status} />
    </button>
  )
}

function ChipToggle({ on, onClick, disabled, children }: { on: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-bold transition-colors disabled:cursor-default',
        on ? 'border-tech/30 bg-tech-soft text-tech' : 'border-line text-muted hover:border-line-strong',
        disabled && !on && 'opacity-60'
      )}
    >
      {children}
    </button>
  )
}

/** Shift, hours, reach and whether dispatch can see them on the map. */
function Availability({ t, canEdit }: { t: Technician; canEdit: boolean }) {
  const store = useStore()
  const toast = useToast()
  const [hours, setHours] = useState(t.workingHours)
  const [radius, setRadius] = useState(t.radiusKm)
  const hoursDirty = hours.days !== t.workingHours.days || hours.start !== t.workingHours.start || hours.end !== t.workingHours.end
  const fmt = (h: Technician['workingHours']) => `${h.days} ${h.start}–${h.end}`
  return (
    <>
      <SectionLabel>Availability</SectionLabel>
      <div className="divide-y divide-line rounded-card border border-line">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className={cn('size-2.5 rounded-full', presenceDot[t.presence])} aria-hidden />
          <span className="flex-1 text-sm font-bold">Right now</span>
          {t.kyc === 'verified' ? <Chip tone={PRESENCE[t.presence].tone}>{PRESENCE[t.presence].label}</Chip> : <Chip tone={KYC[t.kyc].tone}>{KYC[t.kyc].label}</Chip>}
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <Radar className="size-4 text-faint" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Location tracking</span>
            <span className="block text-xs text-muted">{t.tracking ? 'Shown on the Live Dispatch map while on shift' : 'Hidden from the map — dispatch uses their base area'}</span>
          </span>
          <Toggle
            checked={t.tracking}
            label="Location tracking"
            onChange={(v) => {
              if (!canEdit) return
              store.updateTechnician(t.id, { tracking: v }, { action: v ? 'Enabled location tracking' : 'Disabled location tracking', target: t.name, old: v ? 'Off' : 'On', new: v ? 'On' : 'Off' })
              toast(`Location tracking ${v ? 'on' : 'off'} for ${t.name}`)
            }}
          />
        </div>
      </div>

      <SectionLabel>Working hours</SectionLabel>
      <div className="grid grid-cols-1 gap-3 rounded-card border border-line p-4 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
        <Field label="Days">
          <select disabled={!canEdit} value={hours.days} onChange={(e) => setHours({ ...hours, days: e.target.value })} className={inputClass}>
            {[...new Set([hours.days, ...DAY_SETS])].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="From">
          <input disabled={!canEdit} type="time" value={hours.start} onChange={(e) => setHours({ ...hours, start: e.target.value })} className={inputClass} />
        </Field>
        <Field label="To">
          <input disabled={!canEdit} type="time" value={hours.end} onChange={(e) => setHours({ ...hours, end: e.target.value })} className={inputClass} />
        </Field>
        <Button
          size="md"
          disabled={!canEdit || !hoursDirty || hours.start >= hours.end}
          onClick={() => {
            store.updateTechnician(t.id, { workingHours: hours }, { action: 'Changed working hours', target: t.name, old: fmt(t.workingHours), new: fmt(hours) })
            toast(`Working hours saved for ${t.name}`)
          }}
        >
          Save
        </Button>
      </div>

      <SectionLabel>Service radius</SectionLabel>
      <div className="rounded-card border border-line p-4">
        <div className="flex items-center gap-4">
          <MapPin className="size-4 shrink-0 text-faint" aria-hidden />
          <input
            type="range"
            min={3}
            max={30}
            value={radius}
            disabled={!canEdit}
            onChange={(e) => setRadius(Number(e.target.value))}
            aria-label="Service radius in km"
            className="flex-1 accent-[var(--color-tech)]"
          />
          <span className="num w-14 text-right text-sm font-extrabold">{radius} km</span>
          <Button
            size="sm"
            disabled={!canEdit || radius === t.radiusKm}
            onClick={() => {
              store.updateTechnician(t.id, { radiusKm: radius }, { action: 'Changed service radius', target: t.name, old: `${t.radiusKm} km`, new: `${radius} km` })
              toast(`Service radius set to ${radius} km`)
            }}
          >
            Save
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">Offers only reach {t.name.split(' ')[0]} for bookings within this distance of {t.area}.</p>
      </div>
    </>
  )
}

function EditModal({ t, onClose }: { t: Technician; onClose: () => void }) {
  const store = useStore()
  const toast = useToast()
  const [f, setF] = useState({ name: t.name, phone: t.phone, email: t.email, area: t.area, experienceYears: String(t.experienceYears) })
  const exp = Number(f.experienceYears)
  const valid = f.name.trim().length > 1 && f.phone.replace(/\D/g, '').length >= 10 && /\S+@\S+\.\S+/.test(f.email) && exp >= 0 && exp <= 50
  const save = () => {
    const changed = (Object.keys(f) as (keyof typeof f)[]).filter((k) => String(t[k]) !== f[k].trim())
    if (!changed.length) return onClose()
    const area = AREAS.find((a) => a.area === f.area)
    store.updateTechnician(
      t.id,
      { name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim(), area: f.area, experienceYears: exp, ...(area && f.area !== t.area ? { lat: area.lat, lng: area.lng } : {}) },
      {
        action: 'Edited technician profile',
        target: t.name,
        old: changed.map((k) => `${k}: ${t[k]}`).join('; '),
        new: changed.map((k) => `${k}: ${f[k].trim()}`).join('; '),
      }
    )
    toast(`${f.name.trim()}’s profile updated`)
    onClose()
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${t.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid} onClick={save}>
            <Briefcase /> Save changes
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" className="sm:col-span-2">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Mobile">
          <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" className={inputClass} />
        </Field>
        <Field label="Experience (years)">
          <input value={f.experienceYears} onChange={(e) => setF({ ...f, experienceYears: e.target.value })} inputMode="numeric" className={inputClass} />
        </Field>
        <Field label="Email" className="sm:col-span-2">
          <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} type="email" className={inputClass} />
        </Field>
        <Field label="Base area" className="sm:col-span-2">
          <select value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} className={inputClass}>
            {AREAS.map((a) => (
              <option key={a.area}>{a.area}</option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  )
}

