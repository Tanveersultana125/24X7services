import type { Pixels } from './pixels.types'

/** Scale the photo to `width` px on a canvas and read its pixels back. */
export async function readPixels(url: string, width: number): Promise<Pixels | null> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = url
  })
  const h = Math.max(1, Math.round((img.height / img.width) * width))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = h
  const g = canvas.getContext('2d')
  if (!g) return null
  g.drawImage(img, 0, 0, width, h)
  return { width, height: h, sourceWidth: img.width, sourceHeight: img.height, data: g.getImageData(0, 0, width, h).data }
}
