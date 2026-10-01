'use client'

import { useState } from 'react'
import { Info, Save } from 'lucide-react'
import { ApplianceGlyph } from '@/components/glyphs'
import { useToast } from '@/components/toast'
import { Button, Card, CardHeader, Field, Page, PageHeader, Toggle, inputClass } from '@/components/ui'
import { APPLIANCES, APPLIANCE_LABEL, BRANDS, BRAND_LABEL, inr, type Appliance } from '@/lib/catalog'
import { useStore } from '@/lib/store'
import { SERVICE_TYPES, type ServiceType } from '@/lib/types'

/** Which services make sense for which appliance — shown for reference. */
const SERVICES: Record<Appliance, ServiceType[]> = {
  washer: ['Repair', 'General service', 'Deep cleaning', 'Installation', 'Uninstallation'],
  fridge: ['Repair', 'General service', 'Gas refill', 'Installation'],
  oven: ['Repair', 'General service', 'Installation'],
  ac: ['Repair', 'General service', 'Gas refill', 'Deep cleaning', 'Installation', 'Uninstallation'],
  geyser: ['Repair', 'General service', 'Installation', 'Uninstallation'],
}

/** What the network sells and at what price. */
export default function Catalog() {
  const store = useStore()
  const toast = useToast()
  const s = store.settings
  const [labour, setLabour] = useState<Record<Appliance, string>>(() => Object.fromEntries(APPLIANCES.map((a) => [a, String(s.labour[a])])) as Record<Appliance, string>)
  const [fees, setFees] = useState({ surcharge: String(s.emergencySurcharge), commission: String(s.commissionPct), gst: String(s.gstPct) })

  const enabled = BRANDS.reduce((n, b) => n + APPLIANCES.filter((a) => s.matrix[b][a]).length, 0)
  const labourDirty = APPLIANCES.some((a) => Number(labour[a]) !== s.labour[a])
  const feesDirty = Number(fees.surcharge) !== s.emergencySurcharge || Number(fees.commission) !== s.commissionPct || Number(fees.gst) !== s.gstPct
  const valid = (v: string, max = 100000) => v.trim() !== '' && Number(v) >= 0 && Number(v) <= max

  return (
    <Page>
      <PageHeader title="Services & Pricing" sub="Brands, appliances and rates offered to customers and technicians" />

      <Card>
        <CardHeader
          title="Service availability"
          sub={`${enabled} of ${BRANDS.length * APPLIANCES.length} brand × appliance pairs bookable`}
        />
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
                  <td className="px-5 py-3 font-extrabold">{BRAND_LABEL[b]}</td>
                  {APPLIANCES.map((a) => (
                    <td key={a} className="px-3 py-3 text-center">
                      <Toggle
                        checked={s.matrix[b][a]}
                        label={`${BRAND_LABEL[b]} ${APPLIANCE_LABEL[a]}`}
                        onChange={(on) => {
                          store.updateSettings((cur) => ({ matrix: { ...cur.matrix, [b]: { ...cur.matrix[b], [a]: on } } }))
                          toast(`${BRAND_LABEL[b]} ${APPLIANCE_LABEL[a]} ${on ? 'enabled' : 'disabled'}`)
                        }}
                      />
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

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Visit & labour rates"
            sub="Charged before parts, per appliance"
            action={
              <Button
                size="sm"
                disabled={!labourDirty || APPLIANCES.some((a) => !valid(labour[a]))}
                onClick={() => {
                  store.updateSettings({ labour: Object.fromEntries(APPLIANCES.map((a) => [a, Number(labour[a])])) as Record<Appliance, number> })
                  toast('Labour rates saved')
                }}
              >
                <Save /> Save
              </Button>
            }
          />
          <ul className="divide-y divide-line">
            {APPLIANCES.map((a) => (
              <li key={a} className="flex items-center gap-3 px-5 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink-2">
                  <ApplianceGlyph appliance={a} className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{APPLIANCE_LABEL[a]}</span>
                  <span className="block text-xs font-medium text-muted">Currently {inr(s.labour[a])}</span>
                </span>
                <label className="relative w-32">
                  <span className="sr-only">{APPLIANCE_LABEL[a]} rate</span>
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-faint">₹</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={labour[a]}
                    onChange={(e) => setLabour((l) => ({ ...l, [a]: e.target.value }))}
                    className={`${inputClass} num pl-7 text-right font-bold`}
                  />
                </label>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="self-start">
          <CardHeader
            title="Fees & taxes"
            sub="Applied to every new booking"
            action={
              <Button
                size="sm"
                disabled={!feesDirty || !valid(fees.surcharge) || !valid(fees.commission, 100) || !valid(fees.gst, 100)}
                onClick={() => {
                  store.updateSettings({ emergencySurcharge: Number(fees.surcharge), commissionPct: Number(fees.commission), gstPct: Number(fees.gst) })
                  toast('Fees & taxes saved')
                }}
              >
                <Save /> Save
              </Button>
            }
          />
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <Field label="Emergency surcharge (₹)" hint="Added to 24×7 emergency bookings">
              <input type="number" min={0} value={fees.surcharge} onChange={(e) => setFees((f) => ({ ...f, surcharge: e.target.value }))} className={`${inputClass} num`} />
            </Field>
            <Field label="Platform commission (%)" hint="Deducted from technician payouts">
              <input type="number" min={0} max={100} value={fees.commission} onChange={(e) => setFees((f) => ({ ...f, commission: e.target.value }))} className={`${inputClass} num`} />
            </Field>
            <Field label="GST (%)" hint="On labour and parts">
              <input type="number" min={0} max={100} value={fees.gst} onChange={(e) => setFees((f) => ({ ...f, gst: e.target.value }))} className={`${inputClass} num`} />
            </Field>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="Services offered" sub={`${SERVICE_TYPES.length} service types across ${APPLIANCES.length} appliances`} />
        <div className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-5">
          {APPLIANCES.map((a) => (
            <div key={a} className="bg-card p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-extrabold">
                <ApplianceGlyph appliance={a} className="size-[18px] text-brand" />
                {APPLIANCE_LABEL[a]}
              </p>
              <ul className="space-y-1.5">
                {SERVICES[a].map((sv) => (
                  <li key={sv} className="flex items-center justify-between gap-2 text-[13px] font-semibold text-ink-2">
                    {sv}
                    <span className="num text-xs font-bold text-muted">
                      {sv === 'Installation' || sv === 'Uninstallation' ? inr(Math.round((s.labour[a] * 0.8) / 10) * 10) : sv === 'Gas refill' ? `from ${inr(s.labour[a] + 2200)}` : `from ${inr(s.labour[a])}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </Page>
  )
}
