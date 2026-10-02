import { formatPaise } from '@app/shared'

/**
 * Display formatting. Everything here takes the stored form — paise, a
 * `YYYY-MM-DD` key, an `HH:mm` string, an epoch — and returns text. Nothing
 * here parses user input; that is zod's job.
 */

export { formatPaise }

const IST = 'Asia/Kolkata'

/** Parse a `YYYY-MM-DD` key as a date at IST noon, safely away from any DST edge. */
function fromDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 6, 30))
}

/** Today in IST as a `YYYY-MM-DD` key, which is what slots are stored under. */
export function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function addDaysToKey(dateKey: string, days: number): string {
  const d = fromDateKey(dateKey)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** "Tue" — the weekday line of a date chip. */
export function weekdayShort(dateKey: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    weekday: 'short',
  }).format(fromDateKey(dateKey))
}

/** "23" — the day number of a date chip. */
export function dayOfMonth(dateKey: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: 'numeric',
  }).format(fromDateKey(dateKey))
}

/** "Tue, 23 Sep" — a slot line on a booking card. */
export function formatDateKey(dateKey: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(fromDateKey(dateKey))
}

/**
 * "Today" and "Tomorrow" read faster than a date on the screen where a customer
 * is choosing when someone comes to their house.
 */
export function relativeDateLabel(dateKey: string): string {
  const today = todayKey()
  if (dateKey === today) return 'Today'
  if (dateKey === addDaysToKey(today, 1)) return 'Tomorrow'
  return formatDateKey(dateKey)
}

/** `14:00` → `2 PM`, `14:30` → `2:30 PM`. */
export function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':')
  const hour = Number(hStr)
  const minute = Number(mStr)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return minute === 0 ? `${h12} ${suffix}` : `${h12}:${minute.toString().padStart(2, '0')} ${suffix}`
}

/** `09:00`–`11:00` → `9 AM – 11 AM`. */
export function formatSlotWindow(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

/** "2 hours ago", "just now" — timeline entries and chat bubbles. */
export function relativeTime(epochMs: number, now: number = Date.now()): string {
  const diff = now - epochMs
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return 'just now'
  if (diff < hour) {
    const n = Math.floor(diff / minute)
    return `${n} ${n === 1 ? 'minute' : 'minutes'} ago`
  }
  if (diff < day) {
    const n = Math.floor(diff / hour)
    return `${n} ${n === 1 ? 'hour' : 'hours'} ago`
  }
  if (diff < 7 * day) {
    const n = Math.floor(diff / day)
    return `${n} ${n === 1 ? 'day' : 'days'} ago`
  }
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(epochMs))
}

/** "23 Sep 2026, 2:40 PM" — invoice and event timestamps. */
export function formatDateTime(epochMs: number): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(epochMs))
}

/** "in 12 days", "expired" — warranty cards. */
export function daysUntil(epochMs: number, now: number = Date.now()): number {
  return Math.ceil((epochMs - now) / (24 * 60 * 60 * 1000))
}

/** `+919876543210` → `+91 98765 43210`. */
export function formatPhone(e164: string): string {
  const match = /^\+91(\d{5})(\d{5})$/.exec(e164)
  return match ? `+91 ${match[1]} ${match[2]}` : e164
}

/** A one-line address for a card, without the landmark and label. */
export function shortAddress(address: {
  flat: string
  area: string
  city: string
  pincode: string
}): string {
  return `${address.flat}, ${address.area}, ${address.city} ${address.pincode}`
}
