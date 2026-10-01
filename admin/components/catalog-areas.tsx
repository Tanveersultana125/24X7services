'use client'

import { useState } from 'react'
import { Info, MapPin, Plus } from 'lucide-react'
import { APPLIANCES, APPLIANCE_LABEL, BRANDS, BRAND_LABEL, type Appliance, type Brand } from '@/lib/catalog'
import { matches } from '@/lib/format'
import { useStore, useTick } from '@/lib/store'
import { ApplianceGlyph } from './glyphs'
import { useToast } from './toast'
import { Button, Card, CardHeader, Field, Modal, SearchInput, Segmented, TableWrap, Toggle, inputClass, td, th, tr } from './ui'

/** Pincodes the network takes bookings in. Applies immediately. */
export function AreasTab() {
  const store = useStore()
  const toast = useToast()
  const canEdit = store.can('catalog', 'edit')
  const areas = store.settings.areas
  const [q, setQ] = useState('')
  const [show, setShow] = useState<'all' | 'active' | 'paused'>('all')
  const [adding, setAdding] = useState(false)
  const now = useTick(60_000)
  const active = areas.filter((a) => a.active).length
  const list = areas.filter((a) => matches([a.pincode, a.area], q) && (show === 'all' || (show === 'active' ? a.active : !a.active)))

  const bookings30 = (area: string) => store.bookings.filter((b) => b.area === area && now - new Date(b.scheduledAt).getTime() < 30 * 86_400_000).length
  const techs = (area: string) => store.technicians.filter((t) => t.area === area && t.kyc === 'verified').length

  return (
    <Card>
      <CardHeader
        title="Service areas"
        sub={`${active} of ${areas.length} pincodes taking bookings · changes apply immediately`}
        action={
          canEdit && (
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus /> Add area
            </Button>
          )
        }
      />
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search pincode or area" className="w-full sm:w-72" />
        <Segmented
          value={show}
          onChange={setShow}
          options={[
            { value: 'all', label: `All ${areas.length}` },
            { value: 'active', label: `Active ${active}` },
            { value: 'paused', label: `Paused ${areas.length - active}` },
          ]}
        />
      </div>
      <TableWrap className="[&_table]:min-w-[560px]">
        <thead>
          <tr>
            <th className={th}>Area</th>
            <th className={th}>Pincode</th>
            <th className={`${th} text-right`}>Bookings · 30d</th>
            <th className={`${th} text-right`}>Technicians based</th>
            <th className={`${th} text-right`}>Taking bookings</th>
          </tr>
        </thead>
        <tbody>
          {list.map((a) => (
            <tr key={a.pincode} className={tr}>
              <td className={td}>
                <span className="inline-flex items-center gap-2 font-bold">
                  <MapPin className="size-4 text-faint" aria-hidden /> {a.area}
                </span>
              </td>
              <td className={`${td} num font-mono text-[13px] font-semibold`}>{a.pincode}</td>
              <td className={`${td} num text-right font-semibold`}>{bookings30(a.area)}</td>
              <td className={`${td} num text-right font-semibold`}>{techs(a.area)}</td>
              <td className={`${td} text-right`}>
                <Toggle
                  checked={a.active}
                  label={`${a.area} active`}
                  onChange={(v) => {
                    if (!canEdit) return
                    store.updateSettings((s) => ({ areas: s.areas.map((x) => (x.pincode === a.pincode ? { ...x, active: v } : x)) }))
                    store.record({ module: 'catalog', action: v ? 'Activated service area' : 'Paused service area', target: `${a.area} ${a.pincode}`, old: v ? 'Paused' : 'Active', new: v ? 'Active' : 'Paused' })
                    toast(`${a.area} ${v ? 'is taking bookings' : 'paused'}`)
                  }}
                />
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-10 text-center text-sm font-semibold text-muted">
                No areas match.
              </td>
            </tr>
          )}
        </tbody>
      </TableWrap>
      {adding && <AddArea onClose={() => setAdding(false)} />}
    </Card>
  )
}

function AddArea({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const toast = useToast()
  const [pincode, setPincode] = useState('')
  const [area, setArea] = useState('')
  const taken = store.settings.areas.some((a) => a.pincode === pincode)
  const ok = /^5\d{5}$/.test(pincode) && !taken && area.trim().length > 1
  return (
    <Modal
      open
      onClose={onClose}
      title="Add service area"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!ok}
            onClick={() => {
              store.updateSettings((s) => ({ areas: [...s.areas, { pincode, area: area.trim(), active: true }] }))
              store.record({ module: 'catalog', action: 'Added service area', target: `${area.trim()} ${pincode}`, new: 'Active' })
              toast(`${area.trim()} (${pincode}) is now taking bookings`)
              onClose()
            }}
          >
            <Plus /> Add area
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Pincode" hint={taken ? <span className="font-semibold text-danger">Already listed</span> : 'Hyderabad pincodes start with 5'}>
          <input inputMode="numeric" maxLength={6} value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))} placeholder="500081" className={`${inputClass} num font-mono`} />
        </Field>
        <Field label="Area name">
          <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Hitech City" className={inputClass} />
        </Field>
      </div>
    </Modal>
  )
}

/** Which brand × appliance pairs customers can book. Applies immediately. */
export function AvailabilityTab() {
  const store = useStore()
  const toast = useToast()
  const canEdit = store.can('catalog', 'edit')
  const m = store.settings.matrix
  const enabled = BRANDS.reduce((n, b) => n + APPLIANCES.filter((a) => m[b][a]).length, 0)

  const flip = (b: Brand, a: Appliance, v: boolean) => {
    if (!canEdit) return
    store.updateSettings((s) => ({ matrix: { ...s.matrix, [b]: { ...s.matrix[b], [a]: v } } }))
    store.record({ module: 'catalog', action: v ? 'Enabled service' : 'Disabled service', target: `${BRAND_LABEL[b]} ${APPLIANCE_LABEL[a]}`, old: v ? 'Disabled' : 'Enabled', new: v ? 'Enabled' : 'Disabled' })
    toast(`${BRAND_LABEL[b]} ${APPLIANCE_LABEL[a]} ${v ? 'enabled' : 'disabled'}`)
  }

  return (
    <Card>
      <CardHeader title="Service availability" sub={`${enabled} of ${BRANDS.length * APPLIANCES.length} brand × appliance pairs bookable`} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr>
              <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-faint">Brand</th>
              {APPLIANCES.map((a) => (
                <th key={a} className="px-3 py-3 text-center">
                  <span className="inline-flex flex-col items-center gap-1.5">
                    <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand">
                      <ApplianceGlyph appliance={a} />
                    </span>
                    <span className="text-xs font-bold text-ink-2">{APPLIANCE_LABEL[a]}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BRANDS.map((b) => (
              <tr key={b} className="border-t border-line">
                <th scope="row" className="px-5 py-3.5 text-left font-extrabold">
                  {BRAND_LABEL[b]}
                  {!store.catalog.brands[b].enabled && <span className="mt-0.5 block text-[11px] font-semibold text-warning">Brand disabled in draft</span>}
                </th>
                {APPLIANCES.map((a) => (
                  <td key={a} className="px-3 py-3.5 text-center">
                    <span className="inline-flex">
                      <Toggle checked={m[b][a]} label={`${BRAND_LABEL[b]} ${APPLIANCE_LABEL[a]}`} onChange={(v) => flip(b, a, v)} />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="flex items-start gap-2 border-t border-line px-5 py-3 text-xs font-medium text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Turning a pair off hides it from customer booking and stops technicians receiving offers for it. Bookings already made are not affected.
      </p>
    </Card>
  )
}
