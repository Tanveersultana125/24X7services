'use client'

import { useState } from 'react'
import { APPLIANCE_LABEL, BRAND_LABEL } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { dateTime } from '@/lib/format'
import { etaMin, km } from '@/lib/geo'
import { useStore } from '@/lib/store'
import type { Technician } from '@/lib/types'
import { ApplianceGlyph } from './glyphs'
import { useToast } from './toast'
import { Button, Modal, PriorityTag } from './ui'

/**
 * The other way round from AssignModal: start from a technician and give them
 * one of the waiting bookings they are certified for, nearest and most urgent first.
 */
export function AssignJobModal({ tech, onClose }: { tech: Technician | null; onClose: () => void }) {
  const store = useStore()
  const toast = useToast()
  const [pick, setPick] = useState<string | null>(null)
  if (!tech) return null
  const rank = { emergency: 0, high: 1, normal: 2 } as const
  const list = store.bookings
    .filter((b) => b.status === 'confirmed' && tech.brands.includes(b.brand) && tech.appliances.includes(b.appliance))
    .map((b) => ({ b, d: Math.round(km(tech, b) * 1.25 * 10) / 10 }))
    .sort((x, y) => rank[x.b.priority] - rank[y.b.priority] || x.d - y.d)
  const chosen = pick ?? list[0]?.b.id ?? null
  const close = () => {
    setPick(null)
    onClose()
  }
  return (
    <Modal
      open
      onClose={close}
      title={`Assign a job to ${tech.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={!chosen}
            onClick={() => {
              if (!chosen) return
              store.assign(chosen, tech.id)
              toast(`${chosen} assigned to ${tech.name}`)
              close()
            }}
          >
            Assign job
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm font-medium text-muted">Unassigned bookings this technician is certified for — emergencies first, then nearest.</p>
      <ul className="-mx-1 max-h-[46dvh] space-y-1.5 overflow-y-auto px-1" role="radiogroup" aria-label="Bookings">
        {list.length === 0 && <li className="py-6 text-center text-sm font-semibold text-muted">No waiting booking matches their brands and appliances.</li>}
        {list.map(({ b, d }) => {
          const on = chosen === b.id
          return (
            <li key={b.id}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPick(b.id)}
                className={cn('flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors', on ? 'border-brand bg-brand-soft/60 ring-1 ring-brand' : 'border-line hover:border-line-strong')}
              >
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', b.priority === 'emergency' ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand')}>
                  <ApplianceGlyph appliance={b.appliance} className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold">
                      {BRAND_LABEL[b.brand]} {APPLIANCE_LABEL[b.appliance]}
                    </span>
                    <PriorityTag priority={b.priority} />
                  </span>
                  <span className="block truncate text-xs font-semibold text-muted">
                    {b.id} · {b.area} · {dateTime(b.scheduledAt)}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="num block text-sm font-extrabold">{d} km</span>
                  <span className="block text-[11px] font-bold text-success">~{etaMin(d)} min</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
