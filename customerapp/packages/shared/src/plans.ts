import { z } from 'zod'
import { applianceIdSchema } from './enums'
import { paiseSchema, type Paise } from './money'

/**
 * The two things a customer can be on beyond a single booking: a plan, and a
 * membership.
 *
 * They are not the same thing and the app never blurs them:
 *
 *   - A **plan** is bought against appliances. It is an annual maintenance
 *     contract — a fixed number of visits on a named fridge or washing machine,
 *     for a year, paid for up front. It has a start, an end, and a count of
 *     visits left, and when either runs out the plan is over.
 *   - A **membership** is bought against the account. It changes the price of
 *     everything else — the visit fee goes, repairs come down — for as long as
 *     it lasts. It covers no visits of its own.
 *
 * A customer can hold both, neither, or one of each, and nothing here assumes
 * otherwise. Both are stored with the price and the terms copied in rather
 * than referred to, for the same reason a warranty is: what was bought has to
 * keep saying what it said after the catalog is re-priced.
 */

// ---------------------------------------------------------------------------
// Plans — the catalog
// ---------------------------------------------------------------------------

/**
 * A plan on offer. Seeded like the rest of the catalog, public to read, and
 * written by nobody in the app.
 */
export const catalogPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
  /** One line under the name, in the customer's words. */
  tagline: z.string().min(1).max(120),
  /** Which appliances a plan bought here covers. */
  applianceIds: z.array(applianceIdSchema).min(1),
  price: paiseSchema,
  /** What the same cover would cost as separate visits. Shown struck through. */
  compareAt: paiseSchema.optional(),
  durationDays: z.number().int().min(30).max(1095),
  /** Service visits included. Repairs beyond them are quoted as usual. */
  visitsIncluded: z.number().int().min(1).max(24),
  benefits: z.array(z.string().min(1).max(120)).min(1).max(8),
  order: z.number().int().min(0),
  active: z.boolean(),
})
export type CatalogPlan = z.infer<typeof catalogPlanSchema>

// ---------------------------------------------------------------------------
// Plans — what a customer holds
// ---------------------------------------------------------------------------

/**
 * A plan somebody has paid for.
 *
 * The name, the price, the cover and the benefits are copied off the catalog
 * plan at the moment of purchase. A plan re-priced next April must not rewrite
 * what this customer bought last May.
 */
export const userPlanSchema = z.object({
  id: z.string().min(1),
  uid: z.string().min(1),
  planId: z.string().min(1),
  name: z.string().min(1).max(60),
  applianceIds: z.array(applianceIdSchema).min(1),
  /** What was actually paid, not what the plan costs today. */
  price: paiseSchema,
  visitsIncluded: z.number().int().min(1).max(24),
  /** Stamped by the completion trigger when a visit is taken off the plan. */
  visitsUsed: z.number().int().min(0).default(0),
  benefits: z.array(z.string().min(1).max(120)).default([]),
  startsAt: z.number().int().min(0),
  expiresAt: z.number().int().min(0),
  /** The payment this came from, so a plan can always be traced to money. */
  paymentId: z.string().min(1).optional(),
  createdAt: z.number().int().min(0),
})
export type UserPlan = z.infer<typeof userPlanSchema>

/**
 * Whether a plan is still worth anything, from the plan itself.
 *
 * Derived rather than stored, like a warranty's expiry: a status field would
 * need a sweep to stay true, and a plan that reads "active" the morning after
 * it lapsed is worse than no badge at all.
 */
export function isPlanActive(plan: UserPlan, now: number = Date.now()): boolean {
  return plan.expiresAt > now && plan.visitsUsed < plan.visitsIncluded
}

export function planVisitsLeft(plan: UserPlan): number {
  return Math.max(0, plan.visitsIncluded - plan.visitsUsed)
}

// ---------------------------------------------------------------------------
// Membership
// ---------------------------------------------------------------------------

/** One tier today. An enum because the second one should be a compile error. */
export const membershipTierSchema = z.enum(['plus'])
export type MembershipTier = z.infer<typeof membershipTierSchema>

export const membershipPeriodSchema = z.enum(['monthly', 'yearly'])
export type MembershipPeriod = z.infer<typeof membershipPeriodSchema>

/**
 * What a membership is bought as. Two lengths of the same thing, priced here
 * rather than in the catalog because there is exactly one tier and a
 * collection with two documents in it is a collection nobody remembers to
 * seed.
 */
export const MEMBERSHIP_OPTIONS = [
  {
    id: 'plus-monthly',
    tier: 'plus',
    period: 'monthly',
    label: 'Monthly',
    price: 19_900 as Paise,
    durationDays: 30,
  },
  {
    id: 'plus-yearly',
    tier: 'plus',
    period: 'yearly',
    label: 'Yearly',
    price: 149_900 as Paise,
    durationDays: 365,
    /** Twelve months at the monthly price, for the saving to be checkable. */
    compareAt: 238_800 as Paise,
  },
] as const satisfies ReadonlyArray<{
  id: string
  tier: MembershipTier
  period: MembershipPeriod
  label: string
  price: Paise
  durationDays: number
  compareAt?: Paise
}>

export type MembershipOptionId = (typeof MEMBERSHIP_OPTIONS)[number]['id']

export const membershipOptionIdSchema = z.enum([
  'plus-monthly',
  'plus-yearly',
]) satisfies z.ZodType<MembershipOptionId>

export function membershipOption(id: MembershipOptionId) {
  const found = MEMBERSHIP_OPTIONS.find((option) => option.id === id)
  if (!found) throw new Error(`Unknown membership option: ${id}`)
  return found
}

/**
 * What 24X7 Plus actually gives.
 *
 * Every line is something the code can honour today or a person can honour on
 * the phone. Nothing aspirational goes in this list — a benefit nobody applies
 * is a refund request with a screenshot attached.
 */
export const MEMBERSHIP_BENEFITS = [
  'No visit fee, on every booking',
  '10% off every repair, parts and labour',
  'Priority slots, including same day',
  'A named person on support, not a queue',
] as const

/** What the visit fee becomes for a member. */
export const MEMBER_VISIT_FEE = 0 as Paise
/** What comes off a member's repair total, as a percentage. */
export const MEMBER_REPAIR_DISCOUNT_PERCENT = 10

export const membershipSchema = z.object({
  tier: membershipTierSchema,
  period: membershipPeriodSchema,
  startsAt: z.number().int().min(0),
  expiresAt: z.number().int().min(0),
  /**
   * Off, always, and there is no switch for it. A membership that renews
   * itself needs a mandate, a reminder, a cancellation flow and somewhere to
   * argue about the charge; until all four exist, it lapses and the customer
   * buys it again.
   */
  autoRenew: z.literal(false).default(false),
  paymentId: z.string().min(1).optional(),
  updatedAt: z.number().int().min(0),
})
export type Membership = z.infer<typeof membershipSchema>

export function isMembershipActive(
  membership: Membership | null,
  now: number = Date.now()
): boolean {
  return membership !== null && membership.expiresAt > now
}
