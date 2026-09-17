import { HttpsError } from 'firebase-functions/v2/https'
import { FieldValue } from 'firebase-admin/firestore'
import {
  canTransition,
  SUB,
  type BookingStage,
  type BookingStatus,
} from '@app/shared'

/**
 * The only way a booking changes status.
 *
 * `BOOKING_STATUS_TRANSITIONS` in the shared package is the state machine, and
 * this is what makes it binding. Every path that moves a booking — the payment,
 * the expiry sweep, the assignment trigger, the technician simulator, the
 * approval callable — goes through here, so an out-of-order write is a rejected
 * transition rather than a booking stuck in a state nothing can get it out of.
 *
 * The timeline entry is written in the same operation as the status change, so
 * the two cannot disagree. A booking whose status says `completed` and whose
 * events stop at `arrived` is a booking nobody can explain afterwards.
 */

/** The statuses a working stage means anything in. */
const STAGED_STATUSES: readonly BookingStatus[] = [
  'in_progress',
  'awaiting_approval',
]

export interface TransitionEvent {
  /** The line on the timeline. Written for the customer, not for a log. */
  title: string
  note?: string
  stage?: BookingStage
}

export interface TransitionOptions {
  /** Fields to write alongside the status, in the same update. */
  extra?: Record<string, unknown>
  /** When the transition happened; defaults to now. */
  at?: number
}

/**
 * Move a booking from one status to the next, inside a transaction the caller
 * owns. The caller has already read the booking, which is why `from` is passed
 * rather than read again.
 */
export function applyTransition(
  tx: FirebaseFirestore.Transaction,
  bookingRef: FirebaseFirestore.DocumentReference,
  from: BookingStatus,
  to: BookingStatus,
  event: TransitionEvent,
  options: TransitionOptions = {}
): void {
  if (from !== to && !canTransition(from, to)) {
    // Not a customer-facing sentence on purpose: this is a programming error
    // or a race the caller should have re-read for, not something a person did.
    throw new HttpsError(
      'failed-precondition',
      `A booking cannot go from ${from} to ${to}.`
    )
  }

  const at = options.at ?? Date.now()

  tx.update(bookingRef, {
    status: to,
    stage: stageFor(to, event.stage),
    updatedAt: at,
    ...(options.extra ?? {}),
  })

  writeEvent(tx, bookingRef, to, event, at)
}

/**
 * A timeline entry without a status change — the stage moving on inside
 * `in_progress`, or a note the customer should see against the job.
 */
export function writeEvent(
  tx: FirebaseFirestore.Transaction,
  bookingRef: FirebaseFirestore.DocumentReference,
  status: BookingStatus,
  event: TransitionEvent,
  at: number = Date.now()
): void {
  // Absent keys rather than undefined values. `ignoreUndefinedProperties` would
  // do the same thing, but it is a setting on one Firestore handle, and this
  // helper is also used by the simulator, which makes its own — a rule that
  // holds only where somebody remembered to switch it on is not a rule.
  tx.set(bookingRef.collection(SUB.events).doc(), {
    status,
    title: event.title,
    at,
    ...(event.stage === undefined ? {} : { stage: event.stage }),
    ...(event.note === undefined ? {} : { note: event.note }),
  })
}

/**
 * What to write to `stage`.
 *
 * Deleted rather than left alone when the booking leaves the statuses a stage
 * belongs to — an undefined field is dropped on the way into Firestore, which
 * would leave a completed job still showing "Testing" on the progress screen.
 */
function stageFor(
  to: BookingStatus,
  stage: BookingStage | undefined
): BookingStage | FieldValue | undefined {
  if (stage) return stage
  return STAGED_STATUSES.includes(to) ? undefined : FieldValue.delete()
}
