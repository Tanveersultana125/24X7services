import type { BookingStatus, KycStatus, Presence, Priority, TicketPriority, TicketStatus } from './types'

export type Tone = 'brand' | 'warning' | 'info' | 'violet' | 'success' | 'danger' | 'neutral'

export const BOOKING_STATUS: Record<BookingStatus, { label: string; tone: Tone }> = {
  pending_payment: { label: 'Awaiting payment', tone: 'neutral' },
  confirmed: { label: 'Unassigned', tone: 'warning' },
  assigned: { label: 'Assigned', tone: 'brand' },
  en_route: { label: 'On the way', tone: 'info' },
  arrived: { label: 'Arrived', tone: 'violet' },
  in_progress: { label: 'In progress', tone: 'violet' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },
}

/** What the timeline calls each step. */
export const STEP_LABEL: Record<BookingStatus, string> = {
  pending_payment: 'Booking created',
  confirmed: 'Booking confirmed',
  assigned: 'Technician assigned',
  en_route: 'Technician on the way',
  arrived: 'Arrived at location',
  in_progress: 'Repair in progress',
  completed: 'Job completed',
  cancelled: 'Booking cancelled',
  refunded: 'Refund issued',
}

export const STATUS_GROUPS = [
  { key: 'all', label: 'All', match: [] },
  { key: 'unassigned', label: 'Unassigned', match: ['confirmed'] },
  { key: 'scheduled', label: 'Assigned', match: ['assigned'] },
  { key: 'live', label: 'Live', match: ['en_route', 'arrived', 'in_progress'] },
  { key: 'completed', label: 'Completed', match: ['completed'] },
  { key: 'payment', label: 'Awaiting payment', match: ['pending_payment'] },
  { key: 'cancelled', label: 'Cancelled', match: ['cancelled', 'refunded'] },
] as const satisfies ReadonlyArray<{ key: string; label: string; match: readonly BookingStatus[] }>

export type StatusGroup = (typeof STATUS_GROUPS)[number]['key']

export function inGroup(status: BookingStatus, key: StatusGroup): boolean {
  if (key === 'all') return true
  return (STATUS_GROUPS.find((g) => g.key === key)!.match as readonly BookingStatus[]).includes(status)
}

export const LIVE: BookingStatus[] = ['en_route', 'arrived', 'in_progress']
export const OPEN: BookingStatus[] = ['pending_payment', 'confirmed', 'assigned', 'en_route', 'arrived', 'in_progress']

export const PRESENCE: Record<Presence, { label: string; tone: Tone }> = {
  online: { label: 'Online', tone: 'success' },
  on_job: { label: 'On a job', tone: 'violet' },
  offline: { label: 'Offline', tone: 'neutral' },
}

export const KYC: Record<KycStatus, { label: string; tone: Tone }> = {
  verified: { label: 'Verified', tone: 'success' },
  pending: { label: 'KYC pending', tone: 'warning' },
  rejected: { label: 'Rejected', tone: 'danger' },
  suspended: { label: 'Suspended', tone: 'danger' },
}

export const PRIORITY: Record<Priority, { label: string; tone: Tone }> = {
  emergency: { label: 'Emergency', tone: 'danger' },
  high: { label: 'High', tone: 'warning' },
  normal: { label: 'Normal', tone: 'neutral' },
}

export const TICKET_STATUS: Record<TicketStatus, { label: string; tone: Tone }> = {
  open: { label: 'Open', tone: 'warning' },
  in_progress: { label: 'In progress', tone: 'brand' },
  resolved: { label: 'Resolved', tone: 'success' },
}

export const TICKET_PRIORITY: Record<TicketPriority, { label: string; tone: Tone }> = {
  urgent: { label: 'Urgent', tone: 'danger' },
  high: { label: 'High', tone: 'warning' },
  normal: { label: 'Normal', tone: 'brand' },
  low: { label: 'Low', tone: 'neutral' },
}
