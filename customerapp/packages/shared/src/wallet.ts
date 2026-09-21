import { z } from 'zod'
import { paiseSchema, type Paise } from './money'

/**
 * The customer's balance with us, and the reason for every paisa of it.
 *
 * Two kinds of money land in it. Credits, which we issue when we owe an
 * apology or a refund and which cost the customer nothing; and top-ups, which
 * are the customer's own money, paid in through the same gateway that takes
 * every other payment in this app.
 *
 * Accepting a top-up makes this a prepaid instrument, so the shape of it is a
 * decision and not an accident:
 *
 *   - Closed loop. The balance buys 24X7 services and nothing else. It cannot
 *     be sent to another customer, spent anywhere else, or withdrawn as cash.
 *     That is what keeps it outside the RBI's authorisation regime for
 *     prepaid payment instruments, and every one of those three limits has to
 *     stay true for that to keep holding.
 *   - Refundable. A customer who topped up and changed their mind gets it
 *     back to the card or account it came from, on request. Stored value the
 *     customer cannot get out of is the version that draws attention.
 *   - No expiry. Neither credits nor top-ups lapse. Expiry needs a sweep, a
 *     warning notification and an argument with everyone whose balance went
 *     the week before they needed it; if the business ever wants it, it is an
 *     `expiresAt` on the entry plus that sweep, never the field alone.
 *
 * DECISION NEEDED: refunds are manual today — support raises them in the
 * Razorpay dashboard against the original payment. The ledger records the
 * reversal either way, but there is no self-serve "withdraw" and there should
 * not be one until someone has decided how it is policed.
 *
 * The balance is a running total kept on the wallet document, and the ledger
 * under it is the reason for every paisa of it. Both are written in the same
 * transaction by the server and by nothing else, so the balance can never be a
 * number with no entries behind it.
 */

/** Which way an entry moved the balance, and on whose account. */
export const walletEntryKindSchema = z.enum([
  /** We gave credits. Costs the customer nothing. */
  'issued',
  /** The customer paid money in. */
  'topup',
  /** The balance went against a bill. */
  'spent',
  /** We took it back — credits issued in error, or a top-up refunded. */
  'reversed',
])
export type WalletEntryKind = z.infer<typeof walletEntryKindSchema>

/**
 * Whether an entry of this kind put money in or took it out.
 *
 * One function rather than a comparison at each call site: there are two
 * inward kinds now and the day a third arrives, a `kind === 'issued'` left
 * somewhere is a row with the wrong sign on a statement about money.
 */
export function isCreditEntry(kind: WalletEntryKind): boolean {
  return kind === 'issued' || kind === 'topup'
}

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
  /** Unspent. This is the number on the card. */
  balance: paiseSchema,
  /**
   * Everything we ever gave, so "you have saved X with us" is answerable.
   * Top-ups are not in here — the customer's own money is not a saving.
   */
  lifetimeIssued: paiseSchema,
  /** Everything the customer ever paid in. Defaults for wallets predating it. */
  lifetimeToppedUp: paiseSchema.default(0),
  updatedAt: z.number().int().min(0),
})
export type Wallet = z.infer<typeof walletSchema>

/**
 * What a customer may put in at once.
 *
 * A floor because a gateway fee on a twenty rupee top-up costs more than it
 * collects, and a ceiling because a closed-loop balance this size is already
 * more than anyone needs for an appliance repair — and a stored balance is a
 * liability, not a win.
 */
export const TOPUP_MIN = 10_000 as Paise // ₹100
export const TOPUP_MAX = 2_000_000 as Paise // ₹20,000

/**
 * The amounts offered as buttons. Four, and no free-text field: a top-up is
 * not a payment for anything in particular, so an empty box asking how much
 * is a question with no right answer in it.
 */
export const TOPUP_PRESETS: readonly Paise[] = [
  50_000, 100_000, 200_000, 500_000,
]

export const topupAmountSchema = paiseSchema
  .min(TOPUP_MIN, 'The smallest top-up is ₹100')
  .max(TOPUP_MAX, 'The largest top-up is ₹20,000')

/** What a customer with no wallet document has: nothing, and no error. */
export const EMPTY_WALLET: Wallet = {
  balance: 0,
  lifetimeIssued: 0,
  lifetimeToppedUp: 0,
  updatedAt: 0,
}
