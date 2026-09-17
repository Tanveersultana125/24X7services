import { assertCallableNames } from './lib/callable'
import { checkServiceability } from './catalog/serviceability'
import { joinWaitlist } from './catalog/waitlist'
import { searchCatalog } from './catalog/search'
import { getDiagnosis } from './catalog/diagnosis'

/**
 * The deployment surface. Every callable, trigger, scheduled job and webhook is
 * re-exported from here.
 *
 *   Phase 2  checkServiceability, joinWaitlist, searchCatalog, getDiagnosis
 *   Phase 3  getAvailableSlots, getTechnicianOptions, createBooking,
 *            createPaymentOrder, verifyPayment, razorpayWebhook,
 *            the hold-expiry sweep
 *   Phase 4  respondToRepairRequest, getJobOtp, submitReview, the status
 *            triggers, the invoice and warranty generation
 *   Phase 5  cancelBooking, rescheduleBooking, the support callables,
 *            registerFcmToken, deleteAccount, getMaskedNumber
 *
 * The export name is the deployed function name, which is why each one is named
 * after its entry in the shared registry and checked against it below.
 */

// The region and the instance cap are set in lib/options, which every handler
// pulls in through defineCallable — see the note there on why they cannot be
// set from this file.

export { checkServiceability, joinWaitlist, searchCatalog, getDiagnosis }

// All four are callable without signing in — a customer checks whether we cover
// their area before they have any reason to give us a phone number.
//
// DECISION NEEDED: that is also four unauthenticated entry points. App Check
// (Phase 6) is what stops them being called from outside the app; until it is
// enforced, treat the waitlist counts as indicative rather than real demand.
assertCallableNames({
  checkServiceability,
  joinWaitlist,
  searchCatalog,
  getDiagnosis,
})
