import { assertCallableNames } from './lib/callable'
import { checkServiceability } from './catalog/serviceability'
import { joinWaitlist } from './catalog/waitlist'
import { searchCatalog } from './catalog/search'
import { getDiagnosis } from './catalog/diagnosis'
import { getAvailableSlots } from './booking/availableSlots'
import { getTechnicianOptions } from './booking/technicianOptions'
import { createBooking } from './booking/createBooking'
import { expireSlotHolds } from './booking/expireHolds'
import { assignTechnician } from './booking/assign'
import { getJobOtp } from './booking/jobOtp'
import { respondToRepairRequest } from './booking/repairApproval'
import { submitReview } from './booking/review'
import { onBookingCompleted } from './booking/complete'
import { previewCancellation, cancelBooking } from './booking/cancel'
import { rescheduleBooking } from './booking/reschedule'
import { getMaskedNumber } from './booking/maskedNumber'
import {
  createSupportTicket,
  sendSupportMessage,
  escalateTicket,
} from './support/tickets'
import { registerFcmToken, deleteAccount } from './account/account'
import { createPaymentOrder, verifyPayment } from './payments/orders'
import { createTopupOrder, verifyTopup } from './payments/topup'
import { razorpayWebhook } from './payments/webhook'
import { onUserCreate } from './auth/onUserCreate'

/**
 * The deployment surface. Every callable, trigger, scheduled job and webhook is
 * re-exported from here.
 *
 *   Phase 2  checkServiceability, joinWaitlist, searchCatalog, getDiagnosis
 *   Phase 3  getAvailableSlots, getTechnicianOptions, createBooking,
 *            createPaymentOrder, verifyPayment, razorpayWebhook,
 *            expireSlotHolds, onUserCreate
 *   Phase 4  getJobOtp, respondToRepairRequest, submitReview,
 *            assignTechnician, onBookingCompleted
 *   Phase 5  previewCancellation, cancelBooking, rescheduleBooking,
 *            createSupportTicket, sendSupportMessage, escalateTicket,
 *            registerFcmToken, deleteAccount, getMaskedNumber
 *   Phase 6  createTopupOrder, verifyTopup
 *
 * The export name is the deployed function name, which is why each callable is
 * named after its entry in the shared registry and checked against it below.
 */

// The region and the instance cap are set in lib/options, which every handler
// pulls in through defineCallable — see the note there on why they cannot be
// set from this file.

export {
  // Discovery
  checkServiceability,
  joinWaitlist,
  searchCatalog,
  getDiagnosis,
  // Booking
  getAvailableSlots,
  getTechnicianOptions,
  createBooking,
  createPaymentOrder,
  verifyPayment,
  // The balance
  createTopupOrder,
  verifyTopup,
  // The job
  getJobOtp,
  respondToRepairRequest,
  submitReview,
  // Changing or ending things
  previewCancellation,
  cancelBooking,
  rescheduleBooking,
  getMaskedNumber,
  // Support and the account
  createSupportTicket,
  sendSupportMessage,
  escalateTicket,
  registerFcmToken,
  deleteAccount,
}

// Not callables: an HTTP endpoint Razorpay posts to, a schedule, and three
// triggers. None of them is in the registry, so none is checked against it.
export {
  razorpayWebhook,
  expireSlotHolds,
  assignTechnician,
  onBookingCompleted,
  onUserCreate,
}

// The four discovery callables are open to callers who have not signed in — a
// customer checks whether we cover their area before there is any reason to
// give us a phone number. Everything else requires sign-in, which the wrapper
// enforces from the registry.
//
// DECISION NEEDED: App Check (Phase 6) is what stops the open ones being called
// from outside the app. Until it is enforced, treat the waitlist counts as
// indicative rather than real demand.
assertCallableNames({
  checkServiceability,
  joinWaitlist,
  searchCatalog,
  getDiagnosis,
  getAvailableSlots,
  getTechnicianOptions,
  createBooking,
  createPaymentOrder,
  verifyPayment,
  getJobOtp,
  respondToRepairRequest,
  submitReview,
  previewCancellation,
  cancelBooking,
  rescheduleBooking,
  getMaskedNumber,
  createSupportTicket,
  sendSupportMessage,
  escalateTicket,
  registerFcmToken,
  deleteAccount,
})
