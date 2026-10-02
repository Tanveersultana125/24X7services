import { Platform } from 'react-native'
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import {
  connectAuthEmulator,
  getAuth,
  initializeAuth,
  type Auth,
} from 'firebase/auth'
// The React Native build of firebase/auth exports this; the web typings do not.
// @ts-expect-error -- resolved through the "react-native" export condition
import { getReactNativePersistence } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore'
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from 'firebase/storage'
import {
  connectFunctionsEmulator,
  getFunctions,
  type Functions,
} from 'firebase/functions'
import { asyncKv } from './storage'

/**
 * One Firebase app for the whole client, made lazily on first use.
 *
 * The same three modes as the web app, read from EXPO_PUBLIC_* instead of
 * NEXT_PUBLIC_*:
 *
 *   - demo (the default): no backend at all. Firestore is answered from the
 *     bundled seed catalog (lib/demo.ts) and nothing reaches Google. It is the
 *     default because there is no real Firebase project behind the app yet.
 *   - emulators: EXPO_PUBLIC_DEMO_MODE=false and EXPO_PUBLIC_USE_EMULATORS=true.
 *   - a real project: EXPO_PUBLIC_DEMO_MODE=false and the EXPO_PUBLIC_FIREBASE_*
 *     keys set.
 *
 * Functions are pinned to Mumbai. A callable on the default region silently
 * 404s, which reads as a network failure rather than a misconfiguration.
 */

export const FUNCTIONS_REGION = 'asia-south1'

export const demoMode = process.env.EXPO_PUBLIC_DEMO_MODE !== 'false'

export const usingEmulators =
  !demoMode && process.env.EXPO_PUBLIC_USE_EMULATORS === 'true'

const noRealProject = usingEmulators || demoMode

const PLACEHOLDERS = {
  apiKey: 'demo-emulator-key',
  appId: '1:0:web:demo',
  messagingSenderId: '0',
}

const projectId =
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  (noRealProject ? 'demo-customerapp' : undefined)

export const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    (noRealProject ? PLACEHOLDERS.apiKey : undefined),
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    (noRealProject ? `${projectId}.firebaseapp.com` : undefined),
  projectId,
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (noRealProject ? `${projectId}.appspot.com` : undefined),
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    (noRealProject ? PLACEHOLDERS.messagingSenderId : undefined),
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    (noRealProject ? PLACEHOLDERS.appId : undefined),
}

/**
 * Emulator host as the phone sees it. An Android emulator reaches the machine
 * it runs on at 10.0.2.2; a real phone needs the machine's LAN address.
 */
export const EMULATOR_HOST =
  process.env.EXPO_PUBLIC_EMULATOR_HOST ??
  (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1')

let app: FirebaseApp | undefined
let authInstance: Auth | undefined
let dbInstance: Firestore | undefined
let storageInstance: FirebaseStorage | undefined
let functionsInstance: Functions | undefined

export function firebaseApp(): FirebaseApp {
  if (!app) app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
  return app
}

/**
 * Auth keeps its session in the device store, so a customer who signed in
 * yesterday is still signed in when they open the app today.
 */
export function auth(): Auth {
  if (!authInstance) {
    authInstance =
      asyncKv === undefined
        ? getAuth(firebaseApp())
        : initializeAuth(firebaseApp(), {
            persistence: getReactNativePersistence(asyncKv),
          })
    if (usingEmulators) {
      connectAuthEmulator(authInstance, `http://${EMULATOR_HOST}:9099`, {
        disableWarnings: true,
      })
    }
  }
  return authInstance
}

/**
 * Firestore with an in-memory cache. The JS SDK has no persistent cache on
 * React Native; the demo refills its cache from the bundle on every launch.
 */
export function db(): Firestore {
  if (!dbInstance) {
    dbInstance = initializeFirestore(firebaseApp(), {
      localCache: memoryLocalCache(),
      // React Native's fetch cannot hold a WebChannel stream open.
      experimentalForceLongPolling: Platform.OS !== 'web',
    })
    if (usingEmulators) connectFirestoreEmulator(dbInstance, EMULATOR_HOST, 8080)
  }
  return dbInstance
}

export function storage(): FirebaseStorage {
  if (!storageInstance) {
    storageInstance = getStorage(firebaseApp())
    if (usingEmulators) connectStorageEmulator(storageInstance, EMULATOR_HOST, 9199)
  }
  return storageInstance
}

export function functions(): Functions {
  if (!functionsInstance) {
    functionsInstance = getFunctions(firebaseApp(), FUNCTIONS_REGION)
    if (usingEmulators) connectFunctionsEmulator(functionsInstance, EMULATOR_HOST, 5001)
  }
  return functionsInstance
}
