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
})
export type CatalogService = z.infer<typeof catalogServiceSchema>

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

export const bannerSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  image: z.string().optional(),
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
