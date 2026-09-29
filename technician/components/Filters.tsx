'use client'

import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { APPLIANCES, APPLIANCE_LABEL, BRANDS, BRAND_LABEL, type Appliance, type Brand } from '@/lib/catalog'
import { STATUS_FILTERS, inFilter, type StatusFilter } from '@/lib/status'
import type { Job } from '@/lib/types'
import { ApplianceGlyph } from './glyphs'
import { Button, FilterChip, Sheet } from './ui'

export interface FilterState {
  brands: Brand[]
  appliances: Appliance[]
  statuses: StatusFilter[]
}

export const NO_FILTERS: FilterState = { brands: [], appliances: [], statuses: [] }

export function applyFilters(jobs: Job[], f: FilterState): Job[] {
  return jobs.filter(
    (j) =>
      (!f.brands.length || f.brands.includes(j.brand)) &&
      (!f.appliances.length || f.appliances.includes(j.appliance)) &&
      (!f.statuses.length || f.statuses.some((s) => inFilter(j.status, s)))
  )
}

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

/** The Brand / Appliance / Status filter, as a button that opens a sheet. */
export function FilterButton({ value, onChange, hideStatus }: { value: FilterState; onChange: (f: FilterState) => void; hideStatus?: boolean }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const count = value.brands.length + value.appliances.length + value.statuses.length

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDraft(value)
          setOpen(true)
        }}
        className="relative inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-line-strong bg-card px-3 text-sm font-bold hover:border-ink-2"
      >
        <SlidersHorizontal className="size-4" /> Filters
        {count > 0 && <span className="num grid size-5 place-items-center rounded-full bg-brand text-[11px] font-extrabold text-white">{count}</span>}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Filter jobs">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">Brand</p>
            <div className="flex flex-wrap gap-2">
              {BRANDS.map((b) => (
                <FilterChip key={b} active={draft.brands.includes(b)} onClick={() => setDraft((d) => ({ ...d, brands: toggle(d.brands, b) }))}>
                  {BRAND_LABEL[b]}
                </FilterChip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">Appliance</p>
            <div className="flex flex-wrap gap-2">
              {APPLIANCES.map((a) => (
                <FilterChip key={a} active={draft.appliances.includes(a)} onClick={() => setDraft((d) => ({ ...d, appliances: toggle(d.appliances, a) }))}>
                  <ApplianceGlyph appliance={a} className="size-4" />
                  {APPLIANCE_LABEL[a]}
                </FilterChip>
              ))}
            </div>
          </div>
          {!hideStatus && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((s) => (
                  <FilterChip key={s.key} active={draft.statuses.includes(s.key)} onClick={() => setDraft((d) => ({ ...d, statuses: toggle(d.statuses, s.key) }))}>
                    {s.label}
                  </FilterChip>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 border-t border-line pt-4">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setDraft(NO_FILTERS)}>
              Clear all
            </Button>
            <Button
              size="lg"
              className="flex-[1.5]"
              onClick={() => {
                onChange(draft)
                setOpen(false)
              }}
            >
              Apply filters
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  )
}

/** Applied filters as removable chips under the toolbar. */
export function ActiveFilters({ value, onChange }: { value: FilterState; onChange: (f: FilterState) => void }) {
  const items = [
    ...value.brands.map((b) => ({ label: BRAND_LABEL[b], clear: () => onChange({ ...value, brands: value.brands.filter((x) => x !== b) }) })),
    ...value.appliances.map((a) => ({ label: APPLIANCE_LABEL[a], clear: () => onChange({ ...value, appliances: value.appliances.filter((x) => x !== a) }) })),
    ...value.statuses.map((s) => ({ label: STATUS_FILTERS.find((f) => f.key === s)!.label, clear: () => onChange({ ...value, statuses: value.statuses.filter((x) => x !== s) }) })),
  ]
  if (!items.length) return null
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {items.map((i) => (
        <button key={i.label} type="button" onClick={i.clear} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-pill bg-brand-soft px-3 text-xs font-bold text-brand">
          {i.label} <span aria-hidden>×</span>
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      <button type="button" onClick={() => onChange(NO_FILTERS)} className="h-8 shrink-0 px-2 text-xs font-bold text-muted">
        Clear
      </button>
    </div>
  )
}
