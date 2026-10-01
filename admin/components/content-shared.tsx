'use client'

import type { MediaItem, SiteContent } from '@/lib/types'

/** The parts of the customer app the draft can differ from live in. */
export const SECTION_LABEL: Record<keyof SiteContent, string> = {
  homepage: 'Homepage',
  banners: 'Banners',
  serviceImages: 'Service images',
  brandLogos: 'Brand logos',
  faqs: 'FAQs',
  testimonials: 'Testimonials',
}

export function changedSections(draft: SiteContent, live: SiteContent): (keyof SiteContent)[] {
  return (Object.keys(SECTION_LABEL) as (keyof SiteContent)[]).filter((k) => JSON.stringify(draft[k]) !== JSON.stringify(live[k]))
}

/** A readable name for an image url — the library's name when it has one. */
export function fileName(url: string, media: MediaItem[]): string {
  const m = media.find((x) => x.url === url)
  if (m) return m.name
  if (url.startsWith('data:')) return 'uploaded image'
  return url.split('/').pop() ?? url
}

/** "2026-10-01T…" ⇄ the value an <input type="date"> wants. */
export const toDateInput = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const fromDateInput = (v: string, endOfDay = false) => new Date(`${v}T${endOfDay ? '23:59:00' : '00:00:00'}`).toISOString()
