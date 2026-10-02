import * as ImagePicker from 'expo-image-picker'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import type { MediaLimits } from '@app/shared'

/**
 * Client-side media handling for the booking flow: shrink a photo before it
 * leaves the device, and check a video against the limits before a customer
 * spends their data allowance discovering it was too long.
 *
 * Compression happens here rather than server-side because the cost falls on
 * the customer either way, and a 4MB phone photo on a patchy connection is the
 * difference between a booking completing and a booking being abandoned.
 *
 * On the phone there is no File object: the picker hands back a local uri with
 * what it knows about the file, and that record (PickedMedia) stands in for a
 * File everywhere the web version took one.
 */

/** A photo or video picked on the device, by uri. */
export interface PickedMedia {
  uri: string
  name: string
  /** MIME type. */
  type: string
  /** Bytes. 0 when the platform could not say. */
  size: number
  width?: number
  height?: number
  /** Seconds, for a video the picker could measure. */
  duration?: number
}

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

export function isPhoto(file: PickedMedia): boolean {
  return PHOTO_TYPES.includes(file.type)
}

export function isVideo(file: PickedMedia): boolean {
  return VIDEO_TYPES.includes(file.type)
}

const EXTENSION_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
}

function extensionOf(value: string | null | undefined): string {
  const match = /\.([a-z0-9]+)(?:\?.*)?$/i.exec(value ?? '')
  return match?.[1]?.toLowerCase() ?? ''
}

/** Bytes in the file at `uri`, read back rather than trusted from the picker. */
async function sizeOf(uri: string): Promise<number> {
  try {
    const blob = await (await fetch(uri)).blob()
    return blob.size
  } catch {
    return 0
  }
}

/**
 * The picker's asset as a PickedMedia. Android does not always report a MIME
 * type, so it is worked out from the name, then from the kind of asset.
 */
export async function fromPickerAsset(asset: ImagePicker.ImagePickerAsset): Promise<PickedMedia> {
  const name = asset.fileName ?? asset.uri.split('/').pop() ?? 'media'
  const type =
    asset.mimeType ??
    EXTENSION_TYPES[extensionOf(name)] ??
    EXTENSION_TYPES[extensionOf(asset.uri)] ??
    (asset.type === 'video' ? 'video/mp4' : asset.type === 'image' ? 'image/jpeg' : '')
  const size = asset.fileSize ?? (await sizeOf(asset.uri))
  return {
    uri: asset.uri,
    name,
    type,
    size,
    width: asset.width,
    height: asset.height,
    ...(asset.duration ? { duration: asset.duration / 1000 } : {}),
  }
}

/**
 * Open the camera or the gallery for a photo or a video. Resolves to nothing
 * when the customer backs out, and throws when permission was refused, with a
 * message that says where to turn it on.
 */
export async function pickMedia(
  kind: 'image' | 'video',
  source: 'camera' | 'library',
  options: { multiple?: boolean; limit?: number; maxVideoSeconds?: number } = {}
): Promise<PickedMedia[]> {
  const common: ImagePicker.ImagePickerOptions = {
    mediaTypes: kind === 'image' ? 'images' : 'videos',
    // The picker's own JPEG step; compressPhoto does the sizing afterwards.
    quality: 1,
    ...(kind === 'video' && options.maxVideoSeconds ? { videoMaxDuration: options.maxVideoSeconds } : {}),
  }

  let result: ImagePicker.ImagePickerResult
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      throw new Error('Allow camera access in your phone settings to take one here.')
    }
    result = await ImagePicker.launchCameraAsync({
      ...common,
      cameraType: ImagePicker.CameraType.back,
    })
  } else {
    result = await ImagePicker.launchImageLibraryAsync({
      ...common,
      allowsMultipleSelection: Boolean(options.multiple),
      ...(options.limit ? { selectionLimit: options.limit } : {}),
    })
  }

  if (result.canceled) return []
  return Promise.all(result.assets.map(fromPickerAsset))
}

/**
 * Scale the photo to no larger than `maxDimension` on its long edge, then step
 * the JPEG quality down until it fits the byte budget.
 *
 * Quality is stepped rather than solved because the relationship between
 * quality and size depends on the picture. A flat wall compresses to nothing at
 * 0.8; a cluttered utility room does not, and that is exactly the photo a
 * customer sends of a leaking washing machine.
 */
export async function compressPhoto(
  file: PickedMedia,
  limits: Pick<MediaLimits, 'maxPhotoBytes' | 'maxPhotoDimension'>
): Promise<PickedMedia> {
  if (!isPhoto(file)) return file

  try {
    const context = ImageManipulator.manipulate(file.uri)
    const long = Math.max(file.width ?? 0, file.height ?? 0)
    if (long > limits.maxPhotoDimension) {
      const landscape = (file.width ?? 0) >= (file.height ?? 0)
      context.resize(
        landscape ? { width: limits.maxPhotoDimension } : { height: limits.maxPhotoDimension }
      )
    }
    const image = await context.renderAsync()

    let best: { uri: string; size: number; width: number; height: number } | null = null
    for (const quality of [0.82, 0.7, 0.6, 0.5, 0.4]) {
      const saved = await image.saveAsync({ compress: quality, format: SaveFormat.JPEG })
      const size = await sizeOf(saved.uri)
      best = { uri: saved.uri, size, width: saved.width, height: saved.height }
      if (size > 0 && size <= limits.maxPhotoBytes) break
    }

    // Even at the lowest quality it may not fit. Sending the smallest version
    // we managed beats refusing a photo the technician would find useful.
    if (!best) return file

    return {
      uri: best.uri,
      name: file.name.replace(/\.[^.]+$/, '') + '.jpg',
      type: 'image/jpeg',
      size: best.size,
      width: best.width,
      height: best.height,
    }
  } catch {
    // A photo the manipulator cannot read is sent as it is.
    return file
  }
}

/**
 * A video's duration, without uploading it. The picker measures it; when it
 * could not, the duration is unknown and the check is skipped.
 */
export function videoDuration(file: PickedMedia): Promise<number> {
  return file.duration !== undefined
    ? Promise.resolve(file.duration)
    : Promise.reject(new Error('Could not read the video'))
}

export async function validateMedia(
  file: PickedMedia,
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
