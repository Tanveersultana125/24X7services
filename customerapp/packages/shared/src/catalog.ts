import { z } from 'zod'
import {
  applianceIdSchema,
  brandIdSchema,
  serviceKeySchema,
  slotAvailabilitySchema,
} from './enums'
import { paiseSchema } from './money'

/**
 * The catalog is public, read-only to clients, and the only place appliance,
 * service, brand and issue content lives. No screen may hardcode any of it.
 */

export const pincodeSchema = z
  .string()
  .regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode')

export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})
export type GeoPoint = z.infer<typeof geoPointSchema>

// ---------------------------------------------------------------------------
// Appliances
// ---------------------------------------------------------------------------

/**
 * A detail field is a question the booking asks about the specific appliance —
 * "front load or top load?". It is data rather than code so a new appliance
 * needs a seed entry, not a new screen.
 */
export const detailFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  /** `select` renders as a chip group, `text` as a single-line input. */
  kind: z.enum(['select', 'text']),
  options: z.array(z.string().min(1)).optional(),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
})
export type DetailField = z.infer<typeof detailFieldSchema>

export const catalogApplianceSchema = z.object({
  id: applianceIdSchema,
  name: z.string().min(1),
  image: z.string().min(1),
  order: z.number().int().min(0),
  active: z.boolean(),
  detailFields: z.array(detailFieldSchema),
})
export type CatalogAppliance = z.infer<typeof catalogApplianceSchema>

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const catalogServiceSchema = z.object({
  id: z.string().min(1),
  applianceId: applianceIdSchema,
  serviceKey: serviceKeySchema,
  name: z.string().min(1),
  description: z.string().min(1),
  /** Charged for the technician visit and inspection, before any repair. */
  visitFee: paiseSchema,
  /** Shown as "from ₹X" — indicative only, never used to compute a total. */
  startingPrice: paiseSchema,
  order: z.number().int().min(0),
  active: z.boolean(),
  /** Overrides `config/business.defaultWarrantyDays` when present. */
  warrantyDays: z.number().int().min(0).optional(),
  /**
   * A short clip of the work, shown above the service on its card.
   *
   * Optional, and expected to stay optional: most services will never have
   * one, and a card is written to look right without it. Seeded as a path
   * under `public/` like every other asset here. Keep them short, silent and
   * loopable — they autoplay muted, which is the only way a browser will play
   * one unasked, and a clip that needs sound to make sense is a clip nobody
   * will understand.
   */
  video: z.string().min(1).optional(),
  /**
   * A still of that clip, for every card that is not the one playing.
   *
   * Only the first service on an appliance page moves; the rest show this.
   * It is a frame of the same clip rather than the appliance drawing, because
   * the drawing is shared by every service on the appliance and putting it on
   * six cards turns a list of services into a list of the same thing. Made by
   * `frontend/scripts/makeServicePosters.mjs`, which takes it from the middle
   * of the clip where the work is actually happening.
   */
  poster: z.string().min(1).optional(),
  /**
   * How long the visit usually takes, in minutes.
   *
   * It lets a rail card separate a twenty-minute installation from a two-hour
   * deep clean before anyone opens a slot picker. Typical on-site time, not a
   * promise — no screen may word it as one.
   */
  durationMinutes: z.number().int().min(1).optional(),
  /**
   * What customers scored this service out of five, and how many of them did.
   *
   * Both or neither: a rating with no count is a number nobody can weigh —
   * 4.9 from three people and 4.9 from three thousand are not the same claim
   * — so every screen draws the pair or draws nothing. Optional for the same
   * reason: a service nobody has reviewed yet has no score, and inventing one
   * is a claim about other customers that is not true.
   *
   * Seeded today. The honest source is a rollup over the reviews collection,
   * which cannot be written yet: a review is filed against a booking and its
   * technician, and carries no service key to group by. Until that exists,
   * treat these as placeholders and replace them before launch.
   */
  rating: z.number().min(1).max(5).optional(),
  reviewCount: z.number().int().min(1).optional(),
  /**
   * The real thing, kept beside the seeded one rather than overwriting it.
   *
   * Counted and summed as reviews arrive, the way a technician's rating is,
   * because this number appears on every card and recounting the reviews
   * collection per card is a query per card. `serviceRating` decides which of
   * the two a screen shows, and the answer is: the real one the moment there
   * is one.
   */
  reviewStats: z
    .object({
      count: z.number().int().min(0),
      sum: z.number().int().min(0),
      average: z.number().min(0).max(5),
    })
    .optional(),
  /**
   * The visit, step by step, in the order it happens.
   *
   * What a customer is buying with a visit fee is an hour of somebody else's
   * time, and the only way to make that concrete before it happens is to say
   * what the hour consists of. Three or four steps; a list long enough to need
   * scrolling is a list nobody reads.
   */
  process: z
    .array(
      z.object({
        title: z.string().min(1).max(40),
        body: z.string().min(1).max(200),
      })
    )
    .max(6)
    .optional(),
  /**
   * What this service is not.
   *
   * Every line here is one that would otherwise be found out on the day, with
   * a technician in the room and somebody already annoyed. It is cheaper to
   * lose the booking than to lose the argument.
   */
  excludes: z.array(z.string().min(1).max(200)).max(8).optional(),
  /** The questions this service raises, answered where it is being chosen. */
  faqs: z
    .array(
      z.object({
        q: z.string().min(1).max(160),
        a: z.string().min(1).max(600),
      })
    )
    .max(8)
    .optional(),
})
export type CatalogService = z.infer<typeof catalogServiceSchema>

/**
 * The score to show for a service, and how many people are behind it.
 *
 * Real reviews win the moment there is one. The seeded pair is a placeholder
 * that exists so the screens could be built before anybody had reviewed
 * anything, and every screen asks this function rather than reading the
 * fields, so the day the placeholders are deleted nothing else has to change.
 */
export function serviceRating(
  service: Pick<CatalogService, 'rating' | 'reviewCount' | 'reviewStats'>
): { average: number; count: number } | null {
  if (service.reviewStats && service.reviewStats.count > 0) {
    return {
      average: service.reviewStats.average,
      count: service.reviewStats.count,
    }
  }
  if (service.rating !== undefined && service.reviewCount !== undefined) {
    return { average: service.rating, count: service.reviewCount }
  }
  return null
}

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

export const catalogBrandSchema = z.object({
  id: brandIdSchema,
  name: z.string().min(1),
  /** Rendered as text. Logos stay off until an authorised partnership exists. */
  wordmark: z.string().min(1),
  active: z.boolean(),
  order: z.number().int().min(0),
})
export type CatalogBrand = z.infer<typeof catalogBrandSchema>

/** Document id is `${brandId}_${applianceId}`. */
export const brandApplianceMatrixEntrySchema = z.object({
  brandId: brandIdSchema,
  applianceId: applianceIdSchema,
  enabled: z.boolean(),
})
export type BrandApplianceMatrixEntry = z.infer<
  typeof brandApplianceMatrixEntrySchema
>

/**
 * A service's document id, which is the pair that identifies it.
 *
 * The seed, the completion trigger and the rating rollup all build this string
 * today, each in its own line of code. One of them getting the separator wrong
 * is a document nobody finds and no error anywhere.
 */
export function serviceDocId(applianceId: string, serviceKey: string): string {
  return `${applianceId}_${serviceKey}`
}

export function matrixDocId(brandId: string, applianceId: string): string {
  return `${brandId}_${applianceId}`
}

// ---------------------------------------------------------------------------
// Issues and rule-based diagnosis
// ---------------------------------------------------------------------------

export const catalogIssueSchema = z.object({
  id: z.string().min(1),
  applianceId: applianceIdSchema,
  label: z.string().min(1),
  order: z.number().int().min(0),
  allowMultiple: z.boolean(),
})
export type CatalogIssue = z.infer<typeof catalogIssueSchema>

/**
 * Diagnosis in v1 is a lookup, not a model. The copy it feeds is fixed:
 * "Possible causes" and "Your technician will verify this during inspection."
 */
export const diagnosisRuleSchema = z.object({
  id: z.string().min(1),
  applianceId: applianceIdSchema,
  issueId: z.string().min(1),
  possibleCauses: z.array(z.string().min(1)).min(1),
  tips: z.array(z.string().min(1)),
})
export type DiagnosisRule = z.infer<typeof diagnosisRuleSchema>

// ---------------------------------------------------------------------------
// Home page content
// ---------------------------------------------------------------------------

/**
 * Where a banner is allowed to appear.
 *
 * `hero` rides the carousel under the search bar; `inline` is a single card
 * dropped between two sections further down. Which one a banner is, is seed
 * data rather than something Home decides, so the running order of the page
 * can change without a release.
 */
export const bannerSlotSchema = z.enum(['hero', 'inline'])
export type BannerSlot = z.infer<typeof bannerSlotSchema>

/**
 * Which of the five house gradients a banner is painted in.
 *
 * The colour is data rather than something baked into the artwork, so a banner
 * card can fill its own background at any size and the picture on it is only
 * ever a subject on a transparent ground. Having the two arrive as one flat
 * image is what forced the layout to guess where the subject was, and a guess
 * that is right on one phone puts a shield through the middle of a headline on
 * the next.
 */
export const bannerToneSchema = z.enum([
  'blue',
  'amber',
  'green',
  'teal',
  'violet',
])
export type BannerTone = z.infer<typeof bannerToneSchema>

export const bannerSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  /** A subject on a transparent ground — never a full-bleed background. */
  image: z.string().optional(),
  /** A small pill in the corner of the card: "New", "Trending". */
  badge: z.string().optional(),
  slot: bannerSlotSchema.default('hero'),
  tone: bannerToneSchema.default('blue'),
  ctaLabel: z.string().optional(),
  /** Internal route only; external links are not allowed from a banner. */
  ctaHref: z.string().startsWith('/').optional(),
  order: z.number().int().min(0),
  active: z.boolean(),
})
export type Banner = z.infer<typeof bannerSchema>

export const popularServiceSchema = z.object({
  id: z.string().min(1),
  applianceId: applianceIdSchema,
  serviceKey: serviceKeySchema,
  name: z.string().min(1),
  fromPrice: paiseSchema,
  image: z.string().optional(),
  order: z.number().int().min(0),
  active: z.boolean(),
})
export type PopularService = z.infer<typeof popularServiceSchema>

// ---------------------------------------------------------------------------
// Serviceability
// ---------------------------------------------------------------------------

/** Document id is the pincode. */
export const serviceAreaSchema = z.object({
  pincode: pincodeSchema,
  city: z.string().min(1),
  area: z.string().min(1),
  active: z.boolean(),
})
export type ServiceArea = z.infer<typeof serviceAreaSchema>

// ---------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------

/** `HH:mm`, 24-hour. */
export const timeOfDaySchema = z
  .string()
  .regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'Expected a HH:mm time')

/** `YYYY-MM-DD`. */
export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a YYYY-MM-DD date')

export const slotWindowSchema = z.object({
  start: timeOfDaySchema,
  end: timeOfDaySchema,
  capacity: z.number().int().min(0),
  booked: z.number().int().min(0),
  /** Reserved by a booking that has not paid yet; released when the hold expires. */
  held: z.number().int().min(0),
})
export type SlotWindow = z.infer<typeof slotWindowSchema>

/** Document id is `${pincode}_${YYYY-MM-DD}`. */
export const slotDaySchema = z.object({
  pincode: pincodeSchema,
  date: dateKeySchema,
  windows: z.array(slotWindowSchema),
})
export type SlotDay = z.infer<typeof slotDaySchema>

export function slotDocId(pincode: string, date: string): string {
  return `${pincode}_${date}`
}

/** What the client is given: capacity numbers stay on the server. */
export const slotOptionSchema = z.object({
  start: timeOfDaySchema,
  end: timeOfDaySchema,
  availability: slotAvailabilitySchema,
})
export type SlotOption = z.infer<typeof slotOptionSchema>

export const bookedSlotSchema = z.object({
  date: dateKeySchema,
  start: timeOfDaySchema,
  end: timeOfDaySchema,
})
export type BookedSlot = z.infer<typeof bookedSlotSchema>

// ---------------------------------------------------------------------------
// Business configuration
// ---------------------------------------------------------------------------

export const cancellationPolicySchema = z.object({
  /** Cancelling this many hours or more before the slot is free. */
  freeUntilHours: z.number().int().min(0),
  feePaise: paiseSchema,
  refundDays: z.number().int().min(0),
})
export type CancellationPolicy = z.infer<typeof cancellationPolicySchema>

export const mediaLimitsSchema = z.object({
  maxPhotos: z.number().int().min(0),
  maxPhotoBytes: z.number().int().min(0),
  maxPhotoDimension: z.number().int().min(0),
  maxVideos: z.number().int().min(0),
  maxVideoBytes: z.number().int().min(0),
  maxVideoSeconds: z.number().int().min(0),
})
export type MediaLimits = z.infer<typeof mediaLimitsSchema>

/**
 * `config/business` — publicly readable. Anything a customer must not see
 * (provider keys, internal margins) belongs in `config/private` instead.
 *
 * DECISION NEEDED: legalName, gstin, address, sacCode and gstRate must be
 * confirmed with the CA before launch. The seeded values are placeholders.
 */
export const businessConfigSchema = z.object({
  legalName: z.string().min(1),
  gstin: z.string().min(1),
  address: z.string().min(1),
  sacCode: z.string().min(1),
  /** Whole percent, e.g. 18 for 18%. */
  gstRate: z.number().min(0).max(100),
  /** Home state of the seller; a different state on the invoice means IGST. */
  stateCode: z.string().min(1),
  allowPayAfterService: z.boolean(),
  cancellationPolicy: cancellationPolicySchema,
  rescheduleLimit: z.number().int().min(0),
  defaultWarrantyDays: z.number().int().min(0),
  supportPhone: z.string().min(1),
  mediaLimits: mediaLimitsSchema,
  /** How long an unpaid booking may hold a slot before it is released. */
  slotHoldMinutes: z.number().int().min(1),
  termsVersion: z.string().min(1),
})
export type BusinessConfig = z.infer<typeof businessConfigSchema>
