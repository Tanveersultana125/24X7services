import { z } from 'zod'
import { paiseSchema } from './money'

/**
 * Credits: money we owe the customer, never money the customer gave us.
 *
 * That distinction is the whole design. A wallet a customer can top up is a
 * prepaid instrument — it holds public money, it needs a float account, a
 * refund policy and, past a point, the RBI's permission. Credits are the other
 * thing entirely: we issue them when we owe an apology or a refund, they can
 * only be spent against our own invoices, and the customer never puts a rupee
 * in. Nothing here accepts money, and nothing here should ever learn how.
 *
 * The balance is a running total kept on the wallet document, and the ledger
 * under it is the reason for every paisa of it. Both are written in the same
 * transaction by the server and by nothing else, so the balance can never be a
 * number with no entries behind it.
 *
 * DECISION NEEDED: credits do not expire. Expiry is the usual practice and it
 * is also the usual complaint — it needs a sweep, a warning notification and a
 * lot of arguing with people whose credit lapsed the week before they needed
 * it. If the business wants expiry, it is an `expiresAt` on the entry, a
 * scheduled sweep that spends the lapsed lots, and a line in the FAQ; do not
 * add the field alone, because a balance that ignores it is worse than one
 * that never had it.
 */

/** Which way an entry moved the balance, and on whose account. */
export const walletEntryKindSchema = z.enum([
  /** We gave credits. */
  'issued',
  /** The customer spent them against a bill. */
  'spent',
  /** We took back credits issued in error. */
  'reversed',
])
export type WalletEntryKind = z.infer<typeof walletEntryKindSchema>

/** Why credits were issued. Absent on entries that are not an issue. */
export const creditReasonSchema = z.enum([
  'cancellation_refund',
  'late_visit',
  'service_recovery',
  'referral',
  'goodwill',
])
export type CreditReason = z.infer<typeof creditReasonSchema>

export const walletEntrySchema = z.object({
  id: z.string().min(1),
  kind: walletEntryKindSchema,
  /**
   * Always positive; `kind` carries the direction. A ledger with signed
   * amounts invites a sum over the wrong subset and a balance nobody can
   * reconcile by eye.
   */
  amount: paiseSchema,
  /**
   * The balance immediately after this entry. Stored rather than derived so a
   * statement reads top to bottom without re-adding the whole history, and so
   * a gap in the ledger is visible instead of silently absorbed.
   */
  balanceAfter: paiseSchema,
  reason: creditReasonSchema.optional(),
  /** One line, in the customer's words, for the statement row. */
  note: z.string().trim().min(1).max(160),
  /** The booking this came from or went to, when there is one. */
  bookingId: z.string().min(1).optional(),
  createdAt: z.number().int().min(0),
})
export type WalletEntry = z.infer<typeof walletEntrySchema>

export const walletSchema = z.object({
  /** Unspent credits. This is the number on the card. */
  balance: paiseSchema,
  /** Everything ever issued, so "you have saved X with us" is answerable. */
  lifetimeIssued: paiseSchema,
  updatedAt: z.number().int().min(0),
})
export type Wallet = z.infer<typeof walletSchema>

/** What a customer with no wallet document has: nothing, and no error. */
export const EMPTY_WALLET: Wallet = {
  balance: 0,
  lifetimeIssued: 0,
  updatedAt: 0,
}
