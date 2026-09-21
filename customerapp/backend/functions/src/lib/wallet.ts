import { FieldValue } from 'firebase-admin/firestore'
import {
  COL,
  SUB,
  type CreditReason,
  type Paise,
  type WalletEntryKind,
} from '@app/shared'
import { db } from './admin'

/**
 * Every movement of a customer's credits goes through here.
 *
 * Two invariants hold it up, and both need the transaction:
 *
 *  - the balance on the wallet document and the entries under it are written
 *    together, so there is never a balance with no reason behind it, nor a
 *    reason that did not move the balance;
 *  - `balanceAfter` is stamped from the balance read inside the transaction,
 *    so a statement reads top to bottom even when two credits land in the same
 *    second.
 *
 * Nothing here is callable. Credits are issued by server code that has already
 * decided we owe them — a cancellation, a visit we missed, a support agent's
 * goodwill — and spent by the checkout path against a bill the server priced.
 * There is deliberately no endpoint a client can reach, because the first one
 * would be the last line of defence for real money.
 */

/**
 * A key that makes a movement happen at most once.
 *
 * The retry is the danger, not the request: a cancellation handler that runs
 * twice would otherwise credit twice, and a payment retried after a timeout
 * would spend twice. The key becomes the entry's document id, so the second
 * write of the same movement collides with the first and is dropped instead of
 * doubling it. Build it from what makes the movement unique — the booking and
 * the purpose — never from a timestamp or a random.
 */
export function movementId(parts: readonly string[]): string {
  return parts
    .map((part) => part.replace(/[^A-Za-z0-9_-]/g, '_'))
    .join('__')
    .slice(0, 120)
}

export interface CreditInput {
  uid: string
  amount: Paise
  reason: CreditReason
  /** The statement line, in the customer's words. */
  note: string
  bookingId?: string
  /** See movementId. Two calls with the same id are one credit. */
  id: string
}

export interface SpendInput {
  uid: string
  amount: Paise
  note: string
  bookingId: string
  id: string
}

export interface MovementResult {
  /** The balance after this call, whether or not this call moved it. */
  balance: Paise
  /** How much actually moved. Zero when the movement had already happened. */
  applied: Paise
}

/**
 * Give a customer credits.
 *
 * Idempotent on `id`: calling it again with the same id returns the balance and
 * reports nothing applied, which is what a retried handler should see.
 */
export async function issueCredit({
  uid,
  amount,
  reason,
  note,
  bookingId,
  id,
}: CreditInput): Promise<MovementResult> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`issueCredit: amount must be positive paise, got ${amount}`)
  }
  return move({
    uid,
    id,
    kind: 'issued',
    amount,
    reason,
    note,
    bookingId,
    // A credit is never refused. There is no ceiling on what we can owe.
    allow: () => amount,
  })
}

/**
 * Spend a customer's credits against a bill.
 *
 * Spends what is there and no more: asking for more than the balance applies
 * the balance rather than failing, because the caller's next step is to charge
 * the remainder, and a hard failure there would leave a customer with credits
 * unable to pay at all. The result says what actually moved — bill for the
 * difference, not for the ask.
 */
export async function spendCredit({
  uid,
  amount,
  note,
  bookingId,
  id,
}: SpendInput): Promise<MovementResult> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`spendCredit: amount must be positive paise, got ${amount}`)
  }
  return move({
    uid,
    id,
    kind: 'spent',
    amount,
    note,
    bookingId,
    allow: (balance) => Math.min(amount, balance),
  })
}

/** Take back credits issued in error. Same rules as a spend. */
export async function reverseCredit({
  uid,
  amount,
  note,
  bookingId,
  id,
}: Omit<SpendInput, 'bookingId'> & { bookingId?: string }): Promise<MovementResult> {
  return move({
    uid,
    id,
    kind: 'reversed',
    amount,
    note,
    bookingId,
    allow: (balance) => Math.min(amount, balance),
  })
}

// ---------------------------------------------------------------------------

interface Movement {
  uid: string
  id: string
  kind: WalletEntryKind
  amount: Paise
  reason?: CreditReason
  note: string
  bookingId?: string
  /** How much of `amount` this movement may actually take, given the balance. */
  allow: (balance: Paise) => Paise
}

async function move({
  uid,
  id,
  kind,
  reason,
  note,
  bookingId,
  allow,
}: Movement): Promise<MovementResult> {
  const walletRef = db().collection(COL.wallets).doc(uid)
  const entryRef = walletRef.collection(SUB.ledger).doc(id)

  return db().runTransaction(async (tx) => {
    // Both reads before any write: a transaction that writes first cannot read
    // afterwards, and the entry check is what makes this idempotent.
    const [walletSnap, entrySnap] = await Promise.all([
      tx.get(walletRef),
      tx.get(entryRef),
    ])

    const balance: number = walletSnap.get('balance') ?? 0
    if (entrySnap.exists) return { balance, applied: 0 }

    const applied = allow(balance)
    if (applied <= 0) return { balance, applied: 0 }

    const balanceAfter = kind === 'issued' ? balance + applied : balance - applied
    const now = Date.now()

    tx.set(entryRef, {
      kind,
      amount: applied,
      balanceAfter,
      note,
      createdAt: now,
      ...(reason ? { reason } : {}),
      ...(bookingId ? { bookingId } : {}),
    })

    tx.set(
      walletRef,
      {
        balance: balanceAfter,
        lifetimeIssued: FieldValue.increment(kind === 'issued' ? applied : 0),
        updatedAt: now,
      },
      { merge: true }
    )

    return { balance: balanceAfter, applied }
  })
}
