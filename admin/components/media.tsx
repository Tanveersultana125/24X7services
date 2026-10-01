'use client'

import { useMemo, useRef, useState } from 'react'
import { Check, ImagePlus, Upload } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useStore } from '@/lib/store'
import { MEDIA_CATEGORIES, type MediaCategory, type MediaItem } from '@/lib/types'
import { Button, Modal, SearchInput, Segmented } from './ui'
import { useToast } from './toast'

export const CATEGORY_LABEL: Record<MediaCategory, string> = {
  service: 'Service images',
  brand: 'Brand logos',
  banner: 'Banners',
  promotion: 'Promotions',
  icon: 'Icons',
  other: 'Other content',
}

/**
 * Read a picked file into something storable. Photos are scaled to at most
 * 1400px and re-encoded, because the demo keeps the library in localStorage
 * and a phone photo would fill it on its own. SVGs are kept as they are.
 */
export async function readImage(file: File): Promise<{ url: string; size: number; width: number; height: number }> {
  const raw = await new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = () => rej(r.error)
    r.readAsDataURL(file)
  })
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = raw
  })
  if (file.type === 'image/svg+xml') return { url: raw, size: file.size, width: img.naturalWidth || 256, height: img.naturalHeight || 256 }
  const scale = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  c.getContext('2d')!.drawImage(img, 0, 0, w, h)
  const url = c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.82)
  return { url, size: Math.round((url.length * 3) / 4), width: w, height: h }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

/** A hidden file input behind any button: `<UploadButton onFile={…}>Upload</UploadButton>`. */
export function UploadButton({
  onFile,
  children,
  variant = 'secondary',
  size = 'sm',
  className,
  disabled,
}: {
  onFile: (f: File) => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'subtle'
  size?: 'xs' | 'sm' | 'md'
  className?: string
  disabled?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
      <Button variant={variant} size={size} className={className} disabled={disabled} onClick={() => ref.current?.click()}>
        {children}
      </Button>
    </>
  )
}

/**
 * Choose an image from the media library, or upload a new one into it.
 * Calls `onPick` with the chosen item; the caller decides where it goes.
 */
export function MediaPicker({
  open,
  onClose,
  onPick,
  category,
  title = 'Choose an image',
}: {
  open: boolean
  onClose: () => void
  onPick: (m: MediaItem) => void
  category?: MediaCategory
  title?: string
}) {
  const store = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<MediaCategory | 'all'>(category ?? 'all')
  const [sel, setSel] = useState<string | null>(null)
  const list = useMemo(
    () => store.media.filter((m) => (cat === 'all' || m.category === cat) && m.name.toLowerCase().includes(q.toLowerCase())),
    [store.media, cat, q]
  )
  const chosen = store.media.find((m) => m.id === sel)
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <UploadButton
            className="mr-auto"
            onFile={async (f) => {
              const img = await readImage(f)
              const m = store.addMedia({ name: f.name, category: category ?? (cat === 'all' ? 'other' : cat), alt: f.name.replace(/\.[^.]+$/, ''), ...img })
              toast(`${f.name} uploaded to the media library`)
              setSel(m.id)
            }}
          >
            <Upload /> Upload new
          </UploadButton>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!chosen}
            onClick={() => {
              if (!chosen) return
              onPick(chosen)
              onClose()
            }}
          >
            <Check /> Use image
          </Button>
        </>
      }
    >
      <SearchInput value={q} onChange={setQ} placeholder="Search media" />
      {!category && (
        <Segmented
          className="no-scrollbar mt-3 max-w-full overflow-x-auto"
          value={cat}
          onChange={setCat}
          options={[{ value: 'all', label: 'All' }, ...MEDIA_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c].split(' ')[0]! }))]}
        />
      )}
      <ul className="mt-3 grid max-h-[46dvh] grid-cols-3 gap-2 overflow-y-auto">
        {list.length === 0 && (
          <li className="col-span-3 flex flex-col items-center py-10 text-center text-sm font-semibold text-muted">
            <ImagePlus className="mb-2 size-5" /> Nothing here yet — upload one.
          </li>
        )}
        {list.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setSel(m.id)}
              aria-pressed={sel === m.id}
              className={cn('block w-full overflow-hidden rounded-lg border text-left', sel === m.id ? 'border-brand ring-2 ring-brand' : 'border-line hover:border-line-strong')}
            >
              <MediaThumb item={m} className="aspect-[4/3]" />
              <span className="block truncate px-2 py-1 text-[11px] font-semibold text-ink-2">{m.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

/** An image on a checkerboard-free neutral plate, contained so logos and photos both read. */
export function MediaThumb({ item, src, className, cover }: { item?: MediaItem; src?: string; className?: string; cover?: boolean }) {
  const url = src ?? item?.url
  const logo = item?.category === 'brand' || item?.category === 'icon' || url?.endsWith('.svg') || url?.startsWith('data:image/svg')
  return (
    <span className={cn('grid place-items-center overflow-hidden bg-canvas', className)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={item?.alt ?? ''} className={cn('size-full', logo && !cover ? 'object-contain p-3' : 'object-cover')} />
      ) : (
        <ImagePlus className="size-5 text-faint" aria-hidden />
      )}
    </span>
  )
}
