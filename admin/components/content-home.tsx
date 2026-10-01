'use client'

import { useState } from 'react'
import { Eye, ImagePlus, Pencil, Send, ShieldCheck, Star } from 'lucide-react'
import { APPLIANCES } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { useStore, useTick } from '@/lib/store'
import type { HomeSection, HomepageContent, SiteContent } from '@/lib/types'
import { MediaPicker, MediaThumb } from './media'
import { useToast } from './toast'
import { Button, Card, Chip, Field, inputClass, Modal, Segmented, Toggle } from './ui'
import { fileName } from './content-shared'

type SectionKey = 'services' | 'promo' | 'trust' | 'faq'
const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'services', label: 'Service section' },
  { key: 'promo', label: 'Promotional section' },
  { key: 'trust', label: 'Trust section' },
  { key: 'faq', label: 'FAQ section' },
]

/** Hero and the four homepage sections, each editable on its own, previewed as the phone shows it. */
export function HomepageTab({ onPublish }: { onPublish: () => void }) {
  const store = useStore()
  const toast = useToast()
  const canEdit = store.can('content', 'edit')
  const canPublish = store.can('content', 'publish')
  const home = store.content.homepage
  const live = store.published.homepage
  const [editing, setEditing] = useState<'hero' | SectionKey | null>(null)
  const [preview, setPreview] = useState(false)

  const save = (patch: Partial<HomepageContent>, action: string, target: string, old?: string, nw?: string) => {
    store.updateContent((c) => ({ ...c, homepage: { ...c.homepage, ...patch } }), { action, target, old, new: nw })
    toast(`${target} saved to draft`)
  }

  const blockActions = (key: 'hero' | SectionKey) => (
    <div className="flex shrink-0 items-center gap-1.5">
      <Button size="xs" variant="secondary" disabled={!canEdit} onClick={() => setEditing(editing === key ? null : key)}>
        <Pencil /> {editing === key ? 'Close' : 'Edit'}
      </Button>
      <Button size="xs" variant="secondary" onClick={() => setPreview(true)}>
        <Eye /> Preview
      </Button>
      <Button size="xs" disabled={!canPublish} onClick={onPublish}>
        <Send /> Publish
      </Button>
    </div>
  )

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
                Hero {JSON.stringify(pickHero(home)) !== JSON.stringify(pickHero(live)) && <Chip tone="warning">Draft</Chip>}
              </h2>
              <p className="mt-0.5 text-xs font-medium text-muted">The first screen customers see</p>
            </div>
            {blockActions('hero')}
          </div>
          {editing === 'hero' ? (
            <HeroForm
              value={home}
              onCancel={() => setEditing(null)}
              onSave={(v) => {
                const changed = (['heroHeading', 'heroSub', 'cta', 'heroImage'] as const).filter((k) => v[k] !== home[k])
                if (changed.length) {
                  const img = changed.includes('heroImage')
                  save(
                    v,
                    img && changed.length === 1 ? 'Replaced hero image' : 'Edited homepage hero',
                    'Homepage · Hero',
                    img ? fileName(home.heroImage, store.media) : changed.length === 1 ? String(home[changed[0]!]) : undefined,
                    img ? fileName(v.heroImage, store.media) : changed.length === 1 ? String(v[changed[0]!]) : undefined
                  )
                }
                setEditing(null)
              }}
            />
          ) : (
            <div className="flex flex-col gap-4 p-5 sm:flex-row">
              <MediaThumb src={home.heroImage} cover className="aspect-video w-full shrink-0 rounded-lg sm:w-48" />
              <div className="min-w-0 space-y-1.5">
                <p className="text-lg font-extrabold leading-snug">{home.heroHeading}</p>
                <p className="text-sm font-medium text-muted">{home.heroSub}</p>
                <span className="inline-flex h-8 items-center rounded-lg bg-brand px-3 text-xs font-bold text-white">{home.cta}</span>
              </div>
            </div>
          )}
        </Card>

        {SECTIONS.map(({ key, label }) => {
          const sec = home[key]
          const dirty = JSON.stringify(sec) !== JSON.stringify(live[key])
          return (
            <Card key={key}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div className="flex items-center gap-3">
                  <Toggle
                    size="sm"
                    checked={sec.visible}
                    label={`Show ${label}`}
                    onChange={(v) => canEdit && save({ [key]: { ...sec, visible: v } }, v ? 'Showed homepage section' : 'Hid homepage section', `Homepage · ${label}`, v ? 'Hidden' : 'Visible', v ? 'Visible' : 'Hidden')}
                  />
                  <div>
                    <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
                      {label} {dirty && <Chip tone="warning">Draft</Chip>} {!sec.visible && <Chip tone="neutral">Hidden</Chip>}
                    </h2>
                  </div>
                </div>
                {blockActions(key)}
              </div>
              {editing === key ? (
                <SectionForm
                  value={sec}
                  onCancel={() => setEditing(null)}
                  onSave={(v) => {
                    save({ [key]: v }, 'Edited homepage section', `Homepage · ${label}`, sec.title !== v.title ? sec.title : undefined, sec.title !== v.title ? v.title : undefined)
                    setEditing(null)
                  }}
                />
              ) : (
                <div className={cn('px-5 py-4', !sec.visible && 'opacity-55')}>
                  <p className="text-sm font-bold">{sec.title}</p>
                  <p className="mt-0.5 text-sm font-medium text-muted">{sec.body}</p>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <div className="hidden xl:block">
        <div className="sticky top-24">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.1em] text-faint">Live preview · draft</p>
          <PhonePreview content={store.content} />
        </div>
      </div>

      <PreviewModal open={preview} onClose={() => setPreview(false)} />
    </div>
  )
}

const pickHero = (h: HomepageContent) => [h.heroHeading, h.heroSub, h.cta, h.heroImage]

function HeroForm({ value, onSave, onCancel }: { value: HomepageContent; onSave: (v: HomepageContent) => void; onCancel: () => void }) {
  const [v, setV] = useState(value)
  const [pick, setPick] = useState(false)
  return (
    <div className="space-y-4 p-5">
      <Field label="Hero heading">
        <input className={inputClass} value={v.heroHeading} maxLength={80} onChange={(e) => setV({ ...v, heroHeading: e.target.value })} />
      </Field>
      <Field label="Hero subheading">
        <textarea className={inputClass} rows={2} value={v.heroSub} maxLength={180} onChange={(e) => setV({ ...v, heroSub: e.target.value })} />
      </Field>
      <Field label="CTA text">
        <input className={inputClass} value={v.cta} maxLength={30} onChange={(e) => setV({ ...v, cta: e.target.value })} />
      </Field>
      <div>
        <span className="mb-1.5 block text-[13px] font-bold text-ink-2">Hero image</span>
        <div className="flex items-center gap-3">
          <MediaThumb src={v.heroImage} cover className="aspect-video w-36 rounded-lg" />
          <Button size="sm" variant="secondary" onClick={() => setPick(true)}>
            <ImagePlus /> Change image
          </Button>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={!v.heroHeading.trim() || !v.cta.trim()} onClick={() => onSave(v)}>
          Save to draft
        </Button>
      </div>
      <MediaPicker open={pick} onClose={() => setPick(false)} category="banner" title="Hero image" onPick={(m) => setV({ ...v, heroImage: m.url })} />
    </div>
  )
}

function SectionForm({ value, onSave, onCancel }: { value: HomeSection; onSave: (v: HomeSection) => void; onCancel: () => void }) {
  const [v, setV] = useState(value)
  return (
    <div className="space-y-4 p-5">
      <Field label="Title">
        <input className={inputClass} value={v.title} maxLength={60} onChange={(e) => setV({ ...v, title: e.target.value })} />
      </Field>
      <Field label="Body">
        <textarea className={inputClass} rows={2} value={v.body} maxLength={220} onChange={(e) => setV({ ...v, body: e.target.value })} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={!v.title.trim()} onClick={() => onSave(v)}>
          Save to draft
        </Button>
      </div>
    </div>
  )
}

export function PreviewModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useStore()
  const [which, setWhich] = useState<'draft' | 'live'>('draft')
  return (
    <Modal open={open} onClose={onClose} title="Customer app preview">
      <Segmented
        className="mb-4 w-full [&>button]:flex-1"
        value={which}
        onChange={setWhich}
        options={[
          { value: 'draft', label: 'Draft' },
          { value: 'live', label: 'Live' },
        ]}
      />
      <PhonePreview content={which === 'draft' ? store.content : store.published} />
    </Modal>
  )
}

/** The customer app's home screen, drawn from content — a faithful sketch, not the app itself. */
export function PhonePreview({ content }: { content: SiteContent }) {
  const store = useStore()
  const h = content.homepage
  const now = useTick(60_000)
  const banners = content.banners.filter((b) => b.enabled && +new Date(b.start) <= now && +new Date(b.end) >= now && b.placement !== 'Offers page')
  const offers = store.coupons.filter((c) => c.active).slice(0, 2)
  const logos = (Object.keys(content.brandLogos) as (keyof SiteContent['brandLogos'])[]).filter((b) => content.brandLogos[b].enabled)
  return (
    <div className="mx-auto w-full max-w-[330px] rounded-[2rem] border-[6px] border-ink bg-ink shadow-float">
      <div className="max-h-[620px] overflow-y-auto rounded-[1.6rem] bg-canvas">
        <div className="relative">
          <MediaThumb src={h.heroImage} cover className="aspect-[4/3] w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <p className="text-lg font-extrabold leading-snug">{h.heroHeading}</p>
            <p className="mt-1 text-[11px] font-medium text-white/80">{h.heroSub}</p>
            <span className="mt-3 inline-flex h-8 items-center rounded-lg bg-brand px-3 text-[11px] font-bold">{h.cta}</span>
          </div>
        </div>

        {banners.length > 0 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto p-3">
            {banners.map((b) => (
              <div key={b.id} className="relative w-[85%] shrink-0 overflow-hidden rounded-xl">
                <MediaThumb src={b.image} cover className="aspect-[16/8] w-full" />
                <div className="absolute inset-0 bg-gradient-to-r from-ink/75 to-transparent p-3 text-white">
                  <p className="text-[13px] font-extrabold">{b.heading}</p>
                  <p className="text-[10px] font-medium text-white/80">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {h.services.visible && (
          <div className="px-3 pb-3">
            <p className="text-[13px] font-extrabold">{h.services.title}</p>
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              {APPLIANCES.map((a) => (
                <MediaThumb key={a} src={content.serviceImages[a]} cover className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
        )}

        {h.promo.visible && (
          <div className="px-3 pb-3">
            <p className="text-[13px] font-extrabold">{h.promo.title}</p>
            <p className="text-[10px] font-medium text-muted">{h.promo.body}</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {offers.map((o) => (
                <div key={o.code} className="overflow-hidden rounded-lg bg-card ring-1 ring-line">
                  {o.image && <MediaThumb src={o.image} cover className="aspect-[16/9] w-full" />}
                  <p className="px-2 py-1.5 text-[10px] font-bold">{o.title ?? o.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {h.trust.visible && (
          <div className="mx-3 mb-3 rounded-xl bg-card p-3 ring-1 ring-line">
            <p className="flex items-center gap-1.5 text-[13px] font-extrabold">
              <ShieldCheck className="size-3.5 text-success" /> {h.trust.title}
            </p>
            <p className="mt-1 text-[10px] font-medium text-muted">{h.trust.body}</p>
            <div className="mt-2 flex items-center justify-around gap-2">
              {logos.map((b) => (
                <MediaThumb key={b} src={content.brandLogos[b].url} className="h-6 w-14 bg-transparent [&_img]:p-0" />
              ))}
            </div>
          </div>
        )}

        {content.testimonials.some((t) => t.visible) && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-3">
            {content.testimonials
              .filter((t) => t.visible)
              .map((t) => (
                <div key={t.id} className="w-[75%] shrink-0 rounded-xl bg-card p-2.5 ring-1 ring-line">
                  <p className="flex gap-0.5">
                    {Array.from({ length: t.rating }, (_, i) => (
                      <Star key={i} className="size-2.5 fill-warning text-warning" />
                    ))}
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-ink-2">“{t.text}”</p>
                  <p className="mt-1 text-[9.5px] font-bold text-muted">
                    {t.name} · {t.area}
                  </p>
                </div>
              ))}
          </div>
        )}

        {h.faq.visible && (
          <div className="px-3 pb-5">
            <p className="text-[13px] font-extrabold">{h.faq.title}</p>
            <ul className="mt-1.5 divide-y divide-line rounded-xl bg-card ring-1 ring-line">
              {content.faqs
                .filter((f) => f.visible)
                .slice(0, 4)
                .map((f) => (
                  <li key={f.id} className="px-2.5 py-2 text-[10.5px] font-bold">
                    {f.q}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
