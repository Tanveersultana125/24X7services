'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Banknote, CircleCheck, Clock, Pencil, Smartphone } from 'lucide-react'
import { JobNotFound, useJobParam } from '@/components/JobParts'
import { Logo } from '@/components/Logo'
import { ActionDock, Card, Label, Page, ScreenHeader, SectionTitle, inputClass } from '@/components/ui'
import { APPLIANCE_LABEL, BRAND_LABEL, LABOUR_RATE, inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { shortDate, time } from '@/lib/format'
import { stepHref } from '@/lib/routes'
import { useStore } from '@/lib/store'
import type { Bill, Job, PaymentMethod } from '@/lib/types'

export default function BillPage() {
  return (
    <Suspense>
      <BillScreen />
    </Suspense>
  )
}

function BillScreen() {
  const job = useJobParam()
  if (!job) return <JobNotFound />
  return <BillForm key={job.id} job={job} />
}

function BillForm({ job }: { job: Job }) {
  const store = useStore()
  const router = useRouter()
  const readOnly = job.status === 'closed'
  const [bill, setBill] = useState<Bill>(
    job.bill ?? { labour: LABOUR_RATE[job.appliance], additional: 0, additionalNote: '', paid: false, method: null }
  )
  const [editLabour, setEditLabour] = useState(false)

  const parts = job.parts.reduce((s, p) => s + p.qty * p.price, 0)
  const legacy = readOnly && !job.bill && job.amount !== undefined
  const total = legacy ? job.amount! : bill.labour + parts + bill.additional
  const gst = Math.round(total - total / 1.18)

  const patch = (p: Partial<Bill>) => setBill((b) => ({ ...b, ...p }))

  return (
    <>
      <ScreenHeader back={stepHref('detail', job.id)} title="Service bill" subtitle={`${job.id} · ${job.customer.name}`} />
      <Page className="space-y-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
          {/* The document */}
          <Card className="overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-line bg-canvas/60 p-4">
              <Logo />
              <div className="text-right">
                <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Service summary</p>
                <p className="num text-sm font-extrabold">INV-{job.id.slice(3)}</p>
                <p className="num text-xs font-semibold text-muted">
                  {shortDate(job.log.repaired ?? job.scheduledAt)} · {time(job.log.repaired ?? job.scheduledAt)}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
              <div>
                <Label>Appliance</Label>
                <dd className="mt-0.5 font-bold">{APPLIANCE_LABEL[job.appliance]}</dd>
              </div>
              <div>
                <Label>Brand</Label>
                <dd className="mt-0.5 font-bold">{BRAND_LABEL[job.brand]}</dd>
              </div>
              <div className="col-span-2">
                <Label>Diagnosis</Label>
                <dd className="mt-0.5 font-semibold text-ink-2">
                  {job.diagnosis ? (
                    <>
                      <span className="font-bold text-ink">{job.diagnosis.problem}.</span> {job.diagnosis.repair}
                    </>
                  ) : (
                    job.issue
                  )}
                </dd>
              </div>
            </dl>

            <div className="border-t border-line px-4 py-3">
              <Row
                label="Labour / service charge"
                sub={`${job.service} · ${APPLIANCE_LABEL[job.appliance]}`}
                value={legacy ? '—' : inr(bill.labour)}
                action={
                  !readOnly && (
                    <button type="button" onClick={() => setEditLabour((v) => !v)} aria-label="Edit labour" className="grid size-8 place-items-center rounded-md text-muted hover:bg-canvas">
                      <Pencil className="size-3.5" />
                    </button>
                  )
                }
              />
              {editLabour && (
                <input
                  inputMode="numeric"
                  autoFocus
                  value={bill.labour}
                  onChange={(e) => patch({ labour: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                  className={cn(inputClass, 'num mb-2 font-bold')}
                />
              )}
              <Row label="Parts charge" sub={job.parts.length ? `${job.parts.length} item${job.parts.length > 1 ? 's' : ''}` : 'No parts used'} value={legacy ? '—' : inr(parts)} />
              {job.parts.map((p) => (
                <div key={p.sku} className="flex justify-between py-1 pl-3 text-xs font-semibold text-muted">
                  <span>
                    {p.name} × {p.qty}
                  </span>
                  <span className="num">{inr(p.qty * p.price)}</span>
                </div>
              ))}
              <Row label="Additional charges" sub={bill.additionalNote || 'Transport, consumables, after-hours'} value={legacy ? '—' : inr(bill.additional)} />
              {!readOnly && (
                <div className="mt-1 grid grid-cols-[110px_1fr] gap-2 pb-2">
                  <input
                    inputMode="numeric"
                    aria-label="Additional amount"
                    value={bill.additional || ''}
                    placeholder="₹ 0"
                    onChange={(e) => patch({ additional: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                    className={cn(inputClass, 'num py-2.5 font-bold')}
                  />
                  <input
                    aria-label="Reason for additional charge"
                    value={bill.additionalNote}
                    placeholder="Reason (e.g. copper pipe 3 ft)"
                    onChange={(e) => patch({ additionalNote: e.target.value })}
                    className={cn(inputClass, 'py-2.5 text-sm')}
                  />
                </div>
              )}
            </div>

            <div className="border-t-2 border-ink bg-canvas/60 px-4 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-extrabold">Total amount</span>
                <span className="num text-2xl font-extrabold tracking-tight">{inr(total)}</span>
              </div>
              <p className="num mt-1 text-right text-xs font-semibold text-muted">Incl. GST 18% ({inr(gst)})</p>
            </div>
          </Card>

          {/* Payment */}
          <div className="space-y-5">
            <section>
              <SectionTitle>Payment status</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <Choice active={!bill.paid} disabled={readOnly} onClick={() => patch({ paid: false })} icon={<Clock className="size-5" />} label="Payment Pending" tone="warning" />
                <Choice active={bill.paid} disabled={readOnly} onClick={() => patch({ paid: true, method: bill.method ?? 'online' })} icon={<CircleCheck className="size-5" />} label="Payment Received" tone="success" />
              </div>
            </section>
            <section>
              <SectionTitle>Payment method</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['online', 'Online Payment', <Smartphone key="o" className="size-5" />],
                    ['cash', 'Cash Payment', <Banknote key="c" className="size-5" />],
                  ] as [PaymentMethod, string, React.ReactNode][]
                ).map(([m, label, icon]) => (
                  <Choice key={m} active={bill.method === m} disabled={readOnly} onClick={() => patch({ method: m })} icon={icon} label={label} tone="brand" />
                ))}
              </div>
              {bill.method === 'online' && !bill.paid && (
                <Card className="mt-3 flex items-center gap-4 p-4">
                  <QrMark seed={job.id} />
                  <div className="text-sm">
                    <p className="font-extrabold">Customer scans to pay</p>
                    <p className="num mt-0.5 font-semibold text-muted">24x7services@hdfcbank</p>
                    <p className="num mt-2 text-lg font-extrabold">{inr(total)}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-warning">Demo QR</p>
                  </div>
                </Card>
              )}
              {bill.method === 'cash' && (
                <p className="mt-3 rounded-xl bg-canvas p-3 text-xs font-semibold text-muted">
                  Collect exactly {inr(total)}. Cash is deposited at the hub by end of shift and deducted from your next payout.
                </p>
              )}
            </section>
          </div>
        </div>

        {!readOnly ? (
          <ActionDock>
            <button
              type="button"
              onClick={() => {
                store.saveBill(job.id, bill)
                if (job.status === 'repaired') store.advance(job.id, 'confirmation')
                router.push(stepHref('confirm', job.id))
              }}
              className="h-14 flex-1 rounded-xl bg-brand text-[15px] font-extrabold text-white hover:bg-brand-deep"
            >
              Continue to customer confirmation
            </button>
          </ActionDock>
        ) : (
          <Link href={stepHref('detail', job.id)} className="block text-center text-sm font-bold text-brand">
            Back to job
          </Link>
        )}
      </Page>
    </>
  )
}

function Row({ label, sub, value, action }: { label: string; sub?: string; value: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{label}</p>
        {sub && <p className="truncate text-xs font-medium text-muted">{sub}</p>}
      </div>
      {action}
      <span className="num text-sm font-extrabold">{value}</span>
    </div>
  )
}

function Choice({
  active,
  onClick,
  icon,
  label,
  tone,
  disabled,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  tone: 'warning' | 'success' | 'brand'
  disabled?: boolean
}) {
  const on = { warning: 'border-warning bg-warning-soft text-warning', success: 'border-success bg-success-soft text-success', brand: 'border-brand bg-brand-soft text-brand' }[tone]
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn('flex h-16 items-center justify-center gap-2 rounded-xl border-2 px-2 text-sm font-extrabold transition-colors', active ? on : 'border-line-strong bg-card text-ink-2 disabled:text-faint')}
    >
      {icon}
      {label}
    </button>
  )
}

/** A QR-shaped placeholder until the payment gateway issues real dynamic codes. */
function QrMark({ seed }: { seed: string }) {
  const n = 21
  let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  const cells: [number, number][] = []
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8)
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      h = (h * 1103515245 + 12345) >>> 0
      if (!finder(x, y) && (h >>> 16) % 2) cells.push([x, y])
    }
  const eye = (x: number, y: number) => (
    <g key={`${x}${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="#111827" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#111827" />
    </g>
  )
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="size-28 shrink-0 rounded-lg border border-line bg-white p-1" aria-label="Payment QR code">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#111827" />
      ))}
      {eye(0, 0)}
      {eye(n - 7, 0)}
      {eye(0, n - 7)}
    </svg>
  )
}
