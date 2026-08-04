import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

/**
 * Firebase Web SDK (browser). Config values are public by design and exposed
 * via NEXT_PUBLIC_* env vars — see .env.local / README.
 */
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True when the browser SDK has enough config to initialise. */
export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId,
);

/**
 * Names of the required NEXT_PUBLIC_FIREBASE_* vars that were missing when this
 * bundle was built.
 *
 * These values are inlined at build time, so an empty result here means the
 * build didn't see them — adding them to the host afterwards changes nothing
 * until you rebuild. Only names are reported, never values.
 */
export function missingFirebaseConfig(): string[] {
  const required = {
    NEXT_PUBLIC_FIREBASE_API_KEY: firebaseConfig.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
    NEXT_PUBLIC_FIREBASE_APP_ID: firebaseConfig.appId,
  };
  return Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);
}

/**
 * Log exactly what's missing, so a live deployment can be diagnosed from the console.
 *
 * Deliberately `console.warn`: the Next dev overlay turns `console.error` into a
 * full-screen error, which makes a missing local `.env.local` look like a crash.
 */
export function logFirebaseConfigProblem(where: string) {
  const missing = missingFirebaseConfig();
  console.warn(
    `[24X7] ${where}: Firebase Web config missing from this build — ${missing.join(", ")}. ` +
      "NEXT_PUBLIC_* values are baked in at build time, so set them locally in " +
      ".env.local (then restart the dev server), or on the host for this " +
      "environment (Production AND Preview) and redeploy.",
  );
}

/** Lazily initialise (or reuse) the Firebase app and return its Auth instance. */
export function getFirebaseAuth(): Auth {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}

/**
 * What actually went wrong in `signInWithPopup`, per Firebase error code.
 *
 * These fail before the app's own server is involved, so the server logs stay
 * empty — without naming the code here there is nothing to go on.
 * `hint` is for the console (what to go fix); `message` is for the visitor.
 */
const POPUP_ERRORS: Record<string, { message: string; hint: string }> = {
  "auth/unauthorized-domain": {
    message: "Sign-in isn't allowed from this domain yet. Please contact support.",
    hint:
      "Add this site's domain in Firebase Console → Authentication → Settings → " +
      "Authorized domains. localhost is allowed by default, which is why this only " +
      "shows up once deployed.",
  },
  "auth/operation-not-allowed": {
    message: "Google sign-in isn't enabled. Please contact support.",
    hint: "Enable it in Firebase Console → Authentication → Sign-in method → Google.",
  },
  "auth/invalid-api-key": {
    message: "Sign-in is misconfigured. Please contact support.",
    hint: "NEXT_PUBLIC_FIREBASE_API_KEY is wrong for this Firebase project.",
  },
  "auth/network-request-failed": {
    message: "We couldn't reach Google. Check your connection and try again.",
    hint: "Network error, or an extension/ad-blocker blocked the Firebase request.",
  },
};

/** Visitor-facing text plus a console hint for a popup sign-in failure. */
export function describePopupError(code: string): { message: string; hint: string } {
  return (
    POPUP_ERRORS[code] ?? {
      message: "Google sign-in failed. Please try again.",
      hint: `Unhandled Firebase auth code: ${code || "(none)"}.`,
    }
  );
}

export function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}
