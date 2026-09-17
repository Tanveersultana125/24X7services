/**
 * Draw the app icons from the wordmark, rather than committing PNGs nobody can
 * regenerate.
 *
 *   npm -w frontend run icons
 *
 * The source is the SVG below and the output is checked in, so a build does not
 * depend on this running — but when the wordmark changes, one command redraws
 * every size instead of somebody opening an image editor and guessing.
 *
 * `sharp` is not a dependency of this app; it arrives with Next.js, which uses
 * it for image optimisation. That is fine for a build-time script and would not
 * be fine for anything the app itself needed at runtime.
 *
 * DECISION NEEDED: this is the text wordmark on a black square. It is honest
 * and it is legible at 48px, which is more than many app icons manage, but it
 * is not a designed mark. Replace it before the Play Store listing.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const publicDir = join(here, '..', 'public', 'icons')

const INK = '#0a0a0a'
const PAPER = '#ffffff'

/**
 * @param {object} options
 * @param {number} options.size
 * @param {number} options.scale fraction of the width the wordmark occupies
 * @param {boolean} options.rounded
 */
function wordmark({ size, scale, rounded }) {
  const fontSize = size * scale
  const radius = rounded ? size * 0.22 : 0
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${INK}"/>
  <text x="${size / 2}" y="${size / 2}" dy="0.36em"
        font-family="Manrope, Segoe UI, Helvetica, Arial, sans-serif"
        font-size="${fontSize}" font-weight="800" letter-spacing="${fontSize * 0.01}"
        fill="${PAPER}" text-anchor="middle">24X7</text>
</svg>`
}

/**
 * Every icon this app declares, and why it is the size it is.
 *
 * `maskable` is drawn smaller on purpose: Android crops a maskable icon to
 * whatever shape the launcher uses, and only the middle 80% is guaranteed to
 * survive. A full-bleed wordmark in that slot comes out with its ends cut off.
 */
const ICONS = [
  { file: 'icon-192.png', size: 192, scale: 0.3, rounded: false },
  { file: 'icon-512.png', size: 512, scale: 0.3, rounded: false },
  { file: 'icon-maskable-192.png', size: 192, scale: 0.21, rounded: false },
  { file: 'icon-maskable-512.png', size: 512, scale: 0.21, rounded: false },
  // iOS applies its own rounding, so this one is square and full-bleed.
  { file: 'apple-touch-icon.png', size: 180, scale: 0.3, rounded: false },
  { file: 'icon-48.png', size: 48, scale: 0.32, rounded: false },
]

async function main() {
  await mkdir(publicDir, { recursive: true })

  for (const icon of ICONS) {
    const svg = wordmark(icon)
    const png = await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9 })
      .toBuffer()
    await writeFile(join(publicDir, icon.file), png)
    console.log(`${icon.file}  ${png.length} bytes`)
  }

  // The favicon is the 48px icon; browsers accept a PNG under that name and
  // it saves shipping an .ico nobody can edit.
  const favicon = await sharp(
    Buffer.from(wordmark({ size: 32, scale: 0.34, rounded: false }))
  )
    .png({ compressionLevel: 9 })
    .toBuffer()
  await writeFile(join(here, '..', 'public', 'favicon.png'), favicon)
  console.log(`favicon.png  ${favicon.length} bytes`)
}

main().catch((error) => {
  console.error('Icon generation failed:', error)
  process.exit(1)
})
