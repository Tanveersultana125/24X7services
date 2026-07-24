import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Firebase Admin SDK (server only). Requires a service-account credential —
 * FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY.
 * Never import this from a Client Component.
 */

/** True when the server has the credentials needed to talk to Firebase Admin. */
export function adminConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY,
  );
}

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Private keys are stored with escaped newlines in env files.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials are not configured.");
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

let firestore: Firestore | null = null;

/** Firestore (Admin) — reused across requests. Requires a Firestore database
 * to exist in the Firebase project (Console → Firestore Database → Create). */
export function getAdminDb(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getAdminApp());
    // Let Firestore silently drop `undefined` fields instead of throwing.
    firestore.settings({ ignoreUndefinedProperties: true });
  }
  return firestore;
}
