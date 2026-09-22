import { z } from 'zod'
import { paiseSchema, type Paise } from './money'

/**
 * A gift card: money one customer pays in so another customer can spend it.
 *
 * It is the only thing in this app where the payer and the person who gets the
 * value are different people, which is what decides its shape:
 *
 *   - The code is the card. Whoever holds it can redeem it, once, and that is
 *     the point — it gets forwarded, screenshotted and read out over the
 *     phone. So it is long enough not to be guessed, and it is never listed by
 *     anyone but the person who bought it.
 *   - Redeeming lands the amount in the recipient's balance as credits, which
 *     means every limit on the balance already applies to it: 24X7 services
 *     only, no transfer, no cash. A gift card cannot be turned into money by
 *     buying one and redeeming it yourself.
 *   - It never expires, for the same reason the balance does not. An expiry
 *     here is a customer holding a birthday present that stopped working.
 *
 * DECISION NEEDED: there is no cancel-and-refund path for an unredeemed card.
 * Support can reverse the buyer's payment in the dashboard, but nothing in the
 * app marks the card dead afterwards, so a reversed card is still redeemable.
 * Decide before this is offered at any scale.
 */

/** The amounts offered. Fixed, like the top-up presets, and for the same reason. */
export const GIFT_CARD_AMOUNTS: readonly Paise[] = [
  50_000, 100_000, 200_000, 500_000,
]

export const giftCardAmountSchema = paiseSchema
  .min(50_000, 'The smallest gift card is ₹500')
  .max(500_000, 'The largest gift card is ₹5,000')

/**
 * `24X7-ABCD-EFGH`, from an alphabet with no O, 0, I or 1 in it, because this
 * is a string people read out loud and type back in.
 */
export const GIFT_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const giftCardCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^24X7-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/,
    'A gift card code looks like 24X7-ABCD-EFGH'
  )

/**
 * Accept what people actually paste: lower case, spaces, missing dashes. The
 * validator above is strict; this is what runs before it.
 */
export function normaliseGiftCode(input: string): string {
  const body = input.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^24X7/, '')
  if (body.length !== 8) return input.trim().toUpperCase()
  return `24X7-${body.slice(0, 4)}-${body.slice(4)}`
}

export const giftCardStatusSchema = z.enum(['active', 'redeemed'])
export type GiftCardStatus = z.infer<typeof giftCardStatusSchema>

export const giftCardSchema = z.object({
  /** Also the document id, so a code can be looked up without a query. */
  code: giftCardCodeSchema,
  amount: giftCardAmountSchema,
  status: giftCardStatusSchema,
  purchasedBy: z.string().min(1),
  purchasedAt: z.number().int().min(0),
  /** Who it is for, as the buyer wrote it. Shown on the card, never verified. */
  recipientName: z.string().trim().max(60).optional(),
  message: z.string().trim().max(200).optional(),
  redeemedBy: z.string().min(1).optional(),
  redeemedAt: z.number().int().min(0).optional(),
})
export type GiftCard = z.infer<typeof giftCardSchema>

/** What the buyer fills in. The amount is bounded above; the rest is theirs. */
export const giftCardInputSchema = z.object({
  amount: giftCardAmountSchema,
  recipientName: z.string().trim().max(60).optional(),
  message: z.string().trim().max(200).optional(),
})
export type GiftCardInput = z.infer<typeof giftCardInputSchema>
