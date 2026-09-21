/**
 * Every rule in firestore.rules, tested from both sides: the read or write it
 * is meant to allow, and the one it exists to stop. A rules file that only ever
 * gets its allow cases tested is a rules file nobody has checked.
 *
 * Run with `npm run test:rules`, which starts the emulator around it.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  setLogLevel,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const ALICE = 'user-alice'
const BOB = 'user-bob'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  // The SDK logs every expected permission denial at error level, which buries
  // the actual test output.
  setLogLevel('error')

  testEnv = await initializeTestEnvironment({
    projectId: 'demo-customerapp-rules',
    firestore: {
      rules: readFileSync(join(__dirname, '..', 'firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv?.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

/** Seed a document past the rules, the way a callable or the seed would. */
async function asAdmin(fn: (db: any) => Promise<void>): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await fn(ctx.firestore())
  })
}

function alice() {
  return testEnv.authenticatedContext(ALICE).firestore()
}
function bob() {
  return testEnv.authenticatedContext(BOB).firestore()
}
function guest() {
  return testEnv.unauthenticatedContext().firestore()
}

// ---------------------------------------------------------------------------

describe('catalog', () => {
  beforeEach(async () => {
    await asAdmin(async (db) => {
      await setDoc(doc(db, 'catalogAppliances/washing-machine'), {
        name: 'Washing Machine',
        active: true,
      })
      await setDoc(doc(db, 'config/business'), { gstRate: 18 })
      await setDoc(doc(db, 'config/private'), { razorpaySecret: 'nope' })
      await setDoc(doc(db, 'technicianPublic/tech_1'), { name: 'Arjun', rating: 4.8 })
      await setDoc(doc(db, 'technicians/tech_1'), { phone: '+919000000101' })
      await setDoc(doc(db, 'slots/500084_2026-09-20'), { windows: [] })
      await setDoc(doc(db, 'serviceAreas/500084'), {
        pincode: '500084',
        city: 'Hyderabad',
        area: 'Kondapur',
        active: true,
      })
      await setDoc(doc(db, 'searchIndex/appliance_washing-machine'), {
        kind: 'appliance',
        label: 'Washing Machine',
        tokens: ['washing', 'machine'],
      })
    })
  })

  it('lets a signed-out visitor browse the catalog', async () => {
    // Guest browsing is the whole point of the discovery screens.
    await assertSucceeds(getDoc(doc(guest(), 'catalogAppliances/washing-machine')))
    await assertSucceeds(getDoc(doc(guest(), 'config/business')))
    await assertSucceeds(getDoc(doc(guest(), 'technicianPublic/tech_1')))
    // The location screen lists the areas we cover, and the search screen
    // matches against the index, both before anyone has signed in.
    await assertSucceeds(getDoc(doc(guest(), 'serviceAreas/500084')))
    await assertSucceeds(
      getDoc(doc(guest(), 'searchIndex/appliance_washing-machine'))
    )
  })

  it('refuses writes to the catalog from any client', async () => {
    await assertFails(
      setDoc(doc(alice(), 'catalogAppliances/washing-machine'), { name: 'Free' })
    )
    await assertFails(setDoc(doc(alice(), 'config/business'), { gstRate: 0 }))
    // Switching on an area we do not staff, or planting a search row that
    // points somewhere of the writer's choosing.
    await assertFails(
      setDoc(doc(alice(), 'serviceAreas/999999'), {
        pincode: '999999',
        city: 'Anywhere',
        area: 'Anywhere',
        active: true,
      })
    )
    await assertFails(
      setDoc(doc(alice(), 'searchIndex/x'), { label: 'Free repair', tokens: [] })
    )
  })

  it('keeps private config, technician records and slot counts off the client', async () => {
    await assertFails(getDoc(doc(alice(), 'config/private')))
    await assertFails(getDoc(doc(alice(), 'technicians/tech_1')))
    await assertFails(getDoc(doc(alice(), 'slots/500084_2026-09-20')))
  })
})

// ---------------------------------------------------------------------------

describe('user profile', () => {
  it('lets a user read and write their own profile', async () => {
    await assertSucceeds(
      setDoc(doc(alice(), `users/${ALICE}`), { name: 'Alice' })
    )
    await assertSucceeds(getDoc(doc(alice(), `users/${ALICE}`)))
  })

  it('keeps one user out of another profile', async () => {
    await asAdmin(async (db) => {
      await setDoc(doc(db, `users/${ALICE}`), { name: 'Alice' })
    })
    await assertFails(getDoc(doc(bob(), `users/${ALICE}`)))
    await assertFails(setDoc(doc(bob(), `users/${ALICE}`), { name: 'Mallory' }))
  })

  it('refuses a field the rules do not validate', async () => {
    // A closed field set is what stops a client writing itself a role, a
    // credit balance, or anything else nobody thought to forbid by name.
    await assertFails(
      setDoc(doc(alice(), `users/${ALICE}`), { name: 'Alice', role: 'admin' })
    )
  })

  it('refuses a phone number written by the client', async () => {
    // Phone comes from the auth token; letting the profile set it would let a
    // customer claim someone else's number on an invoice.
    await assertFails(
      setDoc(doc(alice(), `users/${ALICE}`), { phone: '+919000000009' })
    )
  })

  it('refuses profile deletion, which belongs to deleteAccount()', async () => {
    await asAdmin(async (db) => {
      await setDoc(doc(db, `users/${ALICE}`), { name: 'Alice' })
    })
    await assertFails(deleteDoc(doc(alice(), `users/${ALICE}`)))
  })
})

// ---------------------------------------------------------------------------

describe('addresses', () => {
  const valid = {
    label: 'home',
    flat: 'Flat 402',
    area: 'Kondapur',
    city: 'Hyderabad',
    pincode: '500084',
  }

  it('accepts a well-formed address from its owner', async () => {
    await assertSucceeds(
      setDoc(doc(alice(), `users/${ALICE}/addresses/a1`), valid)
    )
  })

  it('rejects a malformed pincode', async () => {
    await assertFails(
      setDoc(doc(alice(), `users/${ALICE}/addresses/a1`), {
        ...valid,
        pincode: '12',
      })
    )
  })

  it('rejects an unknown label', async () => {
    await assertFails(
      setDoc(doc(alice(), `users/${ALICE}/addresses/a1`), {
        ...valid,
        label: 'warehouse',
      })
    )
  })

  it('rejects a missing required field', async () => {
    const { city, ...withoutCity } = valid
    await assertFails(
      setDoc(doc(alice(), `users/${ALICE}/addresses/a1`), withoutCity)
    )
  })

  it("keeps another user out of the address book", async () => {
    await asAdmin(async (db) => {
      await setDoc(doc(db, `users/${ALICE}/addresses/a1`), valid)
    })
    await assertFails(getDoc(doc(bob(), `users/${ALICE}/addresses/a1`)))
  })
})

// ---------------------------------------------------------------------------

describe('saved appliances', () => {
  const valid = { applianceId: 'washing-machine', brandId: 'ifb' }

  it('accepts a saved appliance from its owner', async () => {
    await assertSucceeds(
      setDoc(doc(alice(), `users/${ALICE}/appliances/x1`), valid)
    )
  })

  it('rejects an appliance or brand outside the catalog enum', async () => {
    await assertFails(
      setDoc(doc(alice(), `users/${ALICE}/appliances/x1`), {
        ...valid,
        applianceId: 'toaster',
      })
    )
    await assertFails(
      setDoc(doc(alice(), `users/${ALICE}/appliances/x1`), {
        ...valid,
        brandId: 'acme',
      })
    )
  })

  it('refuses a client-set lastServicedAt', async () => {
    // It is stamped by the completion trigger. If a client could set it, the
    // service-due reminders would be whatever the app felt like claiming.
    await assertFails(
      setDoc(doc(alice(), `users/${ALICE}/appliances/x1`), {
        ...valid,
        lastServicedAt: Date.now(),
      })
    )
  })
})

// ---------------------------------------------------------------------------

describe('bookings', () => {
  beforeEach(async () => {
    await asAdmin(async (db) => {
      await setDoc(doc(db, 'bookings/bk1'), {
        uid: ALICE,
        status: 'confirmed',
        price: { total: 29900 },
      })
      await setDoc(doc(db, 'bookings/bk1/events/e1'), { status: 'confirmed' })
      await setDoc(doc(db, 'bookings/bk1/repairRequests/r1'), {
        status: 'pending',
        items: [],
      })
      await setDoc(doc(db, 'bookings/bk1/private/otp'), { startHash: 'x' })
      await setDoc(doc(db, 'tracking/bk1'), { etaMinutes: 12 })
    })
  })

  it('lets the owner read their booking and its timeline', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'bookings/bk1')))
    await assertSucceeds(getDoc(doc(alice(), 'bookings/bk1/events/e1')))
    await assertSucceeds(getDoc(doc(alice(), 'bookings/bk1/repairRequests/r1')))
    await assertSucceeds(getDoc(doc(alice(), 'tracking/bk1')))
  })

  it('keeps another user out of the booking entirely', async () => {
    await assertFails(getDoc(doc(bob(), 'bookings/bk1')))
    await assertFails(getDoc(doc(bob(), 'bookings/bk1/events/e1')))
    await assertFails(getDoc(doc(bob(), 'tracking/bk1')))
  })

  it('refuses every client write, including by the owner', async () => {
    // Price and status are the server's to set. This is the rule that makes
    // "the client never sends a price it expects to be trusted" true.
    await assertFails(
      updateDoc(doc(alice(), 'bookings/bk1'), { price: { total: 0 } })
    )
    await assertFails(
      updateDoc(doc(alice(), 'bookings/bk1'), { status: 'completed' })
    )
    await assertFails(setDoc(doc(alice(), 'bookings/bk2'), { uid: ALICE }))
    await assertFails(deleteDoc(doc(alice(), 'bookings/bk1')))
  })

  it('refuses a self-approved repair request', async () => {
    await assertFails(
      updateDoc(doc(alice(), 'bookings/bk1/repairRequests/r1'), {
        status: 'approved',
      })
    )
  })

  it('hides the job OTP even from the owner', async () => {
    // getJobOtp decides when an OTP may be seen; the stored value is hashed.
    await assertFails(getDoc(doc(alice(), 'bookings/bk1/private/otp')))
  })

  it('allows a query scoped to the caller and refuses an unscoped one', async () => {
    const scoped = query(
      collection(alice(), 'bookings'),
      where('uid', '==', ALICE),
      limit(20)
    )
    await assertSucceeds(getDocs(scoped))

    await assertFails(getDocs(query(collection(alice(), 'bookings'), limit(20))))
    // Scoped to someone else is just as dead.
    await assertFails(
      getDocs(
        query(collection(bob(), 'bookings'), where('uid', '==', ALICE), limit(20))
      )
    )
  })

  it('refuses a query with no limit or one above the cap', async () => {
    await assertFails(
      getDocs(query(collection(alice(), 'bookings'), where('uid', '==', ALICE)))
    )
    await assertFails(
      getDocs(
        query(
          collection(alice(), 'bookings'),
          where('uid', '==', ALICE),
          limit(500)
        )
      )
    )
  })
})

// ---------------------------------------------------------------------------

describe('the balance and its ledger', () => {
  beforeEach(async () => {
    await asAdmin(async (db) => {
      await setDoc(doc(db, `wallets/${ALICE}`), {
        balance: 35000,
        lifetimeIssued: 55000,
        lifetimeToppedUp: 0,
        updatedAt: 1,
      })
      await setDoc(doc(db, `wallets/${ALICE}/ledger/e1`), {
        kind: 'issued',
        amount: 35000,
        balanceAfter: 35000,
        note: 'Refund for the visit we could not make',
        createdAt: 1,
      })
      await setDoc(doc(db, 'topupOrders/order_1'), {
        uid: ALICE,
        amount: 100000,
        createdAt: 1,
      })
    })
  })

  it('lets the owner read their balance and statement', async () => {
    await assertSucceeds(getDoc(doc(alice(), `wallets/${ALICE}`)))
    await assertSucceeds(getDoc(doc(alice(), `wallets/${ALICE}/ledger/e1`)))
    await assertSucceeds(
      getDocs(query(collection(alice(), `wallets/${ALICE}/ledger`), limit(50)))
    )
  })

  it('keeps one customer out of the balance of another', async () => {
    await assertFails(getDoc(doc(bob(), `wallets/${ALICE}`)))
    await assertFails(getDoc(doc(bob(), `wallets/${ALICE}/ledger/e1`)))
  })

  it('refuses an unbounded read of a statement', async () => {
    await assertFails(
      getDocs(query(collection(alice(), `wallets/${ALICE}/ledger`), limit(500)))
    )
  })

  // The whole point. A balance a client can write is not a balance, and a
  // ledger a client can append to is not a reason for one.
  it('lets nobody write a balance or a ledger entry, not even its owner', async () => {
    await assertFails(
      setDoc(doc(alice(), `wallets/${ALICE}`), { balance: 9999999 })
    )
    await assertFails(
      updateDoc(doc(alice(), `wallets/${ALICE}`), { balance: 9999999 })
    )
    await assertFails(deleteDoc(doc(alice(), `wallets/${ALICE}`)))
    await assertFails(
      setDoc(doc(alice(), `wallets/${ALICE}/ledger/e2`), {
        kind: 'topup',
        amount: 9999999,
        balanceAfter: 9999999,
        note: 'free money',
        createdAt: 1,
      })
    )
  })

  // The amount a top-up credits is read off this document by the webhook, so
  // a customer who could write it could name their own number.
  it('hides a top-up order from everybody, including the customer who raised it', async () => {
    await assertFails(getDoc(doc(alice(), 'topupOrders/order_1')))
    await assertFails(
      setDoc(doc(alice(), 'topupOrders/order_2'), {
        uid: ALICE,
        amount: 9999999,
        createdAt: 1,
      })
    )
    await assertFails(
      updateDoc(doc(alice(), 'topupOrders/order_1'), { amount: 9999999 })
    )
  })
})

// ---------------------------------------------------------------------------

describe('invoices, warranties and reviews', () => {
  beforeEach(async () => {
    await asAdmin(async (db) => {
      await setDoc(doc(db, 'invoices/inv1'), { uid: ALICE, number: 'AP/26/001' })
      await setDoc(doc(db, 'warranties/w1'), { uid: ALICE, expiresAt: 1 })
      await setDoc(doc(db, 'reviews/rv1'), { uid: ALICE, rating: 5 })
    })
  })

  it('lets the owner read each of them', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'invoices/inv1')))
    await assertSucceeds(getDoc(doc(alice(), 'warranties/w1')))
    await assertSucceeds(getDoc(doc(alice(), 'reviews/rv1')))
  })

  it('keeps them from everybody else', async () => {
    await assertFails(getDoc(doc(bob(), 'invoices/inv1')))
    await assertFails(getDoc(doc(bob(), 'warranties/w1')))
    await assertFails(getDoc(doc(bob(), 'reviews/rv1')))
  })

  it('refuses a review written straight to the collection', async () => {
    // submitReview enforces "completed booking, once only". A direct write
    // would let anyone post a five-star review for a job that never happened.
    await assertFails(
      setDoc(doc(alice(), 'reviews/rv2'), { uid: ALICE, rating: 5 })
    )
    await assertFails(updateDoc(doc(alice(), 'invoices/inv1'), { number: 'X' }))
  })
})

// ---------------------------------------------------------------------------

describe('support', () => {
  beforeEach(async () => {
    await asAdmin(async (db) => {
      await setDoc(doc(db, 'supportTickets/t1'), { uid: ALICE, status: 'open' })
      await setDoc(doc(db, 'supportTickets/t1/messages/m1'), {
        author: 'user',
        text: 'Hello',
      })
    })
  })

  it('lets the owner read their ticket and its messages', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'supportTickets/t1')))
    await assertSucceeds(getDoc(doc(alice(), 'supportTickets/t1/messages/m1')))
  })

  it('keeps another user out of the thread', async () => {
    await assertFails(getDoc(doc(bob(), 'supportTickets/t1')))
    await assertFails(getDoc(doc(bob(), 'supportTickets/t1/messages/m1')))
  })

  it('refuses a message written directly', async () => {
    // sendSupportMessage writes the message and the assistant's reply together,
    // so lastMessageAt cannot drift from what is actually in the thread.
    await assertFails(
      setDoc(doc(alice(), 'supportTickets/t1/messages/m2'), {
        author: 'user',
        text: 'Direct',
      })
    )
    await assertFails(
      updateDoc(doc(alice(), 'supportTickets/t1'), { status: 'resolved' })
    )
  })
})

// ---------------------------------------------------------------------------

describe('notifications', () => {
  beforeEach(async () => {
    await asAdmin(async (db) => {
      await setDoc(doc(db, `notifications/${ALICE}/items/n1`), {
        title: 'Technician assigned',
        body: 'Arjun is on the way',
        at: 1,
      })
    })
  })

  it('lets the owner read and mark one as read', async () => {
    await assertSucceeds(getDoc(doc(alice(), `notifications/${ALICE}/items/n1`)))
    await assertSucceeds(
      updateDoc(doc(alice(), `notifications/${ALICE}/items/n1`), {
        readAt: Date.now(),
      })
    )
  })

  it('refuses any other edit, and refuses another user', async () => {
    await assertFails(
      updateDoc(doc(alice(), `notifications/${ALICE}/items/n1`), {
        title: 'Rewritten',
      })
    )
    await assertFails(deleteDoc(doc(alice(), `notifications/${ALICE}/items/n1`)))
    await assertFails(getDoc(doc(bob(), `notifications/${ALICE}/items/n1`)))
  })
})

// ---------------------------------------------------------------------------

describe('collections the client never touches', () => {
  it('denies waitlist, counters and webhook bookkeeping', async () => {
    await assertFails(setDoc(doc(alice(), 'waitlist/w1'), { pincode: '500084' }))
    // The waitlist is a list of people's phone numbers against the areas they
    // live in. joinWaitlist writes it; nothing reads it back.
    await assertFails(getDoc(doc(alice(), 'waitlist/500084_+919876543210')))
    await assertFails(getDoc(doc(alice(), 'counters/booking')))
    await assertFails(setDoc(doc(alice(), 'counters/booking'), { next: 1 }))
    await assertFails(getDoc(doc(alice(), 'processedWebhookEvents/evt1')))
  })

  it('denies a collection nobody wrote a rule for', async () => {
    await assertFails(setDoc(doc(alice(), 'somethingNew/x'), { a: 1 }))
    await assertFails(getDoc(doc(guest(), 'somethingNew/x')))
  })
})
