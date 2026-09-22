import { z } from 'zod'
import {
  addressLabelSchema,
  applianceIdSchema,
  brandIdSchema,
  paymentPreferenceSchema,
} from './enums'
import { geoPointSchema, pincodeSchema } from './catalog'

/** Indian mobile number in E.164, which is what Firebase Auth returns. */
export const phoneSchema = z
  .string()
  .regex(/^\+91[6-9][0-9]{9}$/, 'Enter a valid 10-digit Indian mobile number')

/**
 * What a customer has agreed to be sent.
 *
 * Two switches, because this app sends on two channels and no others. A
 * settings screen listing SMS, email, WhatsApp and voice calls would be four
 * switches, three of which do nothing — and a switch that does nothing is
 * worse than no switch, because it is a promise the customer will act on.
 *
 * What is not here is the job itself: the message saying a technician is on
 * their way, or that a quote needs an answer. Those are the service, not
 * marketing, and there is nowhere to turn them off because turning them off
 * would mean a technician arriving at a door nobody was told about.
 */
export const notificationPrefsSchema = z.object({
  /** Push to this customer's devices. Needs the browser's permission too. */
  push: z.boolean().default(true),
  /** The list inside the app. Off means we still write it, nothing pings. */
  inApp: z.boolean().default(true),
})
export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  push: true,
  inApp: true,
}

export const consentSchema = z.object({
  termsVersion: z.string().min(1),
  acceptedAt: z.number().int().min(0),
})
export type Consent = z.infer<typeof consentSchema>

export const userProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  phone: phoneSchema.optional(),
  email: z.string().email().optional(),
  consent: consentSchema.optional(),
  fcmTokens: z.array(z.string().min(1)).default([]),
  defaultAddressId: z.string().min(1).optional(),
  /** How they would rather pay. Absent means they have never said. */
  paymentPreference: paymentPreferenceSchema.optional(),
  /**
   * Which ways we may reach them, and about what.
   *
   * Only the channels this app actually sends on appear here, because a switch
   * for a channel nobody sends on is a promise with nothing behind it. There
   * is deliberately no switch for the messages about a booking in progress —
   * see the note on the schema.
   */
  notifications: notificationPrefsSchema.optional(),
})
export type UserProfile = z.infer<typeof userProfileSchema>

/** What the profile screen may submit; phone and consent are set by auth, not by a form. */
export const updateProfileInputSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(80),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
})
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export const addressInputSchema = z.object({
  label: addressLabelSchema,
  /** Free-text name shown when label is `other`. */
  customLabel: z.string().trim().max(30).optional(),
  flat: z.string().trim().min(1, 'Flat / house number is required').max(120),
  area: z.string().trim().min(1, 'Area is required').max(160),
  landmark: z.string().trim().max(160).optional(),
  city: z.string().trim().min(1, 'City is required').max(80),
  pincode: pincodeSchema,
  geo: geoPointSchema.optional(),
})
export type AddressInput = z.infer<typeof addressInputSchema>

export const addressSchema = addressInputSchema.extend({
  id: z.string().min(1),
})
export type Address = z.infer<typeof addressSchema>

/**
 * A booking stores a copy of the address rather than a reference, so editing or
 * deleting the saved address later cannot rewrite where a past job happened.
 */
export const addressSnapshotSchema = addressSchema.extend({
  /** The saved address this was copied from, if it still exists. */
  sourceAddressId: z.string().min(1).optional(),
})
export type AddressSnapshot = z.infer<typeof addressSnapshotSchema>

// ---------------------------------------------------------------------------
// Saved appliances
// ---------------------------------------------------------------------------

export const userApplianceInputSchema = z.object({
  applianceId: applianceIdSchema,
  brandId: brandIdSchema,
  /** One of the appliance's `detailFields` options, e.g. "front-load". */
  type: z.string().min(1).optional(),
  modelNumber: z.string().trim().max(60).optional(),
  /** Storage path of the photographed model sticker. No OCR in v1. */
  modelPhotoPath: z.string().min(1).optional(),
  nickname: z.string().trim().max(40).optional(),
})
export type UserApplianceInput = z.infer<typeof userApplianceInputSchema>

export const userApplianceSchema = userApplianceInputSchema.extend({
  id: z.string().min(1),
  lastServicedAt: z.number().int().min(0).optional(),
})
export type UserAppliance = z.infer<typeof userApplianceSchema>
