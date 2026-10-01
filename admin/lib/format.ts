export { inr } from './catalog'

export function time(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function dayLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((start(now) - start(d)) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff === -1) return 'Tomorrow'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function dateTime(iso: string): string {
  return `${dayLabel(iso)}, ${time(iso)}`
}

export function ago(iso: string): string {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 0) {
    const m = Math.round(-s / 60)
    return m < 60 ? `in ${m} min` : `in ${Math.round(m / 60)} hr`
  }
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hr ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d} d ago`
  return shortDate(iso)
}

export function isToday(iso: string): boolean {
  const d = new Date(iso)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

/** Inside the last `days` calendar days, today included. */
export function withinDays(iso: string, days: number): boolean {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  const t = new Date(iso).getTime()
  return t >= start.getTime() && t < start.getTime() + days * 86_400_000
}

export function thisMonth(iso: string): boolean {
  const d = new Date(iso)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth()
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

/** 1240 → "1.2k", 152000 → "1.5L" — for chart axes and tight tiles. */
export function compact(n: number): string {
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(1)}Cr`
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(1)}L`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(Math.round(n))
}

export function plural(n: number, word: string): string {
  return `${n.toLocaleString('en-IN')} ${word}${n === 1 ? '' : 's'}`
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}

/** Every typed word must hit something in the haystack. */
export function matches(hay: (string | undefined)[], q: string): boolean {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const h = hay.filter(Boolean).join(' ').toLowerCase()
  return words.every((w) => h.includes(w))
}

/** Rows to a CSV download — every table in the console can export what it shows. */
export function downloadCsv(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const blob = new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
