import { setGlobalOptions } from 'firebase-functions/v2'

/**
 * The deployment surface. Every callable, trigger, scheduled job and webhook is
 * re-exported from here.
 *
 * Phase 1 establishes the shape: the region, the admin app, and the callable
 * wrapper that enforces auth, validates against the shared schemas and maps
 * errors to something safe to show a customer. The handlers themselves arrive
 * with the phase that needs them —
 *
 *   Phase 2  checkServiceability, joinWaitlist, searchCatalog, getDiagnosis
 *   Phase 3  getAvailableSlots, getTechnicianOptions, createBooking,
 *            createPaymentOrder, verifyPayment, razorpayWebhook,
 *            the hold-expiry sweep
 *   Phase 4  respondToRepairRequest, getJobOtp, submitReview, the status
 *            triggers, the invoice and warranty generation
 *   Phase 5  cancelBooking, rescheduleBooking, the support callables,
 *            registerFcmToken, deleteAccount, getMaskedNumber
 */

setGlobalOptions({
  // Mumbai, for latency and because customer data stays in India under DPDP.
  region: 'asia-south1',
  maxInstances: 20,
})

// Nothing is deployed yet. An empty index still has to compile and bundle, so
// that `npm run emulators` works from Phase 1 rather than Phase 3.
export {}
