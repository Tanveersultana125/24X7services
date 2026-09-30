import type { Settings } from './types'

const minutes = (v: string) => {
  const [h = 0, m = 0] = v.split(':').map(Number)
  return h * 60 + m
}

/**
 * Whether `at` falls inside the working hours. A shift that ends earlier than
 * it starts runs overnight (22:00 → 06:00); equal times mean round the clock.
 */
export function inShift(s: Pick<Settings, 'shiftStart' | 'shiftEnd'>, at = new Date()): boolean {
  const start = minutes(s.shiftStart)
  const end = minutes(s.shiftEnd)
  const now = at.getHours() * 60 + at.getMinutes()
  if (start === end) return true
  return start < end ? now >= start && now < end : now >= start || now < end
}

/** Length of the shift in hours, e.g. 12 or 8.5. */
export function shiftHours(s: Pick<Settings, 'shiftStart' | 'shiftEnd'>): number {
  const d = (minutes(s.shiftEnd) - minutes(s.shiftStart) + 1440) % 1440 || 1440
  return Math.round((d / 60) * 10) / 10
}
