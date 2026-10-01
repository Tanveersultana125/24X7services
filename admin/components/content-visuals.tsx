'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CalendarClock, ExternalLink, ImagePlus, Pencil, Plus, Replace, Trash2, Upload } from 'lucide-react'
import { APPLIANCES, APPLIANCE_LABEL, BRANDS, BRAND_LABEL, type Appliance, type Brand } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { longDate } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { Tone } from '@/lib/status'
import type { Banner } from '@/lib/types'
import { MediaPicker, MediaThumb, readImage, UploadButton } from './media'
import { useToast } from './toast'
import { Button, buttonClass, Card, CardHeader, Chip, Field, inputClass, Modal, Select, Toggle } from './ui'
import { fileName, fromDateInput, toDateInput } from './content-shared'

/* --------------------------------------------------------------- Banners */

export function bannerStatus(b: Banner, now = Date.now()): { label: string; tone: Tone } {
  if (!b.enabled) return { label: 'Disabled', tone: 'neutral' }
  if (+new Date(b.start) > now) return { label: 'Scheduled', tone: 'info' }
  if (+new Date(b.end) < now) return { label: 'Expired', tone: 'danger' }
  return { label: 'Live', tone: 'success' }
}

const PLACEMENTS: Banner['placement'][] = ['Home hero', 'Home strip', 'Offers page']

export function BannersTab() {
  const store = useStore()
  const toast = useToast()
  const canCreate = store.can('content', 'create')
  const canEdit = store.can('content', 'edit')
  const canDelete = store.can('content', 'delete')
  const [form, setForm] = useState<Banner | 'new' | null>(null)
  const [replacing, setReplacing] = useState<Banner | null>(null)
  const [deleting, setDeleting] = useState<Banner | null>(null)
  const label = (b: Banner) => `${b.id} · ${b.heading}`

  const patch = (b: Banner, p: Partial<Banner>, action: string, old?: string, nw?: string) =>
    store.updateContent((c) => ({ ...c, banners: c.banners.map((x) => (x.id === b.id ? { ...x, ...p } : x)) }), { action, target: label(b), old, new: nw })

  return (
    <Card>
      <CardHeader
        title="Banners"
        sub={`${store.content.banners.length} banners · ${store.content.banners.filter((b) => bannerStatus(b).label === 'Live').length} live now`}
        action={
          <Button size="sm" disabled={!canCreate} onClick={() => setForm('new')}>
            <Upload /> Upload banner
          </Button>
        }
      />
      <ul className="grid gap-4 p-5 md:grid-cols-2 2xl:grid-cols-3">
        {store.content.banners.map((b) => {
          const st = bannerStatus(b)
          return (
            <li key={b.id} className="overflow-hidden rounded-card border border-line bg-card">
              <div className="relative">
                <MediaThumb src={b.image} cover className="aspect-[16/8] w-full" />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/80 via-ink/20 to-transparent p-3 text-white">
                  <p className="text-[15px] font-extrabold leading-tight">{b.heading}</p>
                  <p className="text-xs font-medium text-white/80">{b.sub}</p>
                </div>
                <Chip tone={st.tone} className="absolute left-2 top-2 bg-card">
                  {st.label}
                </Chip>
              </div>
              <div className="space-y-2 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-muted">
                  <span>
                    {b.placement} · CTA “{b.cta}”
                  </span>
                  <Toggle
                    size="sm"
                    checked={b.enabled}
                    label={`Enable ${b.heading}`}
                    onChange={(v) => {
                      if (!canEdit) return
                      patch(b, { enabled: v }, v ? 'Enabled banner' : 'Disabled banner', v ? 'Disabled' : 'Enabled', v ? 'Enabled' : 'Disabled')
                      toast(`${b.heading} ${v ? 'enabled' : 'disabled'} in draft`)
                    }}
                  />
                </div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-2">
                  <CalendarClock className="size-3.5 text-faint" aria-hidden />
                  {longDate(b.start)} → {longDate(b.end)}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Button size="xs" variant="secondary" disabled={!canEdit} onClick={() => setForm(b)}>
                    <Pencil /> Edit & schedule
                  </Button>
                  <Button size="xs" variant="secondary" disabled={!canEdit} onClick={() => setReplacing(b)}>
                    <Replace /> Replace image
                  </Button>
                  <Button size="xs" variant="subtle" className="ml-auto text-danger hover:bg-danger-soft" disabled={!canDelete} onClick={() => setDeleting(b)}>
                    <Trash2 /> Delete
                  </Button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {form && (
        <BannerForm
          initial={form === 'new' ? null : form}
          onClose={() => setForm(null)}
          onSave={(b, isNew) => {
            if (isNew) {
              store.updateContent((c) => ({ ...c, banners: [...c.banners, b] }), { action: 'Created banner', target: label(b), new: fileName(b.image, store.media) })
              toast(`Banner “${b.heading}” added to draft`)
            } else {
              const before = store.content.banners.find((x) => x.id === b.id)!
              const sched = before.start !== b.start || before.end !== b.end
              store.updateContent((c) => ({ ...c, banners: c.banners.map((x) => (x.id === b.id ? b : x)) }), {
                action: sched && before.heading === b.heading ? 'Rescheduled banner' : 'Edited banner',
                target: label(b),
                old: sched ? `${longDate(before.start)} → ${longDate(before.end)}` : before.heading !== b.heading ? before.heading : undefined,
                new: sched ? `${longDate(b.start)} → ${longDate(b.end)}` : before.heading !== b.heading ? b.heading : undefined,
              })
              toast(`Banner “${b.heading}” saved to draft`)
            }
            setForm(null)
          }}
        />
      )}

      <MediaPicker
        open={!!replacing}
        onClose={() => setReplacing(null)}
        category="banner"
        title="Replace banner image"
        onPick={(m) => {
          if (!replacing) return
          patch(replacing, { image: m.url }, 'Replaced banner image', fileName(replacing.image, store.media), m.name)
          toast(`Banner image replaced in draft`)
        }}
      />

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete banner?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Keep
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!deleting) return
                store.updateContent((c) => ({ ...c, banners: c.banners.filter((x) => x.id !== deleting.id) }), { action: 'Deleted banner', target: label(deleting) })
                toast(`Banner deleted from draft`)
                setDeleting(null)
              }}
            >
              Delete banner
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          “{deleting?.heading}” is removed from the draft. Customers keep seeing it until you publish. The image stays in the media library.
        </p>
      </Modal>
    </Card>
  )
}

function BannerForm({ initial, onSave, onClose }: { initial: Banner | null; onSave: (b: Banner, isNew: boolean) => void; onClose: () => void }) {
  const store = useStore()
  const [b, setB] = useState<Banner>(() =>
    initial ?? {
      id: `BN-${Math.max(10, ...store.content.banners.map((x) => Number(x.id.slice(3)) || 0)) + 1}`,
      image: '',
      heading: '',
      sub: '',
      cta: 'Book now',
      link: '/',
      placement: 'Home strip',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 14 * 86_400_000).toISOString(),
      enabled: true,
    }
  )
  const [pick, setPick] = useState(false)
  const bad = !b.image || !b.heading.trim() || +new Date(b.end) < +new Date(b.start)
  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? `Edit ${initial.id}` : 'Upload banner'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={bad} onClick={() => onSave(b, !initial)}>
            {initial ? 'Save to draft' : 'Add banner'}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div>
          <span className="mb-1.5 block text-[13px] font-bold text-ink-2">Image</span>
          <div className="flex items-center gap-3">
            <MediaThumb src={b.image || undefined} cover className="aspect-[16/8] w-36 rounded-lg" />
            <div className="flex flex-col gap-1.5">
              <UploadButton
                onFile={async (f) => {
                  const img = await readImage(f)
                  const m = store.addMedia({ name: f.name, category: 'banner', alt: f.name.replace(/\.[^.]+$/, ''), ...img })
                  setB((x) => ({ ...x, image: m.url }))
                }}
              >
                <Upload /> Upload
              </UploadButton>
              <Button size="sm" variant="subtle" onClick={() => setPick(true)}>
                <ImagePlus /> From library
              </Button>
            </div>
          </div>
        </div>
        <Field label="Heading">
          <input className={inputClass} value={b.heading} maxLength={50} onChange={(e) => setB({ ...b, heading: e.target.value })} />
        </Field>
        <Field label="Subheading">
          <input className={inputClass} value={b.sub} maxLength={90} onChange={(e) => setB({ ...b, sub: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="CTA text">
            <input className={inputClass} value={b.cta} maxLength={24} onChange={(e) => setB({ ...b, cta: e.target.value })} />
          </Field>
          <Field label="CTA link">
            <input className={inputClass} value={b.link} onChange={(e) => setB({ ...b, link: e.target.value })} />
          </Field>
        </div>
        <Field label="Placement">
          <Select label="Placement" className="w-full" value={b.placement} onChange={(v) => setB({ ...b, placement: v })} options={PLACEMENTS.map((p) => ({ value: p, label: p }))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <input type="date" className={inputClass} value={toDateInput(b.start)} onChange={(e) => e.target.value && setB({ ...b, start: fromDateInput(e.target.value) })} />
          </Field>
          <Field label="End date" hint={+new Date(b.end) < +new Date(b.start) ? <span className="text-danger">Ends before it starts</span> : undefined}>
            <input type="date" className={inputClass} value={toDateInput(b.end)} onChange={(e) => e.target.value && setB({ ...b, end: fromDateInput(e.target.value, true) })} />
          </Field>
        </div>
        <label className="flex items-center justify-between gap-3 text-sm font-semibold">
          Enabled
          <Toggle checked={b.enabled} label="Enabled" onChange={(v) => setB({ ...b, enabled: v })} />
        </label>
      </div>
      <MediaPicker open={pick} onClose={() => setPick(false)} category="banner" onPick={(m) => setB((x) => ({ ...x, image: m.url }))} />
    </Modal>
  )
}

/* -------------------------------------------------------- Service images */

export function ServiceImagesTab() {
  const store = useStore()
  const toast = useToast()
  const canEdit = store.can('content', 'edit')
  const [which, setWhich] = useState<Appliance | null>(null)
  const apply = (a: Appliance, url: string, name: string) => {
    store.updateContent((c) => ({ ...c, serviceImages: { ...c.serviceImages, [a]: url } }), {
      action: 'Replaced service image',
      target: APPLIANCE_LABEL[a],
      old: fileName(store.content.serviceImages[a], store.media),
      new: name,
    })
    toast(`${APPLIANCE_LABEL[a]} image replaced in draft`)
  }
  return (
    <Card>
      <CardHeader title="Service images" sub="The picture on each appliance tile and service page" />
      <ul className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {APPLIANCES.map((a) => {
          const draft = store.content.serviceImages[a]
          const live = store.published.serviceImages[a]
          return (
            <li key={a} className="overflow-hidden rounded-card border border-line">
              <MediaThumb src={draft} cover className="aspect-square w-full" />
              <div className="space-y-2 p-3">
                <p className="flex items-center justify-between gap-2 text-sm font-extrabold">
                  {APPLIANCE_LABEL[a]} {draft !== live ? <Chip tone="warning">Draft</Chip> : <Chip tone="success">Live</Chip>}
                </p>
                <p className="truncate text-xs font-medium text-muted">{fileName(draft, store.media)}</p>
                {draft !== live && (
                  <p className="flex items-center gap-2 text-[11px] font-semibold text-faint">
                    <MediaThumb src={live} cover className="size-6 rounded" /> Live: {fileName(live, store.media)}
                  </p>
                )}
                <div className="flex gap-1.5">
                  <UploadButton
                    size="xs"
                    disabled={!canEdit}
                    onFile={async (f) => {
                      const img = await readImage(f)
                      const m = store.addMedia({ name: f.name, category: 'service', alt: APPLIANCE_LABEL[a], ...img })
                      apply(a, m.url, m.name)
                    }}
                  >
                    <Upload /> Upload
                  </UploadButton>
                  <Button size="xs" variant="subtle" disabled={!canEdit} onClick={() => setWhich(a)}>
                    <ImagePlus /> Library
                  </Button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <MediaPicker open={!!which} onClose={() => setWhich(null)} category="service" title={which ? `${APPLIANCE_LABEL[which]} image` : ''} onPick={(m) => which && apply(which, m.url, m.name)} />
    </Card>
  )
}

/* ------------------------------------------------------------ Brand logos */

export function BrandLogosTab() {
  const store = useStore()
  const toast = useToast()
  const canEdit = store.can('content', 'edit')
  const [which, setWhich] = useState<Brand | null>(null)
  const apply = (b: Brand, url: string, name: string) => {
    store.updateContent((c) => ({ ...c, brandLogos: { ...c.brandLogos, [b]: { ...c.brandLogos[b], url } } }), {
      action: 'Replaced brand logo',
      target: BRAND_LABEL[b],
      old: fileName(store.content.brandLogos[b].url, store.media),
      new: name,
    })
    toast(`${BRAND_LABEL[b]} logo replaced in draft`)
  }
  return (
    <Card>
      <CardHeader title="Brand logos" sub="Only the four brands the network services" />
      <ul className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
        {BRANDS.map((b) => {
          const logo = store.content.brandLogos[b]
          return (
            <li key={b} className={cn('rounded-card border border-line', !logo.enabled && 'opacity-70')}>
              <MediaThumb src={logo.url} className="h-28 w-full rounded-t-card [&_img]:p-6" />
              <div className="space-y-2.5 border-t border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-extrabold">{BRAND_LABEL[b]}</p>
                  <Toggle
                    size="sm"
                    checked={logo.enabled}
                    label={`Show ${BRAND_LABEL[b]} logo`}
                    onChange={(v) => {
                      if (!canEdit) return
                      store.updateContent((c) => ({ ...c, brandLogos: { ...c.brandLogos, [b]: { ...c.brandLogos[b], enabled: v } } }), {
                        action: v ? 'Enabled brand logo' : 'Disabled brand logo',
                        target: BRAND_LABEL[b],
                        old: v ? 'Disabled' : 'Enabled',
                        new: v ? 'Enabled' : 'Disabled',
                      })
                      toast(`${BRAND_LABEL[b]} logo ${v ? 'enabled' : 'disabled'} in draft`)
                    }}
                  />
                </div>
                <p className="truncate text-xs font-medium text-muted">{fileName(logo.url, store.media)}</p>
                <div className="flex gap-1.5">
                  <UploadButton
                    size="xs"
                    disabled={!canEdit}
                    onFile={async (f) => {
                      const img = await readImage(f)
                      const m = store.addMedia({ name: f.name, category: 'brand', alt: `${BRAND_LABEL[b]} logo`, ...img })
                      apply(b, m.url, m.name)
                    }}
                  >
                    <Upload /> Upload logo
                  </UploadButton>
                  <Button size="xs" variant="subtle" disabled={!canEdit} onClick={() => setWhich(b)}>
                    <Replace /> Replace
                  </Button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <MediaPicker open={!!which} onClose={() => setWhich(null)} category="brand" title={which ? `${BRAND_LABEL[which]} logo` : ''} onPick={(m) => which && apply(which, m.url, m.name)} />
    </Card>
  )
}

/* ------------------------------------------------------- Promotion images */

export function PromotionsTab() {
  const store = useStore()
  const toast = useToast()
  const canEdit = store.can('content', 'edit') || store.can('promotions', 'edit')
  const [which, setWhich] = useState<string | null>(null)
  return (
    <Card>
      <CardHeader
        title="Promotion images"
        sub="The picture on each offer card. Prices, codes and dates live in Promotions."
        action={
          <Link href="/promotions" className={buttonClass('secondary', 'sm')}>
            <ExternalLink /> Manage offers
          </Link>
        }
      />
      <ul className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
        {store.coupons.map((c) => (
          <li key={c.code} className="overflow-hidden rounded-card border border-line">
            <MediaThumb src={c.image} cover className="aspect-[16/9] w-full" />
            <div className="space-y-1.5 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-extrabold">{c.title ?? c.description}</p>
                <Chip tone={c.active ? 'success' : 'neutral'}>{c.active ? 'Active' : 'Paused'}</Chip>
              </div>
              <p className="text-xs font-semibold text-muted">
                <span className="font-mono font-bold text-ink-2">{c.code}</span> · {c.kind === 'percent' ? `${c.value}%` : `₹${c.value}`} off · ends {longDate(c.expires)}
              </p>
              <Button size="xs" variant="secondary" disabled={!canEdit} onClick={() => setWhich(c.code)}>
                {c.image ? <Replace /> : <Plus />} {c.image ? 'Replace image' : 'Add image'}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <MediaPicker
        open={!!which}
        onClose={() => setWhich(null)}
        category="promotion"
        title="Offer image"
        onPick={(m) => {
          const c = store.coupons.find((x) => x.code === which)
          if (!c) return
          store.saveCoupon({ ...c, image: m.url })
          toast(`${c.code} image updated`)
        }}
      />
    </Card>
  )
}
