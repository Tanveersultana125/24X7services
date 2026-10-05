import type { DayKey, Settings } from './types'

/**
 * Whether the technician is taking new requests right now, worked out from
 * the Online switch, the weekly schedule and the break. One function, so the
 * dashboard, Settings, Profile and the incoming-request alert never disagree.
 *
 * None of this touches jobs already accepted: availability only decides what
 * new work may reach the technician.
 */

export const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: 'mon', label: 'Monday', short: 'Mon' },
  { key: 'tue', label: 'Tuesday', short: 'Tue' },
  { key: 'wed', label: 'Wednesday', short: 'Wed' },
  { key: 'thu', label: 'Thursday', short: 'Thu' },
  { key: 'fri', label: 'Friday', short: 'Fri' },
  { key: 'sat', label: 'Saturday', short: 'Sat' },
  { key: 'sun', label: 'Sunday', short: 'Sun' },
]

export const WEEKDAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri']
export const RADIUS_STEPS = [5, 10, 15, 20, 25] as const

const ORDER: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
export const dayOf = (at: Date): DayKey => ORDER[at.getDay()]!

const minutes = (v: string) => {
  const [h = 0, m = 0] = v.split(':').map(Number)
  return h * 60 + m
}

/** "09:00" → "9:00 AM" */
export function clock12(v: string): string {
  const [h = 0, m = 0] = v.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export const range12 = (start: string, end: string) => `${clock12(start)} – ${clock12(end)}`

const within = (now: number, start: string, end: string) => {
  const a = minutes(start)
  const b = minutes(end)
  if (a === b) return true
  // An end earlier than the start runs past midnight.
  return a < b ? now >= a && now < b : now >= a || now < b
}

export type AvailabilityState = 'online' | 'offline' | 'break' | 'off_hours' | 'day_off'

export interface Availability {
  state: AvailabilityState
  /** New non-emergency requests can reach the technician right now. */
  accepting: boolean
  headline: string
  detail: string
  /** Today's hours, or "Day off". */
  today: string
  onDuty: boolean
}

export function availability(s: Settings, online: boolean, at = new Date()): Availability {
  const day = s.schedule[dayOf(at)]
  const now = at.getHours() * 60 + at.getMinutes()
  const today = day.on ? range12(day.start, day.end) : 'Day off'
  const inHours = day.on && within(now, day.start, day.end)
  const onBreak = inHours && s.breakTime.on && within(now, s.breakTime.start, s.breakTime.end)

  if (!online) return { state: 'offline', accepting: false, headline: 'Offline', detail: 'Not receiving new jobs', today, onDuty: false }
  if (!day.on) return { state: 'day_off', accepting: false, headline: 'Online · day off', detail: s.emergencyAnyTime ? 'Only emergency requests today' : 'Not receiving new jobs today', today, onDuty: false }
  if (!inHours) return { state: 'off_hours', accepting: false, headline: 'Online · outside hours', detail: s.emergencyAnyTime ? 'Only emergency requests until your shift' : 'New jobs resume in working hours', today, onDuty: false }
  if (onBreak) return { state: 'break', accepting: false, headline: 'Online · on break', detail: `Not accepting new jobs until ${clock12(s.breakTime.end)}`, today, onDuty: true }
  return { state: 'online', accepting: true, headline: 'Online', detail: 'Receiving new jobs', today, onDuty: true }
}

/** Whether a request of this kind may interrupt the technician right now. */
export function mayAlert(s: Settings, online: boolean, emergency: boolean, at = new Date()): boolean {
  const a = availability(s, online, at)
  if (!online) return false
  if (emergency) return a.accepting || s.emergencyAnyTime
  return a.accepting
}
