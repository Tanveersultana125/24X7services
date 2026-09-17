import { z } from 'zod'
import {
  applianceIdSchema,
  otpKindSchema,
  paymentPurposeSchema,
  serviceKeySchema,
  techPreferenceSchema,
} from './enums'
import {
  bookedSlotSchema,
  dateKeySchema,
  pincodeSchema,
  slotOptionSchema,
} from './catalog'
import {
  bookingDraftSchema,
  priceBreakdownSchema,
  reviewInputSchema,
  technicianPublicSchema,
} from './booking'
import { createTicketInputSchema, sendMessageInputSchema } from './support'
import { phoneSchema } from './user'

/**
 * One entry per callable: its input schema, its result schema, and the name it
 * is deployed under. The frontend's typed client and the functions' handlers
 * both read from here, so a rename or a changed field is a compile error on
 * both sides rather than a runtime surprise.
 */

// --- checkServiceability ---------------------------------------------------

export const checkServiceabilityInput = z.object({ pincode: pincodeSchema })
export const checkServiceabilityResult = z.object({
  serviceable: z.boolean(),
  city: z.string().optional(),
  area: z.string().optional(),
})

// --- joinWaitlist ----------------------------------------------------------

export const joinWaitlistInput = z.object({
  pincode: pincodeSchema,
  phone: phoneSchema.optional(),
})
export const joinWaitlistResult = z.object({ ok: z.literal(true) })

// --- searchCatalog ---------------------------------------------------------

export const searchCatalogInput = z.object({
  q: z.string().trim().min(1).max(60),
})
export const searchHitSchema = z.object({
  kind: z.enum(['appliance', 'service', 'issue']),
  applianceId: applianceIdSchema,
  serviceKey: serviceKeySchema.optional(),
  issueId: z.string().optional(),
  label: z.string(),
  sublabel: z.string().optional(),
  href: z.string().startsWith('/'),
})
export type SearchHit = z.infer<typeof searchHitSchema>
export const searchCatalogResult = z.object({
  hits: z.array(searchHitSchema),
})

// --- getDiagnosis ----------------------------------------------------------

export const getDiagnosisInput = z.object({
  applianceId: applianceIdSchema,
  issueIds: z.array(z.string().min(1)).min(1).max(10),
})
export const getDiagnosisResult = z.object({
  /** Always presented as "Possible causes", never as a verdict. */
  possibleCauses: z.array(z.string()),
  tips: z.array(z.string()),
})

// --- getAvailableSlots -----------------------------------------------------

export const getAvailableSlotsInput = z.object({
  pincode: pincodeSchema,
  fromDate: dateKeySchema,
  days: z.number().int().min(1).max(14),
})
export const getAvailableSlotsResult = z.object({
  days: z.array(
    z.object({
      date: dateKeySchema,
      windows: z.array(slotOptionSchema),
    })
  ),
})

// --- getTechnicianOptions --------------------------------------------------

export const getTechnicianOptionsInput = z.object({
  pincode: pincodeSchema,
  applianceId: applianceIdSchema,
  brandId: z.string().min(1),
  slot: bookedSlotSchema,
  preference: techPreferenceSchema,
})
export const getTechnicianOptionsResult = z.object({
  technicians: z.array(technicianPublicSchema),
})

// --- createBooking ---------------------------------------------------------

export const createBookingInput = z.object({ draft: bookingDraftSchema })
export const createBookingResult = z.object({
  bookingId: z.string(),
  displayId: z.string(),
  price: priceBreakdownSchema,
  /** Set when the visit fee is due upfront. */
  requiresPayment: z.boolean(),
  holdExpiresAt: z.number().int().optional(),
})

// --- createPaymentOrder ----------------------------------------------------

export const createPaymentOrderInput = z.object({
  bookingId: z.string().min(1),
  purpose: paymentPurposeSchema,
})
export const createPaymentOrderResult = z.object({
  orderId: z.string(),
  amount: z.number().int(),
  currency: z.literal('INR'),
  keyId: z.string(),
  bookingDisplayId: z.string(),
})

// --- verifyPayment ---------------------------------------------------------

export const verifyPaymentInput = z.object({
  bookingId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
})
export const verifyPaymentResult = z.object({
  /** `pending` means the webhook has not confirmed capture yet. */
  status: z.enum(['paid', 'pending', 'failed']),
  price: priceBreakdownSchema.optional(),
})

// --- cancelBooking ---------------------------------------------------------

export const cancelBookingInput = z.object({
  bookingId: z.string().min(1),
  reason: z.string().trim().max(500),
})
export const cancelBookingResult = z.object({
  feeCharged: z.number().int(),
  refundPaise: z.number().int(),
  refundDays: z.number().int(),
})

/** Read before the confirm dialog, so the customer sees the cost before agreeing. */
export const previewCancellationInput = z.object({
  bookingId: z.string().min(1),
})
export const previewCancellationResult = cancelBookingResult.extend({
  isFree: z.boolean(),
})

// --- rescheduleBooking -----------------------------------------------------

export const rescheduleBookingInput = z.object({
  bookingId: z.string().min(1),
  slot: bookedSlotSchema,
})
export const rescheduleBookingResult = z.object({
  slot: bookedSlotSchema,
  reschedulesLeft: z.number().int().min(0),
})

// --- respondToRepairRequest ------------------------------------------------

export const respondToRepairRequestInput = z.object({
  bookingId: z.string().min(1),
  requestId: z.string().min(1),
  /** Empty means declined; a subset means partial approval. */
  approvedItemIds: z.array(z.string().min(1)),
})
export const respondToRepairRequestResult = z.object({
  price: priceBreakdownSchema,
})

// --- getJobOtp -------------------------------------------------------------

export const getJobOtpInput = z.object({
  bookingId: z.string().min(1),
  kind: otpKindSchema,
})
export const getJobOtpResult = z.object({ otp: z.string().length(4) })

// --- submitReview ----------------------------------------------------------

export const submitReviewInput = reviewInputSchema.extend({
  bookingId: z.string().min(1),
})
export const submitReviewResult = z.object({ reviewId: z.string() })

// --- support ---------------------------------------------------------------

export const createSupportTicketInput = createTicketInputSchema
export const createSupportTicketResult = z.object({ ticketId: z.string() })

export const sendSupportMessageInput = sendMessageInputSchema
export const sendSupportMessageResult = z.object({ ok: z.literal(true) })

export const escalateTicketInput = z.object({ ticketId: z.string().min(1) })
export const escalateTicketResult = z.object({ ok: z.literal(true) })

// --- account ---------------------------------------------------------------

export const registerFcmTokenInput = z.object({ token: z.string().min(1) })
export const registerFcmTokenResult = z.object({ ok: z.literal(true) })

export const deleteAccountInput = z.object({
  /** Typed confirmation, so the call cannot fire from a stray tap. */
  confirm: z.literal('DELETE'),
})
export const deleteAccountResult = z.object({ ok: z.literal(true) })

export const getMaskedNumberInput = z.object({ bookingId: z.string().min(1) })
export const getMaskedNumberResult = z.object({ number: z.string() })

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

export const CALLABLES = {
  checkServiceability: {
    input: checkServiceabilityInput,
    result: checkServiceabilityResult,
    auth: false,
  },
  joinWaitlist: {
    input: joinWaitlistInput,
    result: joinWaitlistResult,
    auth: false,
  },
  searchCatalog: {
    input: searchCatalogInput,
    result: searchCatalogResult,
    auth: false,
  },
  getDiagnosis: {
    input: getDiagnosisInput,
    result: getDiagnosisResult,
    auth: false,
  },
  getAvailableSlots: {
    input: getAvailableSlotsInput,
    result: getAvailableSlotsResult,
    auth: false,
  },
  getTechnicianOptions: {
    input: getTechnicianOptionsInput,
    result: getTechnicianOptionsResult,
    auth: false,
  },
  createBooking: {
    input: createBookingInput,
    result: createBookingResult,
    auth: true,
  },
  createPaymentOrder: {
    input: createPaymentOrderInput,
    result: createPaymentOrderResult,
    auth: true,
  },
  verifyPayment: {
    input: verifyPaymentInput,
    result: verifyPaymentResult,
    auth: true,
  },
  previewCancellation: {
    input: previewCancellationInput,
    result: previewCancellationResult,
    auth: true,
  },
  cancelBooking: {
    input: cancelBookingInput,
    result: cancelBookingResult,
    auth: true,
  },
  rescheduleBooking: {
    input: rescheduleBookingInput,
    result: rescheduleBookingResult,
    auth: true,
  },
  respondToRepairRequest: {
    input: respondToRepairRequestInput,
    result: respondToRepairRequestResult,
    auth: true,
  },
  getJobOtp: { input: getJobOtpInput, result: getJobOtpResult, auth: true },
  submitReview: {
    input: submitReviewInput,
    result: submitReviewResult,
    auth: true,
  },
  createSupportTicket: {
    input: createSupportTicketInput,
    result: createSupportTicketResult,
    auth: true,
  },
  sendSupportMessage: {
    input: sendSupportMessageInput,
    result: sendSupportMessageResult,
    auth: true,
  },
  escalateTicket: {
    input: escalateTicketInput,
    result: escalateTicketResult,
    auth: true,
  },
  registerFcmToken: {
    input: registerFcmTokenInput,
    result: registerFcmTokenResult,
    auth: true,
  },
  deleteAccount: {
    input: deleteAccountInput,
    result: deleteAccountResult,
    auth: true,
  },
  getMaskedNumber: {
    input: getMaskedNumberInput,
    result: getMaskedNumberResult,
    auth: true,
  },
} as const

export type CallableName = keyof typeof CALLABLES
export type CallableInput<N extends CallableName> = z.infer<
  (typeof CALLABLES)[N]['input']
>
export type CallableResult<N extends CallableName> = z.infer<
  (typeof CALLABLES)[N]['result']
>
