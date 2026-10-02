import type { MediaLimits } from '@app/shared'

/**
 * Client-side media handling for the booking flow: shrink a photo before it
 * leaves the device, and check a video against the limits before a customer
 * spends their data allowance discovering it was too long.
 *
 * Compression happens here rather than server-side because the cost falls on
 * the customer either way, and a 4MB phone photo on a patchy connection is the
 * difference between a booking completing and a booking being abandoned.
 */

export interface MediaValidationError {
  code:
    | 'too-many-photos'
    | 'too-many-videos'
    | 'video-too-large'
    | 'video-too-long'
    | 'unsupported-type'
  message: string
}

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

export function isPhoto(file: File): boolean {
  return PHOTO_TYPES.includes(file.type)
}

export function isVideo(file: File): boolean {
  return VIDEO_TYPES.includes(file.type)
}

/**
 * Draw the image onto a canvas no larger than `maxDimension` on its long edge,
 * then step the JPEG quality down until it fits the byte budget.
 *
 * Quality is stepped rather than solved because the relationship between
 * quality and size depends on the picture. A flat wall compresses to nothing at
 * 0.8; a cluttered utility room does not, and that is exactly the photo a
 * customer sends of a leaking washing machine.
 */
export async function compressPhoto(
  file: File,
  limits: Pick<MediaLimits, 'maxPhotoBytes' | 'maxPhotoDimension'>
): Promise<File> {
  if (!isPhoto(file)) return file

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(
    1,
    limits.maxPhotoDimension / Math.max(bitmap.width, bitmap.height)
  )
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  let blob: Blob | null = null
  for (const quality of [0.82, 0.7, 0.6, 0.5, 0.4]) {
    blob = await canvasToBlob(canvas, quality)
    if (blob && blob.size <= limits.maxPhotoBytes) break
  }

  // Even at the lowest quality it may not fit. Sending the smallest version we
  // managed beats refusing a photo the technician would find useful.
  if (!blob) return file

  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
  })
}

/** Read a video's duration without uploading it. */
export function videoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read the video'))
    }
    video.src = url
  })
}

export async function validateMedia(
  file: File,
  limits: MediaLimits,
  existing: { photos: number; videos: number }
): Promise<MediaValidationError | null> {
  if (isPhoto(file)) {
    if (existing.photos >= limits.maxPhotos) {
      return {
        code: 'too-many-photos',
        message: `You can add up to ${limits.maxPhotos} photos.`,
      }
    }
    return null
  }

  if (isVideo(file)) {
    if (existing.videos >= limits.maxVideos) {
      return {
        code: 'too-many-videos',
        message:
          limits.maxVideos === 1
            ? 'You can add one video.'
            : `You can add up to ${limits.maxVideos} videos.`,
      }
    }
    if (file.size > limits.maxVideoBytes) {
      return {
        code: 'video-too-large',
        message: `That video is ${formatBytes(file.size)}. The limit is ${formatBytes(limits.maxVideoBytes)}.`,
      }
    }
    try {
      const duration = await videoDuration(file)
      if (duration > limits.maxVideoSeconds) {
        return {
          code: 'video-too-long',
          message: `That video is ${Math.round(duration)} seconds. Keep it under ${limits.maxVideoSeconds}.`,
        }
      }
    } catch {
      // A duration we cannot read is not a reason to refuse the file; the size
      // check already caught the case that actually costs anything.
    }
    return null
  }

  return {
    code: 'unsupported-type',
    message: 'Add a photo or a short video.',
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
