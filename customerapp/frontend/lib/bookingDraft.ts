'use client'

import { useSyncExternalStore } from 'react'
import type { Route } from 'next'
import {
  partialBookingDraftSchema,
  type PartialBookingDraft,
} from '@app/shared'
import { createLocalStore } from './localStore'

/**
 * The booking being filled in.
 *
 * It is persisted, and that is the whole point. The flow is ten screens long
 * and interrupts itself in the middle to ask the customer to sign in — which on
 * a phone can mean leaving the app for the SMS. Coming back to an empty form
 * after all that is how a booking gets abandoned.
 *
 * Note what it never holds: a price. The draft carries what was chosen, and
 * `createBooking` prices it from the catalog. There is nothing in here worth
 * tampering with.
 *
 * `packages/shared` describes this as living in Redux. It lives in the same
 * external store as everything else the app keeps on the device: one object,
 * written a field at a time, and a store already built for exactly that. A
 * second state library for a single slice would be two idioms where one does.
 */

const STORAGE_KEY = 'customerapp.bookingDraft.v1'

const EMPTY: PartialBookingDraft = {}

function read(): PartialBookingDraft {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = partialBookingDraftSchema.safeParse(JSON.parse(raw))
    // A draft written by an older version of the app is dropped rather than
    // half-read. Losing a part-filled form is better than submitting one whose
    // shape nobody can vouch for.
    return parsed.success ? parsed.data : EMPTY
  } catch {
    return EMPTY
  }
}

function write(value: PartialBookingDraft): void {
  if (typeof window === 'undefined') return
  try {
    if (Object.keys(value).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    }
  } catch {
    // Storage blocked or full. The draft still holds for this session.
  }
}

const store = createLocalStore<PartialBookingDraft>({
  storageKey: STORAGE_KEY,
  read,
  write,
  serverValue: EMPTY,
})

export function useBookingDraft(): {
  draft: PartialBookingDraft
  ready: boolean
} {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  )
  return { draft: snapshot.value, ready: snapshot.ready }
}

export function patchDraft(patch: PartialBookingDraft): void {
  store.set({ ...store.getSnapshot().value, ...patch })
}

/**
 * Begin a booking for one service, throwing away whatever was half-filled
 * before. Picking a different appliance is starting again, not editing.
 */
export function startDraft(seed: PartialBookingDraft): void {
  store.set(seed)
}

export function clearDraft(): void {
  store.set(EMPTY)
}

export function readDraft(): PartialBookingDraft {
  return store.getSnapshot().value
}

// ---------------------------------------------------------------------------
// The wizard
// ---------------------------------------------------------------------------

/**
 * The steps, in order, each with the one thing it exists to collect.
 *
 * `done` is what makes the flow impossible to jump into halfway. Every screen
 * asks whether the steps before it are satisfied, and a deep link to
 * `/book/payment` with an empty draft lands on the first thing still missing
 * rather than on a screen with nothing to show.
 */
export interface BookingStep {
  key: string
  route: Route
  /** The word on the step counter. */
  label: string
  done: (draft: PartialBookingDraft) => boolean
}

export const BOOKING_STEPS: readonly BookingStep[] = [
  {
    key: 'brand',
    route: '/book/brand',
    label: 'Brand',
    done: (d) => Boolean(d.brandId),
  },
  {
    key: 'details',
    route: '/book/details',
    label: 'Appliance',
    // Model details help the expert arrive with the right part, but a customer
    // who cannot find the sticker still needs to be able to book.
    done: () => true,
  },
  {
    key: 'issue',
    route: '/book/issue',
    label: 'Problem',
    done: (d) =>
      (d.issueIds?.length ?? 0) > 0 || Boolean(d.otherIssueText?.trim()),
  },
  {
    key: 'diagnosis',
    route: '/book/diagnosis',
    label: 'Causes',
    // Nothing is collected here; it is what we think might be wrong.
    done: () => true,
  },
  {
    key: 'media',
    route: '/book/media',
    label: 'Photos',
    done: () => true,
  },
  {
    key: 'address',
    route: '/book/address',
    label: 'Address',
    done: (d) => Boolean(d.addressId ?? d.address),
  },
  {
    key: 'slot',
    route: '/book/slot',
    label: 'Slot',
    done: (d) => Boolean(d.slot),
  },
  {
    key: 'technician',
    route: '/book/technician',
    label: 'Expert',
    done: (d) =>
      Boolean(d.techPreference) &&
      (d.techPreference !== 'specific' || Boolean(d.technicianId)),
  },
  {
    key: 'review',
    route: '/book/review',
    label: 'Review',
    done: (d) => Boolean(d.paymentMode),
  },
  {
    key: 'payment',
    route: '/book/payment',
    label: 'Payment',
    // Only a created booking finishes this one, and that leaves the flow.
    done: () => false,
  },
]

export function stepIndex(key: string): number {
  return BOOKING_STEPS.findIndex((step) => step.key === key)
}

/** The first step still missing something, or the last one if all are filled. */
export function firstIncompleteStep(draft: PartialBookingDraft): BookingStep {
  return (
    BOOKING_STEPS.find((step) => !step.done(draft)) ??
    (BOOKING_STEPS[BOOKING_STEPS.length - 1] as BookingStep)
  )
}

/**
 * Where a screen should send someone who reached it too early: the first
 * unfilled step before this one, or null when they may stay.
 */
export function redirectFor(
  key: string,
  draft: PartialBookingDraft
): Route | null {
  const index = stepIndex(key)
  for (let i = 0; i < index; i += 1) {
    const step = BOOKING_STEPS[i]
    if (step && !step.done(draft)) return step.route
  }
  return null
}

/** The flow cannot start without knowing what is being booked. */
export function hasService(draft: PartialBookingDraft): boolean {
  return Boolean(draft.applianceId && draft.serviceKey)
}

/** Sign-in is required from the media step on — the first thing we store. */
export const FIRST_SIGNED_IN_STEP = 'media'

export function requiresAuth(key: string): boolean {
  return stepIndex(key) >= stepIndex(FIRST_SIGNED_IN_STEP)
}
