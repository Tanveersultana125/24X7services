'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useState } from 'react'
import { BellRing, Gift, Plus, Send, TicketPercent } from 'lucide-react'
import { useToast } from '@/components/toast'
import { Avatar, Button, Card, CardHeader, Chip, Field, Modal, Page, PageHeader, Segmented, TableWrap, Toggle, inputClass, td, th, tr } from '@/components/ui'
import { inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ago, longDate } from '@/lib/format'
import { useStore, useTick } from '@/lib/store'
import type { Broadcast, Coupon } from '@/lib/types'

type Audience = Broadcast['audience']
const AUDIENCE: Record<Audience, string> = { customers: 'Customers', technicians: 'Technicians', all: 'Everyone' }

/** Customer growth levers: coupons, referrals and push messages. */
export default function Promotions() {
  const store = useStore()
  const toast = useToast()
  const [creating, setCreating] = useState(false)

  const now = useTick(60_000)
  const live = store.coupons.filter((c) => c.active && new Date(c.expires).getTime() > now)
  const refer = store.coupons.find((c) => c.code === 'REFER100')
  const referrers = [...store.customers].filter((c) => c.referrals > 0).sort((a, z) => z.referrals - a.referrals)
  const totalRefs = referrers.reduce((s, c) => s + c.referrals, 0)
  const referBookings = store.bookings.filter((b) => b.coupon === 'REFER100')

  return (
    <Page>
      <PageHeader
        side="customer"
        title="Promotions"
        sub="Coupons, referrals and push notifications"
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> New coupon
          </Button>
        }
      />

      <Card>
        <CardHeader title="Coupons" sub={`${live.length} live · ${store.coupons.length} total`} />
        <TableWrap>
          <thead>
            <tr>
              <th className={th}>Code</th>
              <th className={th}>Discount</th>
              <th className={th}>Min. order</th>
              <th className={th}>Usage</th>
              <th className={th}>Expires</th>
              <th className={`${th} text-right`}>Active</th>
            </tr>
          </thead>
          <tbody>
            {store.coupons.map((c) => {
              const expired = new Date(c.expires).getTime() < now
              const share = Math.min(c.used / Math.max(c.limit, 1), 1)
              return (
                <tr key={c.code} className={tr}>
                  <td className={td}>
                    <span className="inline-flex items-center gap-2">
                      <span className="rounded-md border border-dashed border-brand/40 bg-brand-soft px-2 py-0.5 font-mono text-[13px] font-bold text-brand">{c.code}</span>
                    </span>
                    <span className="mt-1 block text-xs font-medium text-muted">{c.description}</span>
                  </td>
                  <td className={`${td} num font-bold`}>{c.kind === 'flat' ? inr(c.value) : `${c.value}%`}</td>
                  <td className={`${td} num`}>{c.minOrder ? inr(c.minOrder) : '—'}</td>
                  <td className={td}>
                    <div className="w-36">
                      <p className="num mb-1 text-xs font-bold">
                        {c.used.toLocaleString('en-IN')} <span className="font-semibold text-faint">/ {c.limit.toLocaleString('en-IN')}</span>
                      </p>
                      <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
                        <div className={cn('h-full rounded-full', share > 0.9 ? 'bg-warning' : 'bg-brand')} style={{ width: `${share * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    {expired ? <Chip tone="neutral">Expired {longDate(c.expires)}</Chip> : <span className="text-[13px] font-semibold text-ink-2">{longDate(c.expires)}</span>}
                  </td>
                  <td className={`${td} text-right`}>
                    <Toggle
                      checked={c.active}
                      label={`${c.code} active`}
                      onChange={() => {
                        store.toggleCoupon(c.code)
                        toast(`${c.code} ${c.active ? 'paused' : 'activated'}`)
                      }}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </TableWrap>
      </Card>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="self-start">
          <CardHeader title="Referral programme" sub="Both friends get ₹100 off with REFER100" />
          <dl className="grid grid-cols-3 divide-x divide-line border-b border-line">
            {[
              ['Referrals', totalRefs.toLocaleString('en-IN')],
              ['Redeemed', (refer?.used ?? 0).toLocaleString('en-IN')],
              ['Booked · 30d', referBookings.length.toLocaleString('en-IN')],
            ].map(([k, v]) => (
              <div key={k} className="px-4 py-3 text-center">
                <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-faint">{k}</dt>
                <dd className="num mt-0.5 text-lg font-extrabold">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="px-5 pb-1 pt-4 text-[11px] font-extrabold uppercase tracking-[0.1em] text-faint">Top referrers</p>
          <ul className="divide-y divide-line">
            {referrers.slice(0, 6).map((c, i) => (
              <li key={c.id}>
                <Link href={`/customers/?id=${c.id}` as Route} className="flex items-center gap-3 px-5 py-2.5 hover:bg-canvas/60">
                  <span className="num w-4 text-xs font-bold text-faint">{i + 1}</span>
                  <Avatar name={c.name} size={30} side="customer" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{c.name}</span>
                    <span className="block font-mono text-[11px] font-semibold text-muted">{c.referralCode}</span>
                  </span>
                  <span className="num text-sm font-extrabold">
                    {c.referrals} <Gift className="inline size-3.5 text-faint" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Compose />

        <Card className="self-start">
          <CardHeader title="Sent notifications" sub={`${store.broadcasts.length} pushes`} />
          <ul className="max-h-[480px] divide-y divide-line overflow-y-auto">
            {store.broadcasts.map((b) => (
              <li key={b.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <Chip tone={b.audience === 'technicians' ? 'violet' : b.audience === 'customers' ? 'brand' : 'info'}>{AUDIENCE[b.audience]}</Chip>
                  <span className="text-[11px] font-semibold text-faint">{ago(b.at)}</span>
                </div>
                <p className="mt-2 text-sm font-bold">{b.title}</p>
                <p className="mt-0.5 text-[13px] font-medium text-muted">{b.body}</p>
                <p className="num mt-1.5 text-[11px] font-bold text-faint">Delivered to {b.reach.toLocaleString('en-IN')}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <NewCoupon open={creating} onClose={() => setCreating(false)} />
    </Page>
  )
}

/** Push composer with a lock-screen preview of what lands on the phone. */
function Compose() {
  const store = useStore()
  const toast = useToast()
  const [audience, setAudience] = useState<Audience>('customers')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const reach =
    audience === 'customers'
      ? store.customers.filter((c) => c.status === 'active').length
      : audience === 'technicians'
        ? store.technicians.filter((t) => t.kyc === 'verified').length
        : store.customers.filter((c) => c.status === 'active').length + store.technicians.filter((t) => t.kyc === 'verified').length

  return (
    <Card className="self-start">
      <CardHeader title="Send push notification" sub={`Reaches ${reach} ${audience === 'all' ? 'people' : audience}`} />
      <div className="space-y-4 p-5">
        <Segmented
          value={audience}
          onChange={setAudience}
          className="w-full [&>button]:flex-1"
          options={(['customers', 'technicians', 'all'] as const).map((a) => ({ value: a, label: AUDIENCE[a] }))}
        />
        <Field label="Title">
          <input value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="Monsoon AC check-up — 20% off" className={inputClass} />
        </Field>
        <Field label="Message" hint={`${body.length}/160`}>
          <textarea value={body} maxLength={160} rows={3} onChange={(e) => setBody(e.target.value)} placeholder="What should people know?" className={inputClass} />
        </Field>

        <div className="rounded-2xl bg-gradient-to-b from-[#1b2550] to-[#0f1d57] p-3" aria-label="Preview">
          <p className="num mb-2 text-center text-[11px] font-semibold text-white/60">
            {new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
          </p>
          <div className="rounded-xl bg-white/90 p-3 shadow-float backdrop-blur">
            <div className="flex items-center gap-2 text-[11px] font-bold text-muted">
              <span className="grid size-5 place-items-center rounded bg-brand-ink text-[7px] font-extrabold text-white">24×7</span>
              {audience === 'technicians' ? '24X7 PARTNER' : '24X7 SERVICES'} · now
            </div>
            <p className="mt-1.5 truncate text-[13px] font-extrabold text-ink">{title || 'Notification title'}</p>
            <p className="line-clamp-2 text-xs font-medium text-ink-2">{body || 'Your message appears here.'}</p>
          </div>
        </div>

        <Button
          className="w-full"
          disabled={!title.trim() || !body.trim()}
          onClick={() => {
            store.sendBroadcast({ audience, title: title.trim(), body: body.trim() })
            toast(`Push sent to ${reach} ${audience === 'all' ? 'people' : audience}`)
            setTitle('')
            setBody('')
          }}
        >
          <Send /> Send now
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-faint">
          <BellRing className="size-3.5" aria-hidden /> Respects each person’s notification settings
        </p>
      </div>
    </Card>
  )
}

function NewCoupon({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useStore()
  const toast = useToast()
  const blank = { code: '', description: '', kind: 'flat' as Coupon['kind'], value: '100', minOrder: '499', limit: '500', days: '30' }
  const [f, setF] = useState(blank)
  const code = f.code.trim().toUpperCase()
  const taken = store.coupons.some((c) => c.code === code)
  const ok = /^[A-Z0-9]{4,14}$/.test(code) && !taken && f.description.trim() && Number(f.value) > 0 && (f.kind === 'flat' || Number(f.value) <= 90) && Number(f.limit) > 0 && Number(f.days) > 0

  const close = () => {
    setF(blank)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="New coupon"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={!ok}
            onClick={() => {
              const expires = new Date()
              expires.setDate(expires.getDate() + Number(f.days))
              expires.setHours(23, 59, 0, 0)
              store.saveCoupon({
                code,
                description: f.description.trim(),
                kind: f.kind,
                value: Number(f.value),
                minOrder: Number(f.minOrder) || 0,
                used: 0,
                limit: Number(f.limit),
                active: true,
                expires: expires.toISOString(),
              })
              toast(`Coupon ${code} created`)
              close()
            }}
          >
            <TicketPercent /> Create coupon
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Code" className="col-span-2" hint={taken ? <span className="font-semibold text-danger">That code already exists</span> : '4–14 letters or digits'}>
          <input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} placeholder="SUMMER25" className={`${inputClass} font-mono font-bold uppercase`} />
        </Field>
        <Field label="Description" className="col-span-2">
          <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="25% off any AC service" className={inputClass} />
        </Field>
        <Field label="Type">
          <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as Coupon['kind'] })} className={inputClass}>
            <option value="flat">Flat ₹ off</option>
            <option value="percent">Percent off</option>
          </select>
        </Field>
        <Field label={f.kind === 'flat' ? 'Amount (₹)' : 'Percent (%)'}>
          <input type="number" min={1} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} className={`${inputClass} num`} />
        </Field>
        <Field label="Min. order (₹)">
          <input type="number" min={0} value={f.minOrder} onChange={(e) => setF({ ...f, minOrder: e.target.value })} className={`${inputClass} num`} />
        </Field>
        <Field label="Usage limit">
          <input type="number" min={1} value={f.limit} onChange={(e) => setF({ ...f, limit: e.target.value })} className={`${inputClass} num`} />
        </Field>
        <Field label="Valid for (days)" className="col-span-2">
          <input type="number" min={1} value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} className={`${inputClass} num`} />
        </Field>
      </div>
    </Modal>
  )
}
