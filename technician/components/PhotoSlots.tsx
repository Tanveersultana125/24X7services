'use client'

import { useRef } from 'react'
import { Camera, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import type { Job, PhotoKind } from '@/lib/types'

const SLOTS: { kind: PhotoKind; label: string; hint: string }[] = [
  { kind: 'appliance', label: 'Appliance', hint: 'Model plate & overall' },
  { kind: 'damaged', label: 'Damaged part', hint: 'Close-up of the fault' },
  { kind: 'before', label: 'Before', hint: 'As found' },
  { kind: 'after', label: 'After', hint: 'Repaired & tested' },
]

/** Shrunk before saving: a 12 MP photo would blow the storage quota on its own. */
function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const max = 720
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = img.width * k
      c.height = img.height * k
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.72))
    }
    img.onerror = reject
    img.src = url
  })
}

export function PhotoSlots({ job, only }: { job: Job; only?: PhotoKind[] }) {
  const { addPhoto, removePhoto } = useStore()
  const input = useRef<HTMLInputElement>(null)
  const pendingKind = useRef<PhotoKind>('appliance')
  const slots = only ? SLOTS.filter((s) => only.includes(s.kind)) : SLOTS

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          const url = await downscale(f)
          addPhoto(job.id, { id: `${Date.now()}`, kind: pendingKind.current, url })
        }}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {slots.map((s) => {
          const photos = job.photos.filter((p) => p.kind === s.kind)
          return (
            <div key={s.kind}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-xs font-extrabold text-ink-2">{s.label}</span>
                {photos.length > 0 && <span className="num text-[11px] font-bold text-success">{photos.length} added</span>}
              </div>
              <div className="grid gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-canvas">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={`${s.label} photo`} className="size-full object-cover" />
                    <button
                      type="button"
                      aria-label="Remove photo"
                      onClick={() => removePhoto(job.id, p.id)}
                      className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-ink/70 text-white"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    pendingKind.current = s.kind
                    input.current?.click()
                  }}
                  className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line-strong bg-card text-muted transition-colors hover:border-brand hover:text-brand"
                >
                  <Camera className="size-5" />
                  <span className="text-xs font-bold">{photos.length ? 'Add another' : 'Take photo'}</span>
                  <span className="px-2 text-center text-[10.5px] font-medium text-faint">{s.hint}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
