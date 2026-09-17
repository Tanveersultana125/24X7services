/**
 * Walks a booking through the whole job, the way a technician app would.
 *
 * There is no technician app in this repository, and the customer app is more
 * than half about what happens after the booking — tracking, progress, the
 * approval, the OTPs, the invoice, the warranty, the review. Without something
 * to drive the other side, none of those screens can be looked at, and the way
 * they are usually looked at instead is by editing a status by hand in the
 * emulator UI, which skips every rule that matters.
 *
 * So this moves the booking the same way the real thing will have to: through
 * `applyTransition`, against the same state machine, writing the same timeline
 * entries and the same tracking document.
 *
 *   npm run simulate -- <bookingId>
 *   npm run simulate -- <bookingId> --fast     no waiting between steps
 *   npm run simulate -- <bookingId> --no-repair  skip the approval detour
 *
 * It pauses at `awaiting_approval` and waits for the customer to answer in the
 * app. That pause is the point of the whole flow.
 */

import { initializeApp } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import {
  bookingSchema,
  BOOKING_STAGES,
  COL,
  SUB,
  type BookingStage,
} from '@app/shared'
import { applyTransition, writeEvent } from '../functions/src/lib/transition'

// ---------------------------------------------------------------------------
// Setup — the same emulator-first rule the seed follows
// ---------------------------------------------------------------------------

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT ?? 'demo-customerapp'

const DEFAULT_EMULATOR_HOST = '127.0.0.1:8080'

if (process.env.SIMULATE_ALLOW_PRODUCTION !== '1') {
  process.env.FIRESTORE_EMULATOR_HOST ??= DEFAULT_EMULATOR_HOST
} else {
  console.warn(
    `SIMULATE_ALLOW_PRODUCTION=1: moving a real booking in "${PROJECT_ID}".`
  )
}

initializeApp({ projectId: PROJECT_ID })
const db: Firestore = getFirestore()
// The same setting the functions use, so a value this script leaves out behaves
// the way it does in the deployed code rather than throwing.
db.settings({ ignoreUndefinedProperties: true })

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const bookingId = args.find((arg) => !arg.startsWith('--'))
const fast = args.includes('--fast')
const skipRepair = args.includes('--no-repair')

if (!bookingId) {
  console.error('Usage: npm run simulate -- <bookingId> [--fast] [--no-repair]')
  process.exit(1)
}

/** Long enough to watch a screen update, short enough to sit through. */
const STEP_MS = fast ? 0 : 4000

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

// ---------------------------------------------------------------------------
// The job
// ---------------------------------------------------------------------------

const bookingRef = db.collection(COL.bookings).doc(bookingId)

/**
 * A step is a transition plus whatever else belongs to that moment. Every one
 * of them re-reads the booking inside the transaction, so a booking cancelled
 * halfway through stops the simulation rather than being dragged onwards.
 */
async function step(
  to: Parameters<typeof applyTransition>[3],
  title: string,
  note: string,
  options: { stage?: BookingStage; extra?: Record<string, unknown> } = {}
): Promise<void> {
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(bookingRef)
    const parsed = bookingSchema.safeParse({ id: snap.id, ...snap.data() })
    if (!parsed.success) throw new Error(`Booking ${bookingId} is not readable`)

    const from = parsed.data.status
    if (from === to) return

    applyTransition(
      tx,
      bookingRef,
      from,
      to,
      { title, note, ...(options.stage ? { stage: options.stage } : {}) },
      options.extra ? { extra: options.extra } : {}
    )
  })
  console.log(`  → ${to}${options.stage ? ` (${options.stage})` : ''}`)
  await wait(STEP_MS)
}

/** The van, approaching. Six updates is enough to see a marker move. */
async function drive(): Promise<void> {
  const trackingRef = db.collection(COL.tracking).doc(bookingId as string)
  const snap = await bookingRef.get()
  const booking = bookingSchema.parse({ id: snap.id, ...snap.data() })

  // Around the customer, since a seeded address may carry no coordinates.
  const destination = booking.address.geo ?? { lat: 17.4615, lng: 78.3639 }
  const start = { lat: destination.lat - 0.035, lng: destination.lng - 0.045 }

  for (let i = 1; i <= 6; i += 1) {
    const progress = i / 6
    await trackingRef.set(
      {
        bookingId,
        techLocation: {
          lat: start.lat + (destination.lat - start.lat) * progress,
          lng: start.lng + (destination.lng - start.lng) * progress,
        },
        customerLocation: destination,
        etaMinutes: Math.max(1, Math.round(18 * (1 - progress))),
        updatedAt: Date.now(),
      },
      { merge: true }
    )
    await bookingRef.update({
      etaMinutes: Math.max(1, Math.round(18 * (1 - progress))),
      updatedAt: Date.now(),
    })
    console.log(`  … driving, ${Math.max(1, Math.round(18 * (1 - progress)))} min away`)
    await wait(STEP_MS / 2)
  }
}

/** The stages inside `in_progress`, each its own line on the timeline. */
async function work(through: readonly BookingStage[]): Promise<void> {
  for (const stage of through) {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef)
      const parsed = bookingSchema.safeParse({ id: snap.id, ...snap.data() })
      if (!parsed.success) return
      tx.update(bookingRef, { stage, updatedAt: Date.now() })
      writeEvent(tx, bookingRef, parsed.data.status, {
        title: STAGE_TITLES[stage],
        note: STAGE_NOTES[stage],
        stage,
      })
    })
    console.log(`  … ${stage}`)
    await wait(STEP_MS)
  }
}

const STAGE_TITLES: Record<BookingStage, string> = {
  inspection: 'Inspection started',
  diagnosis: 'Diagnosis',
  repair: 'Repair under way',
  testing: 'Testing',
}

const STAGE_NOTES: Record<BookingStage, string> = {
  inspection: 'Your expert is looking at the appliance.',
  diagnosis: 'Working out what is causing the fault.',
  repair: 'Carrying out the work you approved.',
  testing: 'Checking the appliance works before packing up.',
}

/**
 * Something else needs doing. This is the moment the app exists for: the work
 * stops, the customer is told what it would cost, and nothing else happens
 * until they answer.
 */
async function raiseRepairRequest(): Promise<string> {
  const requestRef = bookingRef.collection(SUB.repairRequests).doc()

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(bookingRef)
    const parsed = bookingSchema.safeParse({ id: snap.id, ...snap.data() })
    if (!parsed.success) throw new Error('Booking is not readable')

    tx.set(requestRef, {
      items: [
        {
          id: 'item_thermostat',
          label: 'Replace thermostat',
          partPaise: 85000,
          labourPaise: 25000,
        },
        {
          id: 'item_gas',
          label: 'Gas top-up and leak seal',
          partPaise: 140000,
          labourPaise: 40000,
        },
      ],
      reason:
        'The thermostat is not switching the compressor, and the line is losing gas at the joint.',
      photos: [],
      status: 'pending',
      approvedItemIds: [],
      createdAt: Date.now(),
    })

    applyTransition(tx, bookingRef, parsed.data.status, 'awaiting_approval', {
      title: 'Approval needed',
      note: 'Your expert has found something else and has sent you a quote.',
    })
  })

  console.log('  → awaiting_approval')
  return requestRef.id
}

/** Wait for the customer, in the app, to answer. */
async function waitForApproval(requestId: string): Promise<void> {
  console.log('\n  Waiting for the approval screen in the app…')
  console.log(`  /bookings/approval?id=${bookingId}\n`)

  const requestRef = bookingRef.collection(SUB.repairRequests).doc(requestId)

  for (;;) {
    const snap = await requestRef.get()
    const status = snap.data()?.status
    if (status && status !== 'pending') {
      const approved = (snap.data()?.approvedItemIds ?? []) as string[]
      console.log(`  Customer answered: ${status} (${approved.length} items)`)
      return
    }
    await wait(2000)
  }
}

async function main(): Promise<void> {
  const snap = await bookingRef.get()
  if (!snap.exists) {
    console.error(`No booking ${bookingId} in ${PROJECT_ID}.`)
    process.exit(1)
  }
  const booking = bookingSchema.parse({ id: snap.id, ...snap.data() })

  console.log(`\n${booking.displayId} — ${booking.applianceId} ${booking.serviceKey}`)
  console.log(`Starting from ${booking.status}.\n`)

  if (booking.status === 'confirmed') {
    console.error(
      'This booking has no expert yet. The assignment trigger runs on the\n' +
        'emulator when a booking becomes confirmed — check the functions log.'
    )
    process.exit(1)
  }
  if (booking.status !== 'assigned') {
    console.error(
      `Only an assigned booking can be walked through a job. This one is ${booking.status}.`
    )
    process.exit(1)
  }

  await step('en_route', 'On the way', 'Your expert has set off.')
  await drive()
  await step('arrived', 'Arrived', 'Your expert is at your address.')
  await step(
    'in_progress',
    'Work started',
    'Your expert has started on the appliance.',
    { stage: 'inspection' }
  )

  if (skipRepair) {
    await work(BOOKING_STAGES)
  } else {
    await work(['inspection', 'diagnosis'])
    const requestId = await raiseRepairRequest()
    await waitForApproval(requestId)
    await work(['repair', 'testing'])
  }

  await step(
    'completed',
    'Job complete',
    'Your invoice and warranty are in the app.'
  )

  console.log('\nDone. The completion trigger issues the invoice and warranty.')
  process.exit(0)
}

main().catch((error: unknown) => {
  console.error('Simulation failed:', error)
  process.exit(1)
})
