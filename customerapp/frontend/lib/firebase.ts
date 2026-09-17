'use client'

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'
import {
  initializeFirestore,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'
import {
  getStorage,
  connectStorageEmulator,
  type FirebaseStorage,
} from 'firebase/storage'
import {
  getFunctions,
  connectFunctionsEmulator,
  type Functions,
} from 'firebase/functions'

/**
 * One Firebase app for the whole client. Everything is lazy: the export is a
 * static bundle, so this module is imported during prerender where none of the
 * SDKs can run, and a top-level initializeApp() would break the build.
 *
 * The region is fixed to Mumbai for Functions. Calling a callable on the
 * default region silently 404s, which reads as a network failure rather than a
 * misconfiguration.
 */

export const FUNCTIONS_REGION = 'asia-south1'

export const usingEmulators =
  process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'

/**
 * Stand-ins for the fields the SDK insists on having.
 *
 * Against the emulators none of these reaches Google and none of them means
 * anything — but `getAuth()` throws `auth/invalid-api-key` on an empty string
 * rather than on a wrong one, which takes down every screen in the app at
 * hydration with an error that says nothing about emulators. The README
 * promises that `NEXT_PUBLIC_USE_EMULATORS=true` is the only value a developer
 * has to set; this is what keeps that promise.
 *
 * They apply only when the emulators are on. A real build with a missing key
 * still fails, loudly, which is the right outcome — a placeholder silently
 * standing in for a production credential is how an app ships pointed at
 * nothing.
 */
const EMULATOR_PLACEHOLDERS = {
  apiKey: 'demo-emulator-key',
  appId: '1:0:web:demo',
  messagingSenderId: '0',
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

const config = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    (usingEmulators ? EMULATOR_PLACEHOLDERS.apiKey : undefined),
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    (usingEmulators ? `${projectId}.firebaseapp.com` : undefined),
  projectId,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (usingEmulators ? `${projectId}.appspot.com` : undefined),
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    (usingEmulators ? EMULATOR_PLACEHOLDERS.messagingSenderId : undefined),
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    (usingEmulators ? EMULATOR_PLACEHOLDERS.appId : undefined),
}

/** Emulator host, as reachable from wherever the app is running. */
const EMULATOR_HOST = process.env.NEXT_PUBLIC_EMULATOR_HOST ?? '127.0.0.1'

const APP_CHECK_SITE_KEY = process.env.NEXT_PUBLIC_APPCHECK_SITE_KEY
const APP_CHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN

let app: FirebaseApp | undefined
let appCheckStarted = false
let authInstance: Auth | undefined
let dbInstance: Firestore | undefined
let storageInstance: FirebaseStorage | undefined
let functionsInstance: Functions | undefined

function assertBrowser(): void {
  if (typeof window === 'undefined') {
    throw new Error(
      'Firebase was reached during prerender. Every call into it belongs ' +
        'inside an effect or an event handler, never in a component body.'
    )
  }
}

export function firebaseApp(): FirebaseApp {
  assertBrowser()
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(config)
    void startAppCheck(app)
  }
  return app
}

/**
 * App Check, which is what makes the open callables answerable only by this app.
 *
 * Four of them — serviceability, the waitlist, search, diagnosis — take no
 * sign-in, because a customer checks whether we cover their area before there
 * is any reason to give us a phone number. App Check is the thing that stops
 * those being scraped or used to flood the waitlist.
 *
 * It is off until a site key is configured, and it fails open rather than
 * blocking the app: an attestation that cannot be obtained should degrade to an
 * unattested request the backend can decide about, not to a white screen.
 *
 * Imported dynamically, and awaited by nothing. The whole reCAPTCHA Enterprise
 * module would otherwise sit in the chunk every screen loads, to be used once
 * on a project that has a site key — and attestation is not on the path to
 * first paint, so nothing should wait for it.
 *
 * DECISION NEEDED: this is the web path (reCAPTCHA Enterprise). Inside the
 * Android WebView it cannot attest — that needs Play Integrity through the
 * native SDK, which means adding `@capacitor-firebase/app-check`. Until both
 * are in place, leave `APP_CHECK_ENFORCED` unset on the functions or the
 * Android build will be locked out of its own backend.
 */
async function startAppCheck(instance: FirebaseApp): Promise<void> {
  if (appCheckStarted || !APP_CHECK_SITE_KEY) return
  appCheckStarted = true

  // Registers this browser as a known debug client with the console, so a
  // developer machine can pass enforcement without a real attestation.
  if (APP_CHECK_DEBUG_TOKEN) {
    ;(
      self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }
    ).FIREBASE_APPCHECK_DEBUG_TOKEN = APP_CHECK_DEBUG_TOKEN
  }

  try {
    const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import(
      'firebase/app-check'
    )
    initializeAppCheck(instance, {
      provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    })
  } catch {
    // A failed attestation is not a reason a customer cannot book.
  }
}

export function auth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(firebaseApp())
    if (usingEmulators) {
      connectAuthEmulator(authInstance, `http://${EMULATOR_HOST}:9099`, {
        disableWarnings: true,
      })
    }
  }
  return authInstance
}

/**
 * Firestore, with its own on-device copy.
 *
 * This is what "works offline" actually means here. Every screen in the app
 * reads through Firestore, so a booking the customer has already opened is
 * readable in a lift, and a write made without signal is queued and sent when
 * there is some. The service worker deliberately caches none of that — it keeps
 * the shell, and this keeps the data, which is the half that knows when it is
 * stale.
 *
 * Multi-tab is the right manager for a PWA: two tabs of the same app sharing
 * one cache, rather than the second one silently failing to get a lease.
 */
export function db(): Firestore {
  if (!dbInstance) {
    dbInstance = initializeFirestore(firebaseApp(), {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
    if (usingEmulators) {
      connectFirestoreEmulator(dbInstance, EMULATOR_HOST, 8080)
    }
  }
  return dbInstance
}

export function storage(): FirebaseStorage {
  if (!storageInstance) {
    storageInstance = getStorage(firebaseApp())
    if (usingEmulators) {
      connectStorageEmulator(storageInstance, EMULATOR_HOST, 9199)
    }
  }
  return storageInstance
}

export function functions(): Functions {
  if (!functionsInstance) {
    functionsInstance = getFunctions(firebaseApp(), FUNCTIONS_REGION)
    if (usingEmulators) {
      connectFunctionsEmulator(functionsInstance, EMULATOR_HOST, 5001)
    }
  }
  return functionsInstance
}
