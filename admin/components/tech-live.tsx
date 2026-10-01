'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { Phone } from 'lucide-react'
import { APPLIANCE_LABEL, BRAND_LABEL } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { telHref } from '@/lib/format'
import { etaMin, km } from '@/lib/geo'
import { LIVE, PRESENCE } from '@/lib/status'
import { useStore } from '@/lib/store'
import type { Booking, Technician } from '@/lib/types'
import { useToast } from './toast'
import { Avatar, Button, Chip, Empty, StatusChip, TableWrap, buttonClass, td, th, tr } from './ui'

export interface LiveRow {
  t: Technician
  job?: Booking
}

/** The job a technician is on now, or else the next one they are booked for. */
export function currentJob(t: Technician, bookings: Booking[]): Booking | undefined {
  const mine = bookings.filter((b) => b.technicianId === t.id)
  return (
    mine.find((b) => LIVE.includes(b.status)) ??
    mine.filter((b) => b.status === 'assigned' && new Date(b.scheduledAt).getTime() > Date.now() - 3_600_000).sort((a, z) => a.scheduledAt.localeCompare(z.scheduledAt))[0]
  )
}

/** Technicians with what they are doing right now, for dispatch to act on. */
export function LiveTechnicians({
  rows,
  onOpen,
  onReassign,
  onAssign,
}: {
  rows: LiveRow[]
  onOpen: (bookingId: string) => void
  onReassign: (b: Booking) => void
  onAssign: (t: Technician) => void
}) {
  const store = useStore()
  const toast = useToast()
  const canAssign = store.can('dispatch', 'assign')
  if (rows.length === 0) return <Empty icon={<Phone />} title="No technicians in this view" body="Pick another counter above." />

  const info = (t: Technician, job?: Booking) => {
    const d = job ? Math.round(km(t, job) * 1.25 * 10) / 10 : undefined
    const onSite = !!job && (job.status === 'arrived' || job.status === 'in_progress')
    return { c: job ? store.customer(job.customerId) : undefined, d, onSite, eta: !job ? '—' : onSite ? 'On site' : `~${etaMin(d!)} min` }
  }

  const actions = (t: Technician, job?: Booking) => (
    <>
      {canAssign &&
        t.presence !== 'offline' &&
        (job ? (
          <Button size="xs" variant="secondary" onClick={() => onReassign(job)}>
            Reassign
          </Button>
        ) : (
          <Button size="xs" onClick={() => onAssign(t)}>
            Assign
          </Button>
        ))}
      {job && (
        <Button size="xs" variant="secondary" onClick={() => onOpen(job.id)}>
          Open job
        </Button>
      )}
      <a
        href={telHref(t.phone)}
        onClick={() => toast(`Calling ${t.name} · ${t.phone}`)}
        aria-label={`Call ${t.name}`}
        className={buttonClass('secondary', 'xs', 'px-2')}
      >
        <Phone />
      </a>
    </>
  )

  const dot = (t: Technician) => (
    <span
      className={cn(
        'absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card',
        t.presence === 'on_job' ? 'bg-violet' : t.presence === 'online' ? 'bg-success' : 'bg-faint'
      )}
    />
  )

  return (
    <>
    {/* Phone: one card per technician — the table would scroll sideways. */}
    <ul className="divide-y divide-line sm:hidden">
      {rows.map(({ t, job }) => {
        const { c, d, onSite, eta } = info(t, job)
        return (
          <li key={t.id} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <Link href={`/technicians/?id=${t.id}` as Route} className="relative shrink-0">
                <Avatar name={t.name} size={36} side="technician" />
                {dot(t)}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/technicians/?id=${t.id}` as Route} className="min-w-0">
                    <span className="block truncate text-sm font-bold">{t.name}</span>
                    <span className="block truncate text-xs font-medium text-muted">
                      {t.area}
                      {!t.tracking && ' · location off'}
                    </span>
                  </Link>
                  <span className="shrink-0">
                    {job ? <StatusChip status={job.status} /> : <Chip tone={PRESENCE[t.presence].tone}>{t.presence === 'online' ? 'Free' : PRESENCE[t.presence].label}</Chip>}
                  </span>
                </div>
                {job && (
                  <button type="button" onClick={() => onOpen(job.id)} className="mt-2 block w-full rounded-lg bg-canvas px-3 py-2 text-left">
                    <span className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="min-w-0 truncate font-bold">
                        {job.id} · {BRAND_LABEL[job.brand]} {APPLIANCE_LABEL[job.appliance]}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2 text-xs font-medium text-muted">
                      <span className="flex min-w-0 items-center gap-1.5">
                        {c && <Avatar name={c.name} size={16} side="customer" />}
                        <span className="truncate">{c?.name ?? '—'}</span>
                      </span>
                      <span className="num shrink-0 font-bold text-ink-2">
                        {d} km · <span className={onSite ? 'text-violet' : ''}>{eta}</span>
                      </span>
                    </span>
                  </button>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">{actions(t, job)}</div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
    <div className="hidden sm:block">
    <TableWrap>
      <thead>
        <tr>
          <th className={th}>Technician</th>
          <th className={th}>Current job</th>
          <th className={th}>Customer</th>
          <th className={cn(th, 'text-right')}>Distance</th>
          <th className={cn(th, 'text-right')}>ETA</th>
          <th className={th}>Status</th>
          <th className={cn(th, 'text-right')}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ t, job }) => {
          const { c, d, onSite } = info(t, job)
          return (
            <tr key={t.id} className={tr}>
              <td className={td}>
                <Link href={`/technicians/?id=${t.id}` as Route} className="flex items-center gap-2.5">
                  <span className="relative">
                    <Avatar name={t.name} size={30} side="technician" />
                    <span
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card',
                        t.presence === 'on_job' ? 'bg-violet' : t.presence === 'online' ? 'bg-success' : 'bg-faint'
                      )}
                    />
                  </span>
                  <span>
                    <span className="block font-bold hover:text-brand">{t.name}</span>
                    <span className="block text-xs font-medium text-muted">
                      {t.area}
                      {!t.tracking && ' · location off'}
                    </span>
                  </span>
                </Link>
              </td>
              <td className={td}>
                {job ? (
                  <button type="button" onClick={() => onOpen(job.id)} className="text-left">
                    <span className="block whitespace-nowrap font-bold hover:text-brand">{job.id}</span>
                    <span className="block whitespace-nowrap text-xs font-medium text-muted">
                      {BRAND_LABEL[job.brand]} {APPLIANCE_LABEL[job.appliance]}
                    </span>
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-faint">No job</span>
                )}
              </td>
              <td className={td}>
                {c ? (
                  <span className="flex items-center gap-2">
                    <Avatar name={c.name} size={24} side="customer" />
                    <span className="whitespace-nowrap font-semibold">{c.name}</span>
                  </span>
                ) : (
                  <span className="text-faint">—</span>
                )}
              </td>
              <td className={cn(td, 'num text-right font-semibold')}>{d !== undefined ? `${d} km` : '—'}</td>
              <td className={cn(td, 'num whitespace-nowrap text-right font-bold')}>{!job ? '—' : onSite ? <span className="text-violet">On site</span> : `~${etaMin(d!)} min`}</td>
              <td className={td}>{job ? <StatusChip status={job.status} /> : <Chip tone={PRESENCE[t.presence].tone}>{t.presence === 'online' ? 'Free' : PRESENCE[t.presence].label}</Chip>}</td>
              <td className={cn(td, 'text-right')}>
                <span className="inline-flex gap-1.5">{actions(t, job)}</span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </TableWrap>
    </div>
    </>
  )
}
