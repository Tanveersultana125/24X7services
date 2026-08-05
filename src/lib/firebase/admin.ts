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

/**
 * The browser signs into NEXT_PUBLIC_FIREBASE_PROJECT_ID; the server verifies with
 * the FIREBASE_PROJECT_ID service account. If those differ, every ID token is
 * rejected for the right reason but with a useless message — so name it.
 * Returns null when they agree (or when either is unset).
 */
export function projectMismatch(): { web: string; admin: string } | null {
  const web = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const admin = process.env.FIREBASE_PROJECT_ID;
  if (!web || !admin || web === admin) return null;
  return { web, admin };
}

/** Short, loggable description of a Firebase Admin failure — never includes credentials. */
export function describeAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  const message = err instanceof Error ? err.message : String(err);
  return code ? `${code} — ${message}` : message;
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

/**
 * Held on globalThis, not in a module variable: a dev hot reload re-evaluates
 * this module and would reset the variable, while `getFirestore()` keeps
 * handing back the one instance the app already has — and calling `settings()`
 * on it a second time throws "Firestore has already been initialized", which
 * surfaced as an admin action that simply refused to work.
 */
const store = globalThis as typeof globalThis & { __24x7Firestore?: Firestore };

/** Firestore (Admin) — reused across requests. Requires a Firestore database
 * to exist in the Firebase project (Console → Firestore Database → Create). */
export function getAdminDb(): Firestore {
  if (store.__24x7Firestore) return store.__24x7Firestore;

  const db = getFirestore(getAdminApp());
  try {
    // Let Firestore silently drop `undefined` fields instead of throwing.
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Already configured on this instance — nothing left to do, and throwing
    // here would take down every route that touches the database.
  }

  store.__24x7Firestore = db;
  return db;
}
