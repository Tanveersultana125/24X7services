'use client'

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'
import {
  getFirestore,
  connectFirestoreEmulator,
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

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const usingEmulators =
  process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'

/** Emulator host, as reachable from wherever the app is running. */
const EMULATOR_HOST = process.env.NEXT_PUBLIC_EMULATOR_HOST ?? '127.0.0.1'

let app: FirebaseApp | undefined
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
  }
  return app
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

export function db(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(firebaseApp())
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
