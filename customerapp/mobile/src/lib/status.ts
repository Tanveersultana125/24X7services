import type { BookingStage, BookingStatus } from '@app/shared'

/**
 * How each status is named and toned on screen. Kept apart from the enum so the
 * wording can change without touching the state machine, and in one place so a
 * booking is never called "On the way" on one screen and "En route" on another.
 */

export type Tone = 'neutral' | 'success' | 'warning' | 'error'

interface StatusPresentation {
  label: string
  tone: Tone
  /** The line under the title on a booking card and the tracking header. */
  description: string
}

export const STATUS_PRESENTATION: Record<BookingStatus, StatusPresentation> = {
  pending_payment: {
    label: 'Payment pending',
    tone: 'warning',
    description: 'Your slot is held until the visit fee is paid.',
  },
  confirmed: {
    label: 'Confirmed',
    tone: 'success',
    description: 'Booked. An expert will be assigned closer to your slot.',
  },
  assigned: {
    label: 'Expert assigned',
    tone: 'success',
    description: 'Your expert has been assigned to this job.',
  },
  en_route: {
    label: 'On the way',
    tone: 'success',
    description: 'Your expert is travelling to your address.',
  },
  arrived: {
    label: 'Arrived',
    tone: 'success',
    description: 'Your expert has reached your address.',
  },
  in_progress: {
    label: 'In progress',
    tone: 'neutral',
    description: 'Work is underway.',
  },
  awaiting_approval: {
    label: 'Needs your approval',
    tone: 'warning',
    description: 'An additional repair is waiting on your decision.',
  },
  completed: {
    label: 'Completed',
    tone: 'success',
    description: 'The job is done and your invoice is ready.',
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'error',
    description: 'This booking was cancelled.',
  },
  refunded: {
    label: 'Refunded',
    tone: 'neutral',
    description: 'Your refund has been processed.',
  },
  failed: {
    label: 'Expired',
    tone: 'error',
    description: 'The slot hold expired before payment completed.',
  },
}

export const STAGE_LABEL: Record<BookingStage, string> = {
  inspection: 'Inspection',
  diagnosis: 'Diagnosis',
  repair: 'Repair',
  testing: 'Testing',
}

/** The order the progress screen walks through while a job is in_progress. */
export const STAGE_ORDER: readonly BookingStage[] = [
  'inspection',
  'diagnosis',
  'repair',
  'testing',
]
