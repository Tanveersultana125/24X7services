'use client'

import { useMemo, useState } from 'react'
import { ImagePlus, Pause, Pencil, Play, Plus, TicketPercent, Trash2 } from 'lucide-react'
import { APPLIANCES, APPLIANCE_LABEL, BRANDS, BRAND_LABEL, inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { longDate } from '@/lib/format'
import { useStore, useTick } from '@/lib/store'
import type { Tone } from '@/lib/status'
import { OFFER_TYPES, type Coupon, type OfferType } from '@/lib/types'
import { MediaPicker, MediaThumb } from './media'
import { useToast } from './toast'
import { Button, Card, CardHeader, Chip, Empty, Field, Modal, Select, inputClass, tone } from './ui'

export const OFFER_LABEL: Record<OfferType, string> = {
  percentage: 'Percentage Discount',
  fixed: 'Fixed Discount',
  first_booking: 'First Booking',
  emergency: 'Emergency Offer',
  brand: 'Brand Offer',
  service: 'Service Offer',
  seasonal: 'Seasonal Offer',
}

const TYPE_TONE: Record<OfferType, Tone> = {
  percentage: 'brand',
  fixed: 'info',
  first_booking: 'success',
  emergency: 'danger',
  brand: 'violet',
  service: 'warning',
  seasonal: 'neutral',
}

type Status = 'active' | 'paused' | 'scheduled' | 'expired'
const STATUS: Record<Status, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'success' },
  paused: { label: 'Paused', tone: 'neutral' },
  scheduled: { label: 'Scheduled', tone: 'brand' },
  expired: { label: 'Expired', tone: 'danger' },
}

/** What an offer is doing right now, from its switch and its dates. */
export function offerStatus(c: Coupon, now: number): Status {
  if (new Date(c.expires).getTime() < now) return 'expired'
  if (!c.active) return 'paused'
  if (c.start && new Date(c.start).getTime() > now) return 'scheduled'
  return 'active'
}

const typeOf = (c: Coupon): OfferType => c.type ?? (c.kind === 'percent' ? 'percentage' : 'fixed')

function discountText(c: Coupon) {
  const d = c.kind === 'percent' ? `${c.value}% off` : `${inr(c.value)} off`
  return c.kind === 'percent' && c.maxDiscount ? `${d} · up to ${inr(c.maxDiscount)}` : d
}

function scope(c: Coupon) {
  const b = !c.brand || c.brand === 'all' ? 'All brands' : BRAND_LABEL[c.brand]
  const a = !c.appliance || c.appliance === 'all' ? 'all services' : APPLIANCE_LABEL[c.appliance]
  return `${b} · ${a}`
}

/** Every offer and coupon customers can redeem, with create, edit, pause and delete. */
export function OffersManager() {
  const store = useStore()
  const toast = useToast()
  const now = useTick(60_000)
  const [type, setType] = useState<OfferType | 'all'>('all')
  const [status, setStatus] = useState<Status | 'all'>('all')
  const [editing, setEditing] = useState<{ coupon?: Coupon; preset: 'offer' | 'coupon' } | null>(null)
  const [deleting, setDeleting] = useState<Coupon | null>(null)
  const canCreate = store.can('promotions', 'create')
  const canEdit = store.can('promotions', 'edit')
  const canDelete = store.can('promotions', 'delete')

  const list = useMemo(
    () => store.coupons.filter((c) => (type === 'all' || typeOf(c) === type) && (status === 'all' || offerStatus(c, now) === status)),
    [store.coupons, type, status, now]
  )
  const counts = useMemo(() => {
    const out: Record<Status, number> = { active: 0, paused: 0, scheduled: 0, expired: 0 }
    for (const c of store.coupons) out[offerStatus(c, now)]++
    return out
  }, [store.coupons, now])

  return (
    <Card>
      <CardHeader
        title="Offers & coupons"
        sub={`${counts.active} active · ${counts.scheduled} scheduled · ${counts.paused} paused · ${counts.expired} expired`}
        action={
          canCreate && (
            <>
              <Button size="sm" variant="secondary" onClick={() => setEditing({ preset: 'coupon' })}>
                <TicketPercent /> Create coupon
              </Button>
              <Button size="sm" onClick={() => setEditing({ preset: 'offer' })}>
                <Plus /> Create offer
              </Button>
            </>
          )
        }
      />
      <div className="flex flex-wrap gap-2 border-b border-line px-5 py-3">
        <Select
          label="Offer type"
          value={type}
          onChange={setType}
          options={[{ value: 'all', label: 'All types' }, ...OFFER_TYPES.map((t) => ({ value: t, label: OFFER_LABEL[t] }))]}
        />
        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={[{ value: 'all', label: 'Any status' }, ...(Object.keys(STATUS) as Status[]).map((s) => ({ value: s, label: `${STATUS[s].label} (${counts[s]})` }))]}
        />
      </div>

      {list.length === 0 ? (
        <Empty icon={<TicketPercent />} title="No offers match" body="Change the filters or create a new offer." />
      ) : (
        <ul className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
          {list.map((c) => {
            const st = offerStatus(c, now)
            const share = Math.min(c.used / Math.max(c.limit, 1), 1)
            const t = typeOf(c)
            return (
              <li key={c.code} className={cn('flex flex-col overflow-hidden rounded-card border border-line bg-card', st === 'expired' && 'opacity-75')}>
                <div className="relative">
                  {c.image ? (
                    <MediaThumb src={c.image} className="aspect-[16/7] w-full" cover />
                  ) : (
                    // No artwork yet: a quiet band in the offer type's colour.
                    <span className={cn('flex h-14 w-full items-center justify-end px-4', tone(TYPE_TONE[t]).soft, tone(TYPE_TONE[t]).text)}>
                      <TicketPercent className="size-5 opacity-60" aria-hidden />
                    </span>
                  )}
                  <span className="absolute left-3 top-3 flex gap-1.5">
                    <Chip tone={STATUS[st].tone} className="bg-card">
                      {STATUS[st].label}
                    </Chip>
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold">{c.title || c.description}</p>
                      <p className="truncate text-xs font-medium text-muted">{c.description}</p>
                    </div>
                    <span className="shrink-0 rounded-md border border-dashed border-brand/40 bg-brand-soft px-2 py-0.5 font-mono text-[12px] font-bold text-brand">{c.code}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Chip tone={TYPE_TONE[t]} dot={false}>
                      {OFFER_LABEL[t]}
                    </Chip>
                    <span className="num text-[13px] font-extrabold">{discountText(c)}</span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <dt className="font-semibold text-faint">Applies to</dt>
                    <dd className="truncate text-right font-semibold text-ink-2">{scope(c)}</dd>
                    <dt className="font-semibold text-faint">Min. booking</dt>
                    <dd className="num text-right font-semibold text-ink-2">{c.minOrder ? inr(c.minOrder) : '—'}</dd>
                    <dt className="font-semibold text-faint">Runs</dt>
                    <dd className="text-right font-semibold text-ink-2">
                      {c.start ? `${longDate(c.start)} – ` : 'Until '}
                      {longDate(c.expires)}
                    </dd>
                  </dl>
                  <div className="mt-3">
                    <p className="num mb-1 flex justify-between text-[11px] font-bold">
                      <span>{c.used.toLocaleString('en-IN')} used</span>
                      <span className="font-semibold text-faint">limit {c.limit.toLocaleString('en-IN')}</span>
                    </p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
                      <div className={cn('h-full rounded-full', share > 0.9 ? 'bg-warning' : 'bg-brand')} style={{ width: `${share * 100}%` }} />
                    </div>
                  </div>
                  {(canEdit || canDelete) && (
                    <div className="mt-4 flex gap-2 border-t border-line pt-3">
                      {canEdit && (
                        <Button size="xs" variant="secondary" onClick={() => setEditing({ coupon: c, preset: 'offer' })}>
                          <Pencil /> Edit
                        </Button>
                      )}
                      {canEdit && st !== 'expired' && (
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => {
                            store.toggleCoupon(c.code)
                            toast(`${c.code} ${c.active ? 'paused' : 'activated'}`)
                          }}
                        >
                          {c.active ? <Pause /> : <Play />} {c.active ? 'Pause' : 'Activate'}
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="xs" variant="subtle" className="ml-auto text-danger hover:bg-danger-soft" onClick={() => setDeleting(c)}>
                          <Trash2 /> Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editing && <OfferModal coupon={editing.coupon} preset={editing.preset} onClose={() => setEditing(null)} />}

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.code}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Keep offer
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!deleting) return
                store.deleteCoupon(deleting.code)
                toast(`${deleting.code} deleted`)
                setDeleting(null)
              }}
            >
              <Trash2 /> Delete offer
            </Button>
          </>
        }
      >
        <p className="text-sm font-medium text-muted">
          Customers can no longer apply <span className="font-mono font-bold text-ink">{deleting?.code}</span>. Bookings that already used it keep their discount. To stop it temporarily, pause it instead.
        </p>
      </Modal>
    </Card>
  )
}

const toDate = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : '')

/** Create or edit one offer. A coupon is the same thing with the code up front. */
function OfferModal({ coupon, preset, onClose }: { coupon?: Coupon; preset: 'offer' | 'coupon'; onClose: () => void }) {
  const store = useStore()
  const toast = useToast()
  const editing = !!coupon
  const [f, setF] = useState(() => {
    const today = new Date()
    const in30 = new Date(today.getTime() + 30 * 86_400_000)
    return {
    type: (coupon ? typeOf(coupon) : preset === 'coupon' ? 'fixed' : 'percentage') as OfferType,
    title: coupon?.title ?? '',
    description: coupon?.description ?? '',
    code: coupon?.code ?? '',
    kind: (coupon?.kind ?? (preset === 'coupon' ? 'flat' : 'percent')) as Coupon['kind'],
    value: String(coupon?.value ?? (preset === 'coupon' ? 100 : 15)),
    minOrder: String(coupon?.minOrder ?? 499),
    maxDiscount: String(coupon?.maxDiscount ?? ''),
    start: toDate(coupon?.start) || toDate(today.toISOString()),
    end: toDate(coupon?.expires) || toDate(in30.toISOString()),
    limit: String(coupon?.limit ?? 500),
    brand: (coupon?.brand ?? 'all') as NonNullable<Coupon['brand']>,
    appliance: (coupon?.appliance ?? 'all') as NonNullable<Coupon['appliance']>,
    image: coupon?.image ?? '',
    }
  })
  const [picking, setPicking] = useState(false)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))

  const code = f.code.trim().toUpperCase()
  const taken = !editing && store.coupons.some((c) => c.code === code)
  const errors = [
    !/^[A-Z0-9]{4,14}$/.test(code) && 'Code must be 4–14 letters or digits',
    taken && 'That code already exists',
    !f.title.trim() && 'Add a title',
    !(Number(f.value) > 0) && 'Discount must be more than 0',
    f.kind === 'percent' && Number(f.value) > 90 && 'Percent discount is capped at 90%',
    !(Number(f.limit) > 0) && 'Set a usage limit',
    (!f.start || !f.end || f.end < f.start) && 'End date must be after the start date',
  ].filter(Boolean) as string[]

  // Brand and service offers need something to apply to.
  const pickType = (t: OfferType) => {
    setF((x) => ({
      ...x,
      type: t,
      kind: t === 'percentage' || t === 'seasonal' ? 'percent' : t === 'fixed' || t === 'first_booking' || t === 'emergency' ? 'flat' : x.kind,
      brand: t === 'brand' && x.brand === 'all' ? 'samsung' : x.brand,
      appliance: t === 'service' && x.appliance === 'all' ? 'ac' : x.appliance,
    }))
  }

  const save = () => {
    const start = new Date(`${f.start}T00:00:00`)
    const end = new Date(`${f.end}T23:59:00`)
    store.saveCoupon({
      code,
      title: f.title.trim(),
      description: f.description.trim() || f.title.trim(),
      type: f.type,
      kind: f.kind,
      value: Number(f.value),
      minOrder: Number(f.minOrder) || 0,
      maxDiscount: Number(f.maxDiscount) || undefined,
      used: coupon?.used ?? 0,
      limit: Number(f.limit),
      active: coupon?.active ?? true,
      start: start.toISOString(),
      expires: end.toISOString(),
      brand: f.brand,
      appliance: f.appliance,
      image: f.image || undefined,
    })
    toast(`${code} ${editing ? 'updated' : 'created'}`)
    onClose()
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={editing ? `Edit ${coupon.code}` : preset === 'coupon' ? 'Create coupon' : 'Create offer'}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={errors.length > 0} onClick={save}>
              {editing ? 'Save changes' : preset === 'coupon' ? 'Create coupon' : 'Create offer'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <span className="mb-1.5 block text-[13px] font-bold text-ink-2">Offer image</span>
            <button type="button" onClick={() => setPicking(true)} className="group relative block w-full overflow-hidden rounded-lg border border-dashed border-line-strong hover:border-brand">
              <MediaThumb src={f.image || undefined} className="aspect-[16/6] w-full" cover />
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-ink/55 py-1.5 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                <ImagePlus className="size-3.5" /> {f.image ? 'Change image' : 'Choose image'}
              </span>
            </button>
          </div>
          <Field label="Offer type" className="col-span-2">
            <select value={f.type} onChange={(e) => pickType(e.target.value as OfferType)} className={inputClass}>
              {OFFER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {OFFER_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title" className="col-span-2">
            <input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Monsoon cooling care" className={inputClass} />
          </Field>
          <Field label="Description" className="col-span-2">
            <input value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="20% off AC & fridge gas refill" className={inputClass} />
          </Field>
          <Field label="Coupon code" className="col-span-2" hint={editing ? 'Codes can’t change once created' : '4–14 letters or digits'}>
            <input
              value={f.code}
              disabled={editing}
              onChange={(e) => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="SUMMER25"
              className={`${inputClass} font-mono font-bold uppercase disabled:bg-canvas disabled:text-muted`}
            />
          </Field>
          <Field label="Discount type">
            <select value={f.kind} onChange={(e) => set('kind', e.target.value as Coupon['kind'])} className={inputClass}>
              <option value="flat">Fixed ₹ off</option>
              <option value="percent">Percent off</option>
            </select>
          </Field>
          <Field label={f.kind === 'flat' ? 'Discount (₹)' : 'Discount (%)'}>
            <input type="number" min={1} value={f.value} onChange={(e) => set('value', e.target.value)} className={`${inputClass} num`} />
          </Field>
          <Field label="Minimum booking (₹)">
            <input type="number" min={0} value={f.minOrder} onChange={(e) => set('minOrder', e.target.value)} className={`${inputClass} num`} />
          </Field>
          <Field label="Maximum discount (₹)" hint={f.kind === 'flat' ? 'Not needed for a fixed discount' : 'Leave empty for no cap'}>
            <input type="number" min={0} value={f.maxDiscount} disabled={f.kind === 'flat'} onChange={(e) => set('maxDiscount', e.target.value)} className={`${inputClass} num disabled:bg-canvas`} />
          </Field>
          <Field label="Start date">
            <input type="date" value={f.start} onChange={(e) => set('start', e.target.value)} className={inputClass} />
          </Field>
          <Field label="End date">
            <input type="date" value={f.end} min={f.start} onChange={(e) => set('end', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Usage limit">
            <input type="number" min={1} value={f.limit} onChange={(e) => set('limit', e.target.value)} className={`${inputClass} num`} />
          </Field>
          <Field label="Applicable brand">
            <select value={f.brand} onChange={(e) => set('brand', e.target.value as typeof f.brand)} className={inputClass}>
              <option value="all">All brands</option>
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {BRAND_LABEL[b]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Applicable service" className="col-span-2">
            <select value={f.appliance} onChange={(e) => set('appliance', e.target.value as typeof f.appliance)} className={inputClass}>
              <option value="all">All services</option>
              {APPLIANCES.map((a) => (
                <option key={a} value={a}>
                  {APPLIANCE_LABEL[a]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {errors.length > 0 && (
          <p className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-xs font-semibold text-warning" role="status">
            {errors[0]}
          </p>
        )}
      </Modal>
      <MediaPicker open={picking} onClose={() => setPicking(false)} category="promotion" title="Offer image" onPick={(m) => set('image', m.url)} />
    </>
  )
}
