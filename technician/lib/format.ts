import { APPLIANCE_LABEL, BRAND_LABEL, LABOUR_RATE } from './catalog'
import { stepIndex } from './status'
import type { Job } from './types'

export function time(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function dayLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((start(now) - start(d)) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff === -1) return 'Tomorrow'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function ago(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hr ago`
  return shortDate(iso)
}

export function duration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export function isToday(iso: string): boolean {
  const d = new Date(iso)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

export function withinDays(iso: string, days: number): boolean {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  return new Date(iso).getTime() >= start.getTime()
}

export function thisMonth(iso: string): boolean {
  const d = new Date(iso)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth()
}

export function partsTotal(job: Job): number {
  return job.parts.reduce((s, p) => s + p.qty * p.price, 0)
}

export function billTotal(job: Job): number {
  if (job.amount !== undefined && !job.bill) return job.amount
  const labour = job.bill?.labour ?? LABOUR_RATE[job.appliance]
  return labour + partsTotal(job) + (job.bill?.additional ?? 0)
}

/** What a finished job paid; zero for anything not closed. */
export function earned(job: Job): number {
  if (job.status !== 'closed') return 0
  return job.amount ?? billTotal(job)
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}

export function directionsHref(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
}

/** How far along the drive the technician is, from when they set off. */
export function driveProgress(job: Job, now: number): number {
  const i = stepIndex(job.status)
  if (job.status === 'closed' || i >= stepIndex('arrived')) return 1
  if (job.status !== 'on_the_way' || !job.log.on_the_way) return 0
  const elapsed = (now - new Date(job.log.on_the_way).getTime()) / (job.etaMin * 60_000)
  return Math.min(Math.max(elapsed, 0.04), 0.94)
}

/** Whether a job matches what the technician typed: every word must hit something. */
export function matchesQuery(job: Job, q: string): boolean {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const hay = [
    job.id,
    job.customer.name,
    job.customer.phone.replace(/\s/g, ''),
    job.customer.area,
    job.customer.address,
    BRAND_LABEL[job.brand],
    APPLIANCE_LABEL[job.appliance],
    job.service,
    job.issue,
  ]
    .join(' ')
    .toLowerCase()
  return words.every((w) => hay.includes(w))
}

/** plural(1, 'question') → "1 question"; plural(3, 'question') → "3 questions". */
export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}
