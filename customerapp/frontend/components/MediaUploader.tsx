'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, Loader2, Trash2, Video } from 'lucide-react'
import type { MediaLimits } from '@app/shared'
import { compressPhoto, formatBytes, isPhoto, validateMedia } from '@/lib/media'
import { cn } from '@/lib/cn'

/**
 * Photos and a short video of the fault.
 *
 * Each item is tracked by id with its own progress and error, because a batch
 * of five uploads on a phone connection will not finish together and a single
 * shared spinner tells the customer nothing about which one is stuck.
 *
 * Nothing here talks to Storage. The parent supplies `onUpload`, which lets the
 * same component serve the pre-login case, where there is no uid to write
 * under and files are held locally until the booking is created.
 */

export interface MediaDraftItem {
  id: string
  file: File
  /** Object URL for the thumbnail. Revoked on removal. */
  previewUrl: string
  kind: 'image' | 'video'
  /** 0 to 100 while uploading; undefined once it has settled. */
  progress?: number
  /** Set once the upload lands, and what the booking draft stores. */
  path?: string
  error?: string
}

export interface MediaUploaderProps {
  items: readonly MediaDraftItem[]
  onItemsChange: (items: MediaDraftItem[]) => void
  limits: MediaLimits
  /** Resolves to the Storage path once the file is uploaded. */
  onUpload?: (
    file: File,
    onProgress: (percent: number) => void
  ) => Promise<string>
  className?: string
}

let nextId = 0

export function MediaUploader({
  items,
  onItemsChange,
  limits,
  onUpload,
  className,
}: MediaUploaderProps) {
  const photoInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [rejection, setRejection] = useState<string | null>(null)

  // The upload callbacks resolve long after the render that started them, so
  // they read the list through a ref rather than closing over a stale copy.
  // Written in an effect, not during render, which React 19 rightly refuses.
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  })

  // Object URLs are a real allocation; leaving them behind on a screen the
  // customer visits repeatedly is a leak that only shows up on cheap phones.
  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) URL.revokeObjectURL(item.previewUrl)
    }
  }, [])

  const counts = {
    photos: items.filter((i) => i.kind === 'image').length,
    videos: items.filter((i) => i.kind === 'video').length,
  }

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      setBusy(true)
      setRejection(null)

      let working = [...itemsRef.current]

      for (const file of Array.from(files)) {
        const problem = await validateMedia(file, limits, {
          photos: working.filter((i) => i.kind === 'image').length,
          videos: working.filter((i) => i.kind === 'video').length,
        })
        if (problem) {
          setRejection(problem.message)
          continue
        }

        const prepared = isPhoto(file) ? await compressPhoto(file, limits) : file
        nextId += 1
        const item: MediaDraftItem = {
          id: `media-${nextId}`,
          file: prepared,
          previewUrl: URL.createObjectURL(prepared),
          kind: isPhoto(prepared) ? 'image' : 'video',
          progress: onUpload ? 0 : undefined,
        }
        working = [...working, item]
        onItemsChange(working)

        if (onUpload) {
          void onUpload(prepared, (percent) => {
            onItemsChange(
              itemsRef.current.map((i) =>
                i.id === item.id ? { ...i, progress: percent } : i
              )
            )
          })
            .then((path) => {
              onItemsChange(
                itemsRef.current.map((i) =>
                  i.id === item.id
                    ? { ...i, path, progress: undefined }
                    : i
                )
              )
            })
            .catch(() => {
              onItemsChange(
                itemsRef.current.map((i) =>
                  i.id === item.id
                    ? {
                        ...i,
                        progress: undefined,
                        error: 'Upload failed. Remove it and try again.',
                      }
                    : i
                )
              )
            })
        }
      }

      setBusy(false)
    },
    [limits, onItemsChange, onUpload]
  )

  function remove(id: string): void {
    const item = items.find((i) => i.id === id)
    if (item) URL.revokeObjectURL(item.previewUrl)
    onItemsChange(items.filter((i) => i.id !== id))
    setRejection(null)
  }

  const photosFull = counts.photos >= limits.maxPhotos
  const videosFull = counts.videos >= limits.maxVideos

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex gap-2">
        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          multiple
          // On Android this opens the camera directly rather than the picker,
          // which is what a customer standing in front of the appliance wants.
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            void addFiles(event.target.files)
            event.target.value = ''
          }}
        />
        <input
          ref={videoInput}
          type="file"
          accept="video/*"
          className="sr-only"
          onChange={(event) => {
            void addFiles(event.target.files)
            event.target.value = ''
          }}
        />

        <button
          type="button"
          onClick={() => photoInput.current?.click()}
          disabled={photosFull || busy}
          className={cn(
            'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-pill border text-sm font-semibold',
            photosFull || busy
              ? 'cursor-not-allowed border-border text-muted'
              : 'border-ink text-ink hover:bg-surface'
          )}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Camera className="size-4" aria-hidden="true" />
          )}
          Add photo
        </button>

        <button
          type="button"
          onClick={() => videoInput.current?.click()}
          disabled={videosFull || busy}
          className={cn(
            'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-pill border text-sm font-semibold',
            videosFull || busy
              ? 'cursor-not-allowed border-border text-muted'
              : 'border-ink text-ink hover:bg-surface'
          )}
        >
          <Video className="size-4" aria-hidden="true" />
          Add video
        </button>
      </div>

      <p className="text-xs text-muted">
        Up to {limits.maxPhotos} photos and {limits.maxVideos === 1 ? 'one' : limits.maxVideos} video of up to{' '}
        {limits.maxVideoSeconds} seconds. Photos are resized on your phone
        before they are sent.
      </p>

      {rejection ? (
        <p role="alert" className="text-xs text-error">
          {rejection}
        </p>
      ) : null}

      {items.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="relative aspect-square overflow-hidden rounded-card border border-border bg-surface"
            >
              {item.kind === 'image' ? (
                // Not next/image: the source is a blob: URL that exists only in
                // this session, so there is nothing for it to optimise.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.previewUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <video
                  src={item.previewUrl}
                  className="size-full object-cover"
                  muted
                  playsInline
                />
              )}

              {item.progress !== undefined ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/60 text-bg">
                  <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                  <span className="text-xs tabular-nums">
                    {Math.round(item.progress)}%
                  </span>
                </div>
              ) : null}

              {item.error ? (
                <div className="absolute inset-0 flex items-center justify-center bg-error/80 p-1 text-center text-[10px] text-white">
                  {item.error}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={`Remove ${item.kind === 'image' ? 'photo' : 'video'}`}
                className="absolute right-1 top-1 flex size-8 min-h-0 items-center justify-center rounded-full bg-ink/70 text-bg"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>

              <span className="absolute bottom-1 left-1 rounded-pill bg-ink/70 px-1.5 py-0.5 text-[10px] text-bg">
                {formatBytes(item.file.size)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border px-4 py-8 text-center">
          <ImagePlus className="size-6 text-muted" aria-hidden="true" />
          <p className="text-sm text-muted">
            Photos are optional, and they help the expert arrive with the right
            parts.
          </p>
        </div>
      )}
    </div>
  )
}
