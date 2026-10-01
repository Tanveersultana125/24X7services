'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo, useState } from 'react'
import { Download, SearchX } from 'lucide-react'
import { AssignModal, BookingDrawer } from '@/components/BookingDrawer'
import { ApplianceGlyph } from '@/components/glyphs'
import { useToast } from '@/components/toast'
import { Avatar, Button, Card, Empty, Page, PageHeader, Pager, PriorityTag, SearchInput, Select, StatusChip, TableWrap, Tabs, td, th, tr } from '@/components/ui'
import { APPLIANCES, APPLIANCE_LABEL, BRANDS, BRAND_LABEL, inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ago, dayLabel, downloadCsv, isToday, matches, time, withinDays } from '@/lib/format'
import { BOOKING_STATUS, STATUS_GROUPS, inGroup, type StatusGroup } from '@/lib/status'
import { useStore } from '@/lib/store'
import type { Appliance, Brand } from '@/lib/catalog'
import type { Booking, Priority } from '@/lib/types'

const PER_PAGE = 25

type Range = 'all' | 'today' | 'tomorrow' | '7' | '30'

const RANGES: { value: Range; label: string }[] = [
  { value: 'all', label: 'Any date' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
]

function inRange(iso: string, r: Range) {
  if (r === 'all') return true
  if (r === 'today') return isToday(iso)
  if (r === 'tomorrow') return dayLabel(iso) === 'Tomorrow'
  return withinDays(iso, Number(r))
}

export default function BookingsPage() {
  return (
    <Suspense>
      <Bookings />
    </Suspense>
  )
}

/** Every booking on the network, filterable down to the one that needs a person. */
function Bookings() {
  const store = useStore()
  const toast = useToast()
  const params = useSearchParams()
  const [open, setOpen] = useState<string | null>(params.get('id'))
  const [assign, setAssign] = useState<Booking | null>(null)
  const [group, setGroup] = useState<StatusGroup>('all')
  const [q, setQ] = useState('')
  const [brand, setBrand] = useState<Brand | 'all'>('all')
  const [appliance, setAppliance] = useState<Appliance | 'all'>('all')
  const [range, setRange] = useState<Range>('all')
  const [priority, setPriority] = useState<Priority | 'all'>('all')
  const [page, setPage] = useState(0)

  // A deep link from search or an alert opens its booking even when already on this page.
  const [lastId, setLastId] = useState(params.get('id'))
  if (params.get('id') !== lastId) {
    setLastId(params.get('id'))
    setOpen(params.get('id'))
  }

  const base = useMemo(
    () =>
      store.bookings.filter((b) => {
        if (brand !== 'all' && b.brand !== brand) return false
        if (appliance !== 'all' && b.appliance !== appliance) return false
        if (priority !== 'all' && b.priority !== priority) return false
        if (!inRange(b.scheduledAt, range)) return false
        const c = store.customer(b.customerId)
        const t = store.technician(b.technicianId)
        return matches([b.id, c?.name, c?.phone.replace(/\s/g, ''), t?.name, b.area, b.issue, BRAND_LABEL[b.brand], APPLIANCE_LABEL[b.appliance], b.service], q)
      }),
    [store, brand, appliance, priority, range, q]
  )

  const rows = base.filter((b) => inGroup(b.status, group))
  const pages = Math.ceil(rows.length / PER_PAGE)
  const current = Math.min(page, Math.max(pages - 1, 0))
  const shown = rows.slice(current * PER_PAGE, current * PER_PAGE + PER_PAGE)
  const emergencies = base.filter((b) => b.status === 'confirmed' && b.priority === 'emergency').length

  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setPage(0)
  }

  const exportCsv = () => {
    downloadCsv('bookings', [
      ['Booking', 'Created', 'Slot', 'Customer', 'Phone', 'Area', 'Brand', 'Appliance', 'Service', 'Issue', 'Technician', 'Status', 'Priority', 'Amount', 'Paid', 'Method'],
      ...rows.map((b) => {
        const c = store.customer(b.customerId)
        return [
          b.id,
          b.createdAt,
          b.scheduledAt,
          c?.name ?? '',
          c?.phone ?? '',
          b.area,
          BRAND_LABEL[b.brand],
          APPLIANCE_LABEL[b.appliance],
          b.service,
          b.issue,
          store.technician(b.technicianId)?.name ?? '',
          BOOKING_STATUS[b.status].label,
          b.priority,
          b.amount,
          b.paid ? 'Yes' : 'No',
          b.method ?? '',
        ]
      }),
    ])
    toast(`Exported ${rows.length} bookings`)
  }

  return (
    <Page>
      <PageHeader
        title="Bookings"
        sub="Every customer booking and the job it became — assign, reschedule, cancel or refund."
        actions={
          <Button variant="secondary" onClick={exportCsv}>
            <Download /> Export CSV
          </Button>
        }
      />

      <Card>
        <Tabs
          className="px-3"
          value={group}
          onChange={reset(setGroup)}
          options={STATUS_GROUPS.map((g) => ({
            value: g.key,
            label: g.label,
            count: base.filter((b) => inGroup(b.status, g.key)).length,
            alert: g.key === 'unassigned' && emergencies > 0,
          }))}
        />
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-5">
          <SearchInput value={q} onChange={reset(setQ)} placeholder="Search id, customer, phone, technician…" className="w-full sm:w-72" />
          <Select label="Brand" value={brand} onChange={reset(setBrand)} options={[{ value: 'all', label: 'All brands' }, ...BRANDS.map((b) => ({ value: b, label: BRAND_LABEL[b] }))]} />
          <Select
            label="Appliance"
            value={appliance}
            onChange={reset(setAppliance)}
            options={[{ value: 'all', label: 'All appliances' }, ...APPLIANCES.map((a) => ({ value: a, label: APPLIANCE_LABEL[a] }))]}
          />
          <Select label="Date" value={range} onChange={reset(setRange)} options={RANGES} />
          <Select
            label="Priority"
            value={priority}
            onChange={reset(setPriority)}
            options={[
              { value: 'all', label: 'Any priority' },
              { value: 'emergency', label: 'Emergency' },
              { value: 'high', label: 'High' },
              { value: 'normal', label: 'Normal' },
            ]}
          />
        </div>

        {shown.length === 0 ? (
          <Empty icon={<SearchX />} title="No bookings match" body="Try another status tab or clear a filter." />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>Booking</th>
                <th className={th}>
                  <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-cust" aria-hidden />Customer</span>
                </th>
                <th className={th}>Appliance</th>
                <th className={th}>Slot</th>
                <th className={th}>
                  <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-tech" aria-hidden />Technician</span>
                </th>
                <th className={cn(th, 'text-right')}>Amount</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => {
                const c = store.customer(b.customerId)
                const t = store.technician(b.technicianId)
                const canAssign = !t && b.status === 'confirmed'
                return (
                  <tr key={b.id} className={cn(tr, 'cursor-pointer')} onClick={() => setOpen(b.id)}>
                    <td className={td}>
                      <span className="num block font-bold">{b.id}</span>
                      <span className="block text-xs font-medium text-faint">{ago(b.createdAt)}</span>
                    </td>
                    <td className={td}>
                      <span className="flex items-center gap-2.5">
                        {c && <Avatar name={c.name} size={26} side="customer" />}
                        <span className="min-w-0">
                          <span className="block max-w-[150px] truncate font-semibold">{c?.name}</span>
                          <span className="block text-xs font-medium text-muted">{b.area}</span>
                        </span>
                      </span>
                    </td>
                    <td className={td}>
                      <span className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'grid size-8 shrink-0 place-items-center rounded-lg',
                            b.priority === 'emergency' ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand'
                          )}
                        >
                          <ApplianceGlyph appliance={b.appliance} className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block whitespace-nowrap font-semibold">
                            {BRAND_LABEL[b.brand]} {APPLIANCE_LABEL[b.appliance]}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                            {b.service}
                            {b.priority !== 'normal' && <PriorityTag priority={b.priority} />}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className={td}>
                      <span className="num block whitespace-nowrap font-semibold">{time(b.scheduledAt)}</span>
                      <span className="block text-xs font-medium text-muted">{dayLabel(b.scheduledAt)}</span>
                    </td>
                    <td className={td}>
                      {t ? (
                        <span className="flex items-center gap-2">
                          <Avatar name={t.name} size={26} side="technician" />
                          <span className="max-w-[130px] truncate font-semibold">{t.name}</span>
                        </span>
                      ) : canAssign ? (
                        <Button
                          size="xs"
                          variant={b.priority === 'emergency' ? 'danger' : 'primary'}
                          onClick={(e) => {
                            e.stopPropagation()
                            setAssign(b)
                          }}
                        >
                          Assign
                        </Button>
                      ) : (
                        <span className="text-xs font-semibold text-faint">—</span>
                      )}
                    </td>
                    <td className={cn(td, 'text-right')}>
                      <span className="num block font-bold">{inr(b.amount)}</span>
                      <span className={cn('block text-[11px] font-bold', b.status === 'refunded' ? 'text-muted' : b.paid ? 'text-success' : 'text-warning')}>
                        {b.status === 'refunded' ? 'Refunded' : b.paid ? 'Paid' : b.method === 'cash' ? 'Cash due' : 'Unpaid'}
                      </span>
                    </td>
                    <td className={td}>
                      <StatusChip status={b.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </TableWrap>
        )}
        <Pager page={current} pages={pages} total={rows.length} onPage={setPage} />
      </Card>

      <BookingDrawer id={open} onClose={() => setOpen(null)} />
      <AssignModal booking={assign} onClose={() => setAssign(null)} />
    </Page>
  )
}
