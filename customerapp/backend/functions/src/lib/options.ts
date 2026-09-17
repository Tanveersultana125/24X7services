import { setGlobalOptions } from 'firebase-functions/v2'

/**
 * Deployment options, set where they are guaranteed to be set in time.
 *
 * This does not belong in index.ts. ES modules evaluate every import before the
 * importing module's own body, so a `setGlobalOptions` call at the top of
 * index.ts runs *after* each handler module has already built its `onCall` —
 * and those handlers capture the defaults, not the options. The symptom is a
 * function deployed to us-central1 while the app calls asia-south1, which 404s
 * and reads as a dropped network request rather than a misconfiguration.
 *
 * Every handler imports `defineCallable`, `defineCallable` imports this, so
 * this has run before any handler is built.
 */

/**
 * Mumbai, for latency and because customer data stays in India under DPDP.
 * `FUNCTIONS_REGION` in the frontend's firebase.ts must match this exactly.
 */
export const REGION = 'asia-south1'

setGlobalOptions({
  region: REGION,
  maxInstances: 20,
})
