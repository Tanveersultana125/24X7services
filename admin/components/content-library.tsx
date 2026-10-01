'use client'

import { useMemo, useRef, useState } from 'react'
import { AlertTriangle, Copy, ImageOff, Replace, Trash2, Upload } from 'lucide-react'
import { APPLIANCE_LABEL, BRAND_LABEL, type Appliance, type Brand } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ago, longDate } from '@/lib/format'
import { useStore } from '@/lib/store'
import { MEDIA_CATEGORIES, type MediaCategory, type MediaItem } from '@/lib/types'
import { CATEGORY_LABEL, formatBytes, MediaThumb, readImage, UploadButton } from './media'
import { useToast } from './toast'
import { Button, Card, Chip, Detail, Drawer, Empty, Field, inputClass, SearchInput, SectionLabel, Select } from './ui'
import { ConfirmDelete } from './content-text'

type Sort = 'newest' | 'name' | 'size'

/** Everywhere an image is referenced, so deleting one in use is a choice made knowingly. */
function useUsage() {
  const s = useStore()
  return (url: string): string[] => {
    const out: string[] = []
    const scan = (label: string, c: typeof s.content) => {
      if (c.homepage.heroImage === url) out.push(`${label} · Homepage hero`)
      for (const b of c.banners) if (b.image === url) out.push(`${label} · Banner ${b.id} (${b.heading})`)
      for (const [a, u] of Object.entries(c.serviceImages)) if (u === url) out.push(`${label} · ${APPLIANCE_LABEL[a as Appliance]} service image`)
      for (const [b, l] of Object.entries(c.brandLogos)) if (l.url === url) out.push(`${label} · ${BRAND_LABEL[b as Brand]} logo`)
    }
    scan('Draft', s.content)
    scan('Live', s.published)
    for (const [a, svc] of Object.entries(s.catalog.services)) if (svc.image === url) out.push(`Catalogue · ${APPLIANCE_LABEL[a as Appliance]}`)
    for (const [b, br] of Object.entries(s.catalog.brands)) if (br.logo === url || br.image === url) out.push(`Catalogue · ${BRAND_LABEL[b as Brand]}`)
    for (const c of s.coupons) if (c.image === url) out.push(`Offer · ${c.code}`)
    if (s.aiChat.avatar === url) out.push('AI chat avatar')
    return [...new Set(out)]
  }
}

export function LibraryTab() {
  const store = useStore()
  const toast = useToast()
  const usage = useUsage()
  const canCreate = store.can('content', 'create')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<MediaCategory | 'all'>('all')
  const [sort, setSort] = useState<Sort>('newest')
  const [open, setOpen] = useState<string | null>(null)
  const multi = useRef<HTMLInputElement>(null)

  const list = useMemo(() => {
    const words = q.toLowerCase().trim()
    const out = store.media.filter((m) => (cat === 'all' || m.category === cat) && (!words || `${m.name} ${m.alt}`.toLowerCase().includes(words)))
    return out.sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'size' ? b.size - a.size : b.uploadedAt.localeCompare(a.uploadedAt)))
  }, [store.media, q, cat, sort])

  const total = store.media.reduce((s, m) => s + m.size, 0)

  const upload = async (files: FileList) => {
    const category: MediaCategory = cat === 'all' ? 'other' : cat
    let n = 0
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue
      const img = await readImage(f)
      store.addMedia({ name: f.name, category, alt: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '), ...img })
      n++
    }
    if (n) toast(`${n} file${n === 1 ? '' : 's'} uploaded to ${CATEGORY_LABEL[category]}`)
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-[15px] font-extrabold tracking-tight">Media library</h2>
          <p className="mt-0.5 text-xs font-medium text-muted">
            {store.media.length} files · {formatBytes(total)}
          </p>
        </div>
        <input
          ref={multi}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) upload(e.target.files)
            e.target.value = ''
          }}
        />
        <Button size="sm" disabled={!canCreate} onClick={() => multi.current?.click()}>
          <Upload /> Upload files
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-line px-5 py-3">
        <SearchInput className="min-w-[200px] flex-1" value={q} onChange={setQ} placeholder="Search by file name or alt text" />
        <Select<MediaCategory | 'all'>
          label="Category"
          value={cat}
          onChange={setCat}
          options={[{ value: 'all', label: 'All categories' }, ...MEDIA_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))]}
        />
        <Select<Sort>
          label="Sort"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'newest', label: 'Newest first' },
            { value: 'name', label: 'Name A–Z' },
            { value: 'size', label: 'Largest first' },
          ]}
        />
      </div>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-5 pt-3">
        {(['all', ...MEDIA_CATEGORIES] as const).map((c) => {
          const n = c === 'all' ? store.media.length : store.media.filter((m) => m.category === c).length
          return (
            <button
              key={c}
              type="button"
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
              className={cn(
                'h-7 shrink-0 rounded-pill border px-2.5 text-xs font-bold transition-colors',
                cat === c ? 'border-ink bg-ink text-white' : 'border-line-strong text-ink-2 hover:border-ink-2'
              )}
            >
              {c === 'all' ? 'All' : CATEGORY_LABEL[c]} <span className="num opacity-60">{n}</span>
            </button>
          )
        })}
      </div>

      {list.length === 0 ? (
        <Empty icon={<ImageOff />} title="No media matches" body="Try another search or category, or upload a file." />
      ) : (
        <ul className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {list.map((m) => {
            const used = usage(m.url).length
            return (
              <li key={m.id}>
                <button type="button" onClick={() => setOpen(m.id)} className="group block w-full overflow-hidden rounded-lg border border-line text-left transition-colors hover:border-line-strong">
                  <span className="relative block">
                    <MediaThumb item={m} className="aspect-[4/3] w-full transition-transform" />
                    {used > 0 && <span className="absolute right-1.5 top-1.5 rounded bg-card/95 px-1.5 py-0.5 text-[10px] font-bold text-success shadow-card">In use</span>}
                  </span>
                  <span className="block border-t border-line px-2.5 py-2">
                    <span className="block truncate text-xs font-bold group-hover:text-brand">{m.name}</span>
                    <span className="block truncate text-[11px] font-medium text-faint">
                      {CATEGORY_LABEL[m.category]} · {formatBytes(m.size)}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <MediaDrawer id={open} onClose={() => setOpen(null)} usage={usage} />
    </Card>
  )
}

function MediaDrawer({ id, onClose, usage }: { id: string | null; onClose: () => void; usage: (url: string) => string[] }) {
  const store = useStore()
  const m = store.media.find((x) => x.id === id)
  if (!m) return null
  return <MediaDetail key={m.id} m={m} onClose={onClose} usedIn={usage(m.url)} />
}

function MediaDetail({ m, onClose, usedIn }: { m: MediaItem; onClose: () => void; usedIn: string[] }) {
  const store = useStore()
  const toast = useToast()
  const [alt, setAlt] = useState(m.alt)
  const [name, setName] = useState(m.name)
  const [cat, setCat] = useState<MediaCategory>(m.category)
  const [deleting, setDeleting] = useState(false)
  const canEdit = store.can('content', 'edit')
  const canDelete = store.can('content', 'delete')
  const dirty = alt !== m.alt || name !== m.name || cat !== m.category
  const shareUrl = m.url.startsWith('data:') ? 'Stored with the console (uploaded file)' : new URL(m.url, typeof window === 'undefined' ? 'http://localhost' : window.location.origin).href
  return (
    <Drawer
      open
      onClose={onClose}
      title={m.name}
      sub={`${CATEGORY_LABEL[m.category]} · ${m.id}`}
      footer={
        <>
          <Button variant="subtle" size="sm" className="mr-auto text-danger hover:bg-danger-soft" disabled={!canDelete} onClick={() => setDeleting(true)}>
            <Trash2 /> Delete
          </Button>
          <UploadButton
            disabled={!canEdit}
            onFile={async (f) => {
              const img = await readImage(f)
              store.replaceMedia(m.id, { ...img })
              toast(`${m.name} replaced — every place using it updates`)
            }}
          >
            <Replace /> Replace file
          </UploadButton>
          <Button
            size="sm"
            disabled={!canEdit || !dirty || !name.trim()}
            onClick={() => {
              store.replaceMedia(m.id, { alt, name: name.trim(), category: cat })
              toast('Media details saved')
            }}
          >
            Save details
          </Button>
        </>
      }
    >
      <MediaThumb item={m} className="aspect-video w-full rounded-card border border-line" />
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
        <Detail label="Dimensions">
          <span className="num">
            {m.width} × {m.height}px
          </span>
        </Detail>
        <Detail label="File size">{formatBytes(m.size)}</Detail>
        <Detail label="Uploaded by">{m.uploadedBy}</Detail>
        <Detail label="Uploaded">
          {longDate(m.uploadedAt)} · {ago(m.uploadedAt)}
        </Detail>
      </dl>

      <SectionLabel>Details</SectionLabel>
      <div className="space-y-3">
        <Field label="File name">
          <input className={inputClass} value={name} disabled={!canEdit} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Alt text" hint="Read aloud by screen readers in the customer app.">
          <input className={inputClass} value={alt} disabled={!canEdit} onChange={(e) => setAlt(e.target.value)} />
        </Field>
        <Field label="Category">
          <Select<MediaCategory> label="Category" className="w-full" value={cat} onChange={setCat} options={MEDIA_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))} />
        </Field>
        <Field label="URL">
          <div className="flex gap-2">
            <input className={cn(inputClass, 'font-mono text-xs')} readOnly value={shareUrl} />
            <Button
              size="sm"
              variant="secondary"
              disabled={m.url.startsWith('data:')}
              onClick={() => {
                navigator.clipboard?.writeText(shareUrl).then(
                  () => toast('URL copied'),
                  () => toast('Copy not allowed here — select the URL instead')
                )
              }}
            >
              <Copy /> Copy
            </Button>
          </div>
        </Field>
      </div>

      <SectionLabel>Where it’s used</SectionLabel>
      {usedIn.length === 0 ? (
        <p className="text-sm font-medium text-muted">Not used anywhere yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {usedIn.map((u) => (
            <li key={u} className="flex items-center gap-2 text-sm font-semibold text-ink-2">
              <Chip tone={u.startsWith('Live') ? 'success' : u.startsWith('Draft') ? 'warning' : 'brand'} dot={false} className="h-5 px-1.5 text-[10px]">
                {u.split(' · ')[0]}
              </Chip>
              {u.split(' · ').slice(1).join(' · ')}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDelete
        open={deleting}
        what="media file"
        name={m.name}
        onClose={() => setDeleting(false)}
        warning={
          usedIn.length > 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-warning-soft p-3 text-sm font-semibold text-warning">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Used in {usedIn.length} place{usedIn.length === 1 ? '' : 's'}. Those spots will show an empty image until you choose another.
            </p>
          )
        }
        onConfirm={() => {
          store.deleteMedia(m.id)
          toast(`${m.name} deleted`)
          setDeleting(false)
          onClose()
        }}
      />
    </Drawer>
  )
}
