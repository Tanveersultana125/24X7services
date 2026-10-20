/**
 * Dates and times as the checkout shows them, from the YYYY-MM-DD and HH:mm
 * strings a Slot carries. Read as local time: the slot is the customer's day.
 */

function parse(date: string): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}

/** "Mon" */
export function weekday(date: string): string {
  return parse(date).toLocaleDateString('en-IN', { weekday: 'short' })
}

/** "20" */
export function dayOfMonth(date: string): string {
  return String(parse(date).getDate())
}

/** "Tue, 20 Oct" */
export function longDate(date: string): string {
  return parse(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** "4:00 PM" */
export function time12(start: string): string {
  const [h, m] = start.split(':').map(Number) as [number, number]
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`
}

/** Which part of the day a start time falls in, for grouping. */
export function partOfDay(start: string): 'Morning' | 'Afternoon' | 'Evening' {
  const h = Number(start.slice(0, 2))
  return h < 12 ? 'Morning' : h < 16 ? 'Afternoon' : 'Evening'
}
