'use client'

import { useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Minus, Plus, Search, Truck } from 'lucide-react'
import { ApplianceGlyph } from '@/components/glyphs'
import { JobNotFound, useJobParam } from '@/components/JobParts'
import { ActionDock, Card, Chip, Page, ScreenHeader } from '@/components/ui'
import { APPLIANCE_LABEL, PARTS, applianceTitle, inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { stepHref } from '@/lib/routes'
import { useStore } from '@/lib/store'
import type { Job, PartLine } from '@/lib/types'

export default function PartsPage() {
  return (
    <Suspense>
      <Parts />
    </Suspense>
  )
}

function Parts() {
  const job = useJobParam()
  if (!job) return <JobNotFound />
  return <PartsPicker key={job.id} job={job} />
}

/**
 * Only the parts that fit this appliance. The catalogue is per appliance, so
 * a washing-machine job cannot end up billing an AC capacitor.
 */
function PartsPicker({ job }: { job: Job }) {
  const store = useStore()
  const router = useRouter()
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(job.parts.map((p) => [p.sku, p.qty])))
  const [q, setQ] = useState('')
  const catalog = PARTS[job.appliance].filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
  const readOnly = job.status === 'closed'

  const lines: PartLine[] = PARTS[job.appliance]
    .filter((p) => (qty[p.sku] ?? 0) > 0)
    .map((p) => ({ sku: p.sku, name: p.name, qty: qty[p.sku]!, price: p.price, inVan: p.inVan }))
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0)
  const toOrder = lines.filter((l) => !l.inVan).length

  const bump = (sku: string, d: number) => setQty((m) => ({ ...m, [sku]: Math.max(0, Math.min(9, (m[sku] ?? 0) + d)) }))

  return (
    <>
      <ScreenHeader back={stepHref('detail', job.id)} title="Parts" subtitle={`${applianceTitle(job.brand, job.appliance)} · ${job.id}`} />
      <Page className="space-y-4">
        <div className="flex items-center gap-3 rounded-card border border-line bg-card p-3">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
            <ApplianceGlyph appliance={job.appliance} className="size-6" />
          </span>
          <p className="flex-1 text-sm font-semibold text-ink-2">
            Showing <span className="font-extrabold text-ink">{APPLIANCE_LABEL[job.appliance]}</span> parts only
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search parts"
            className="h-12 w-full rounded-xl border border-line-strong bg-card pl-10 pr-3 text-base focus:border-brand"
          />
        </div>

        <Card className="divide-y divide-line overflow-hidden">
          <div className="hidden grid-cols-[1fr_130px_90px_120px] gap-3 bg-canvas px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-faint sm:grid">
            <span>Part</span>
            <span>Status</span>
            <span className="text-right">Cost</span>
            <span className="text-center">Quantity</span>
          </div>
          {catalog.map((p) => {
            const n = qty[p.sku] ?? 0
            return (
              <div key={p.sku} className={cn('grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[1fr_130px_90px_120px]', n > 0 && 'bg-brand-soft/50')}>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold">{p.name}</p>
                  <p className="num text-xs font-semibold text-faint">{p.sku}</p>
                </div>
                <div className="order-3 col-span-1 sm:order-none">
                  {p.inVan ? <Chip tone="success">Available</Chip> : <Chip tone="danger">Not Available</Chip>}
                </div>
                <p className="num order-2 text-right text-sm font-extrabold sm:order-none">{inr(p.price)}</p>
                <div className="order-4 flex items-center justify-end gap-1 sm:order-none sm:justify-center">
                  <button type="button" disabled={readOnly || n === 0} onClick={() => bump(p.sku, -1)} aria-label={`Fewer ${p.name}`} className="grid size-10 place-items-center rounded-lg border border-line-strong bg-card disabled:opacity-40">
                    <Minus className="size-4" />
                  </button>
                  <span className="num w-8 text-center text-base font-extrabold">{n}</span>
                  <button type="button" disabled={readOnly} onClick={() => bump(p.sku, 1)} aria-label={`More ${p.name}`} className="grid size-10 place-items-center rounded-lg border border-brand bg-brand text-white disabled:opacity-40">
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </Card>

        {toOrder > 0 && (
          <div className="flex items-start gap-3 rounded-card border border-warning/30 bg-warning-soft p-3.5 text-sm">
            <Truck className="mt-0.5 size-5 shrink-0 text-warning" />
            <p className="font-medium text-ink-2">
              <span className="font-extrabold text-ink">{toOrder} part{toOrder > 1 ? 's' : ''} not in your van.</span> They’ll be requested from the Kondapur hub — usually next-day. Schedule a revisit with the customer.
            </p>
          </div>
        )}

        {!readOnly && (
          <ActionDock>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <p className="text-xs font-bold text-muted">{lines.reduce((s, l) => s + l.qty, 0)} items</p>
              <p className="num text-lg font-extrabold leading-tight">{inr(total)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                store.setParts(job.id, lines)
                router.back()
              }}
              className="h-14 flex-[1.6] rounded-xl bg-brand text-[15px] font-extrabold text-white hover:bg-brand-deep"
            >
              Save parts
            </button>
          </ActionDock>
        )}
      </Page>
    </>
  )
}
