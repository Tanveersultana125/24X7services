import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { decode } from 'jpeg-js'
import type { Pixels } from './pixels.types'

/**
 * Scale the photo to `width` px and read its pixels back. A phone has no
 * canvas, so the photo is shrunk to a small JPEG by the OS and decoded here —
 * at 160 px wide that is a few thousand pixels, quick in plain JS.
 */
export async function readPixels(url: string, width: number): Promise<Pixels | null> {
  const source = await ImageManipulator.manipulate(url).renderAsync()
  const small = await ImageManipulator.manipulate(url).resize({ width }).renderAsync()
  const saved = await small.saveAsync({ format: SaveFormat.JPEG, compress: 0.9, base64: true })
  if (!saved.base64) return null
  const bytes = Uint8Array.from(atob(saved.base64), (c) => c.charCodeAt(0))
  const { width: w, height: h, data } = decode(bytes, { useTArray: true, formatAsRGBA: true })
  return { width: w, height: h, sourceWidth: source.width, sourceHeight: source.height, data }
}
