import { assertCallableNames } from './lib/callable'
import { checkServiceability } from './catalog/serviceability'
import { joinWaitlist } from './catalog/waitlist'
import { searchCatalog } from './catalog/search'
import { getDiagnosis } from './catalog/diagnosis'
import { getAvailableSlots } from './booking/availableSlots'
import { getTechnicianOptions } from './booking/technicianOptions'
import { createBooking } from './booking/createBooking'
import { expireSlotHolds } from './booking/expireHolds'
import { createPaymentOrder, verifyPayment } from './payments/orders'
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
 *   Phase 4  respondToRepairRequest, getJobOtp, submitReview, the status
 *            triggers, the invoice and warranty generation
 *   Phase 5  cancelBooking, rescheduleBooking, the support callables,
 *            registerFcmToken, deleteAccount, getMaskedNumber
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
}

// Not callables: an HTTP endpoint Razorpay posts to, a schedule, and an auth
// trigger. None of them is in the registry, so none is checked against it.
export { razorpayWebhook, expireSlotHolds, onUserCreate }

// The four discovery callables are open to callers who have not signed in — a
// customer checks whether we cover their area before there is any reason to
// give us a phone number. Everything under Booking requires sign-in, which the
// wrapper enforces from the registry.
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
})
